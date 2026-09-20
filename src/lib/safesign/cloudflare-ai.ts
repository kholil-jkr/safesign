// SafeSign — server-side Cloudflare Workers AI client.
// Brief §5: the LLM API key is held server-side only (never in frontend JS).
// Primary model: llama-4-scout (verified working, strong multilingual);
// fallback: llama-3.3-70b-instruct-fp8-fast.

export interface ChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const CF_API_BASE = "https://api.cloudflare.com/client/v4";

function getCredentials() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    throw new Error("MISSING_CREDENTIALS");
  }
  return { accountId, apiToken };
}

/**
 * Run a chat completion against Cloudflare Workers AI.
 * Tries the primary model first, falls back to the secondary model on failure.
 */
export async function cfChatCompletion(
  messages: ChatCompletionMessage[],
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const { accountId, apiToken } = getCredentials();
  const primary = process.env.SAFESIGN_PRIMARY_MODEL || "@cf/meta/llama-4-scout-17b-16e-instruct";
  const fallback = process.env.SAFESIGN_FALLBACK_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

  const body = JSON.stringify({
    messages,
    max_tokens: options.maxTokens ?? 2048,
    temperature: options.temperature ?? 0.2,
  });

  const models = [primary, fallback];
  let lastError: unknown = null;

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90_000); // 90s hard cap
      const res = await fetch(`${CF_API_BASE}/accounts/${accountId}/ai/run/${model}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`CF_HTTP_${res.status}`);
      }
      const data = (await res.json()) as {
        success?: boolean;
        result?: {
          response?: string | Record<string, unknown>;
          choices?: { message?: { content?: string } }[];
        };
        errors?: { message?: string }[];
      };

      if (data.success === false) {
        throw new Error(`CF_API_ERROR: ${data.errors?.map((e) => e.message).join("; ")}`);
      }

      // Workers AI returns either OpenAI-style choices[] or a plain response field
      let text = data.result?.choices?.[0]?.message?.content ?? "";
      if (!text && typeof data.result?.response === "string") {
        text = data.result.response;
      }
      if (!text && data.result?.response && typeof data.result.response === "object") {
        // Some models put the JSON object directly in response
        text = JSON.stringify(data.result.response);
      }
      text = (text ?? "").trim();
      if (!text) {
        throw new Error("CF_EMPTY_RESPONSE");
      }
      return text;
    } catch (err) {
      lastError = err;
      // try the fallback model
    }
  }
  throw lastError instanceof Error ? lastError : new Error("CF_ALL_MODELS_FAILED");
}

/**
 * Extract a JSON object from an LLM reply that may contain markdown fences
 * or stray text around the JSON. Returns null if nothing parses.
 */
export function extractJson<T>(raw: string): T | null {
  let text = raw.trim();
  // Strip markdown code fences if present
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }
  // Direct parse attempt
  try {
    return JSON.parse(text) as T;
  } catch {
    // fall through
  }
  // Find the outermost {...} and try to parse it
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    const candidate = text.slice(start, end + 1);
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // Last resort: fix common issues like trailing commas
      try {
        const fixed = candidate.replace(/,\s*([}\]])/g, "$1");
        return JSON.parse(fixed) as T;
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** OCR prompt for contract photos / scanned pages (upload feature). */
const OCR_PROMPT = `You are a precise OCR engine. Transcribe ALL text visible in this image exactly as written, in the original language and script.
Rules:
- Keep the original language. Never translate, summarize, or explain.
- Preserve the reading order (top to bottom) and the line/paragraph structure with line breaks.
- Reproduce numbers, names, dates, amounts, currencies and punctuation exactly as shown.
- Include headings, tables, signature blocks and stamps as best you can read them.
- If a word is unreadable, write [?] in its place.
- If the image contains no readable text at all, output exactly: [NO_TEXT]
Output ONLY the transcription — no introductions, no comments, no markdown code fences.`;

/**
 * Transcribe text from an image (photo of a contract, rendered PDF page)
 * using a multimodal Workers AI model. Returns the raw transcription.
 * Throws Error("NO_TEXT") when the model reports no readable text.
 */
export async function cfVisionTranscribe(
  imageBase64: string,
  mime: string,
  options: { maxTokens?: number } = {}
): Promise<string> {
  const { accountId, apiToken } = getCredentials();
  // llama-4-scout is multimodal (verified: EN/ID/AR OCR). Overridable via env.
  const model =
    process.env.SAFESIGN_VISION_MODEL ||
    process.env.SAFESIGN_PRIMARY_MODEL ||
    "@cf/meta/llama-4-scout-17b-16e-instruct";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  let text = "";
  try {
    const res = await fetch(`${CF_API_BASE}/accounts/${accountId}/ai/run/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: OCR_PROMPT },
              { type: "image_url", image_url: { url: `data:${mime};base64,${imageBase64}` } },
            ],
          },
        ],
        max_tokens: options.maxTokens ?? 3072,
        temperature: 0,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`CF_HTTP_${res.status}`);
    }
    const data = (await res.json()) as {
      success?: boolean;
      result?: {
        response?: string | Record<string, unknown>;
        choices?: { message?: { content?: string } }[];
      };
      errors?: { message?: string }[];
    };
    if (data.success === false) {
      throw new Error(`CF_API_ERROR: ${data.errors?.map((e) => e.message).join("; ")}`);
    }
    text = data.result?.choices?.[0]?.message?.content ?? "";
    if (!text && typeof data.result?.response === "string") {
      text = data.result.response;
    }
  } finally {
    clearTimeout(timeout);
  }

  // Clean up common wrapper artifacts
  text = (text ?? "").trim();
  const fence = text.match(/^```[a-z]*\s*([\s\S]*?)```$/i);
  if (fence) text = fence[1].trim();
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    text = text.slice(1, -1).trim();
  }
  if (!text || /^\[NO_TEXT\]$/i.test(text)) {
    throw new Error("NO_TEXT");
  }
  return text;
}

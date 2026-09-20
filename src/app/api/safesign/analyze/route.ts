// SafeSign — contract analysis endpoint (Brief §4.1, §6.1).
// Holds the LLM API key server-side; returns the structured JSON analysis.

import { NextRequest, NextResponse } from "next/server";
import { cfChatCompletion, extractJson } from "@/lib/safesign/cloudflare-ai";
import { buildAnalysisSystemPrompt } from "@/lib/safesign/prompts";
import { isValidLang } from "@/lib/safesign/i18n";
import type { AnalysisResult } from "@/lib/safesign/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_CONTRACT_CHARS = 20_000;
const MIN_CONTRACT_CHARS = 20;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { contractText?: string; lang?: string };
    const contractText = (body.contractText ?? "").trim();
    const lang = isValidLang(body.lang) ? body.lang : "en";

    if (contractText.length < MIN_CONTRACT_CHARS) {
      return NextResponse.json({ ok: false, error: "EMPTY" }, { status: 400 });
    }
    if (contractText.length > MAX_CONTRACT_CHARS) {
      return NextResponse.json({ ok: false, error: "TOO_LONG" }, { status: 400 });
    }

    const systemPrompt = buildAnalysisSystemPrompt(lang);
    const userPrompt = `CONTRACT TEXT (language may differ from the output language; auto-detect it):
"""
${contractText}
"""

Analyze this contract now and respond with the JSON object only, written in ${lang === "en" ? "English" : "the target output language"}.`;

    const raw = await cfChatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 2600, temperature: 0.2 }
    );

    const parsed = extractJson<Partial<AnalysisResult>>(raw);
    if (!parsed || !parsed.summary || !parsed.risk_level) {
      // One retry with a stricter instruction (models occasionally add prose)
      const retry = await cfChatCompletion(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
          {
            role: "assistant",
            content: raw.slice(0, 400),
          },
          {
            role: "user",
            content: "Your previous reply was not valid JSON. Output ONLY the raw JSON object now, starting with { and ending with }. No other text.",
          },
        ],
        { maxTokens: 2600, temperature: 0 }
      );
      const reparsed = extractJson<Partial<AnalysisResult>>(retry);
      if (!reparsed || !reparsed.summary || !reparsed.risk_level) {
        return NextResponse.json({ ok: false, error: "PARSE_FAILED" }, { status: 502 });
      }
      return NextResponse.json({ ok: true, analysis: normalizeAnalysis(reparsed) });
    }

    return NextResponse.json({ ok: true, analysis: normalizeAnalysis(parsed) });
  } catch (err) {
    console.error("[safesign/analyze] error:", err);
    const message = err instanceof Error ? err.message : "UNKNOWN";
    return NextResponse.json(
      { ok: false, error: message === "MISSING_CREDENTIALS" ? "CONFIG" : "UPSTREAM" },
      { status: 502 }
    );
  }
}

function normalizeAnalysis(a: Partial<AnalysisResult>): AnalysisResult {
  const level = a.risk_level === "low" || a.risk_level === "medium" || a.risk_level === "high" ? a.risk_level : "medium";
  return {
    risk_level: level,
    risk_reason: a.risk_reason ?? "",
    summary: a.summary ?? "",
    red_flags: Array.isArray(a.red_flags)
      ? a.red_flags
          .filter((f) => f && (f.clause || f.explanation))
          .map((f) => ({ clause: f.clause ?? "", explanation: f.explanation ?? "" }))
      : [],
    next_steps: a.next_steps ?? "",
    disclaimer: a.disclaimer ?? "",
  };
}

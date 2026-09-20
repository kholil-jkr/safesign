// SafeSign — chat consultation endpoint (Brief §4.3, §6.2).
// Receives contract + prior analysis + recent history (capped) and the new
// message; enforces the session turn limit server-side as well.

import { NextRequest, NextResponse } from "next/server";
import { cfChatCompletion } from "@/lib/safesign/cloudflare-ai";
import { buildChatSystemPrompt } from "@/lib/safesign/prompts";
import { isValidLang } from "@/lib/safesign/i18n";
import type { AnalysisResult, ChatMessage } from "@/lib/safesign/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_CONTRACT_CHARS = 20_000;
const MAX_TURNS = 8; // Brief §4.4 optional safeguard
const MAX_HISTORY = 12; // last ~6 exchanges sent to the LLM

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      contractText?: string;
      analysis?: Partial<AnalysisResult>;
      history?: ChatMessage[];
      message?: string;
      lang?: string;
      turnsUsed?: number;
    };

    const contractText = (body.contractText ?? "").trim();
    const message = (body.message ?? "").trim();
    const lang = isValidLang(body.lang) ? body.lang : "en";
    const turnsUsed = Number.isFinite(body.turnsUsed) ? Number(body.turnsUsed) : 0;

    if (!message) {
      return NextResponse.json({ ok: false, error: "EMPTY" }, { status: 400 });
    }
    if (message.length > 2000 || contractText.length > MAX_CONTRACT_CHARS) {
      return NextResponse.json({ ok: false, error: "TOO_LONG" }, { status: 400 });
    }
    if (turnsUsed >= MAX_TURNS) {
      return NextResponse.json({ ok: false, error: "TURN_LIMIT" }, { status: 429 });
    }
    if (!contractText) {
      return NextResponse.json({ ok: false, error: "NO_CONTRACT" }, { status: 400 });
    }

    const turnsLeft = MAX_TURNS - turnsUsed;
    const systemPrompt = buildChatSystemPrompt(lang, turnsLeft);

    const analysis = body.analysis ?? {};
    const analysisContext = JSON.stringify(
      {
        risk_level: analysis.risk_level ?? "unknown",
        risk_reason: analysis.risk_reason ?? "",
        summary: analysis.summary ?? "",
        red_flags: analysis.red_flags ?? [],
        next_steps: analysis.next_steps ?? "",
      },
      null,
      2
    );

    const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY) : [];

    const messages: Parameters<typeof cfChatCompletion>[0] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `[CONTEXT — for reference only, do not repeat verbatim]
ORIGINAL CONTRACT:
"""
${contractText.slice(0, MAX_CONTRACT_CHARS)}
"""

PRIOR STRUCTURED ANALYSIS (JSON):
${analysisContext}

[END OF CONTEXT]`,
      },
      ...history.map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.content.slice(0, 2000),
      })),
      { role: "user", content: message },
    ];

    const reply = await cfChatCompletion(messages, { maxTokens: 900, temperature: 0.4 });
    return NextResponse.json({ ok: true, reply });
  } catch (err) {
    console.error("[safesign/chat] error:", err);
    const message = err instanceof Error ? err.message : "UNKNOWN";
    return NextResponse.json(
      { ok: false, error: message === "MISSING_CREDENTIALS" ? "CONFIG" : "UPSTREAM" },
      { status: 502 }
    );
  }
}

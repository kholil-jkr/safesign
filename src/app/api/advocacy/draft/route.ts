// SafeSign Advokasi — AI menyusun draf email advokasi (bahasa lembaga + terjemahan).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cfChatCompletion, extractJson } from "@/lib/safesign/cloudflare-ai";
import { buildDraftMessages } from "@/lib/advocacy/prompts";
import { CATEGORY_META, type CaseCategory, type EmailDraft } from "@/lib/advocacy/types";
import { safeParseJsonArray } from "@/lib/advocacy/serialize";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface AnalysisShape {
  risk_level?: string;
  red_flags?: unknown[];
}

function normalizeDraft(raw: Partial<EmailDraft> | null): EmailDraft | null {
  if (!raw) return null;
  const subject = typeof raw.subject === "string" ? raw.subject.trim() : "";
  const body = typeof raw.body === "string" ? raw.body.trim() : "";
  if (!subject || body.length < 80) return null;
  const bodyUser =
    typeof raw.bodyUser === "string" && raw.bodyUser.trim().length > 40 ? raw.bodyUser.trim() : null;
  const attachments = Array.isArray(raw.attachments)
    ? raw.attachments.filter((a): a is string => typeof a === "string").slice(0, 12)
    : [];
  return {
    subject: subject.slice(0, 250),
    body,
    bodyUser,
    advice: typeof raw.advice === "string" ? raw.advice.trim().slice(0, 600) : null,
    attachments,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const category = String(body.category ?? "") as CaseCategory;
    if (!CATEGORY_META[category]) {
      return NextResponse.json({ ok: false, error: "CATEGORY_INVALID" }, { status: 400 });
    }
    const chronology = String(body.chronology ?? "").trim();
    if (chronology.length < 30) {
      return NextResponse.json({ ok: false, error: "CHRONOLOGY_TOO_SHORT" }, { status: 400 });
    }
    const institutionId = String(body.institutionId ?? "");
    const institution = await db.institution.findUnique({ where: { id: institutionId } });
    if (!institution) {
      return NextResponse.json({ ok: false, error: "INSTITUTION_NOT_FOUND" }, { status: 404 });
    }

    // Kontrak terkait (opsional) — fakta kontrak memperkuat email
    let contractInput: {
      contractNo: string | null;
      partyA: string | null;
      partyB: string | null;
      startDate: string | null;
      endDate: string | null;
      value: number | null;
      currency: string;
      riskLevel: string | null;
      redFlagCount: number;
    } | null = null;
    if (typeof body.contractId === "string" && body.contractId) {
      const c = await db.contract.findUnique({ where: { id: body.contractId } });
      if (c) {
        let analysis: AnalysisShape | null = null;
        try {
          analysis = JSON.parse(c.analysisJson ?? "null") as AnalysisShape | null;
        } catch {
          analysis = null;
        }
        contractInput = {
          contractNo: c.contractNo,
          partyA: c.partyA,
          partyB: c.partyB,
          startDate: c.startDate ? c.startDate.toISOString().slice(0, 10) : null,
          endDate: c.endDate ? c.endDate.toISOString().slice(0, 10) : null,
          value: c.value,
          currency: c.currency,
          riskLevel: analysis?.risk_level ?? c.riskLevel ?? null,
          redFlagCount: Array.isArray(analysis?.red_flags) ? analysis.red_flags.length : 0,
        };
      }
    }

    const attachmentsRaw = Array.isArray(body.attachments)
      ? body.attachments.filter((a): a is string => typeof a === "string")
      : [];
    const workerNameRaw = typeof body.workerName === "string" && body.workerName.trim() ? body.workerName.trim() : null;
    const anonymous = body.anonymous === true;

    const messages = buildDraftMessages({
      category,
      categoryLabel: CATEGORY_META[category].label,
      priority: String(body.priority ?? "medium"),
      chronology: chronology.slice(0, 8000),
      originCountry: String(body.originCountry ?? "Indonesia").slice(0, 60),
      destinationCountry:
        typeof body.destinationCountry === "string" && body.destinationCountry && body.destinationCountry !== "none"
          ? body.destinationCountry.slice(0, 60)
          : null,
      anonymous,
      userLanguage: "Indonesian",
      workerName: anonymous ? null : workerNameRaw,
      institution: {
        name: institution.name,
        language: institution.language,
        type: institution.type,
        jurisdiction: institution.jurisdiction,
      },
      contract: contractInput,
      attachments: attachmentsRaw.slice(0, 10),
    });

    let draft: EmailDraft | null = null;
    let lastError = "";
    for (let attempt = 0; attempt < 2 && !draft; attempt++) {
      try {
        const raw = await cfChatCompletion(messages, { maxTokens: 3072, temperature: 0.3 });
        draft = normalizeDraft(extractJson<Partial<EmailDraft>>(raw));
        if (!draft) lastError = "AI_JSON_INVALID";
      } catch (err) {
        lastError = err instanceof Error ? err.message : "AI_FAILED";
        if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
      }
    }
    if (!draft) {
      return NextResponse.json({ ok: false, error: `AI_DRAFT_FAILED: ${lastError}` }, { status: 502 });
    }
    if (draft.attachments.length === 0 && attachmentsRaw.length > 0) {
      draft.attachments = attachmentsRaw.slice(0, 10);
    }

    return NextResponse.json({
      ok: true,
      draft,
      institution: {
        id: institution.id,
        name: institution.name,
        shortName: institution.shortName,
        language: institution.language,
        email: institution.email,
        website: institution.website,
      },
    });
  } catch (err) {
    console.error("[advocacy/draft POST]", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}

// SafeSign Advokasi — AI menyusun draf email TINDAK LANJUT (follow-up) untuk
// kasus terkirim yang belum mendapat respon. Draf tidak dipersist — hanya dikirim
// kembali ke klien untuk direview pengguna sebelum izin pengiriman diberikan.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cfChatCompletion, extractJson } from "@/lib/safesign/cloudflare-ai";
import { buildFollowUpMessages } from "@/lib/advocacy/prompts";
import { CATEGORY_META, type CaseCategory, type EmailDraft } from "@/lib/advocacy/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function normalizeDraft(raw: Partial<EmailDraft> | null): EmailDraft | null {
  if (!raw) return null;
  const subject = typeof raw.subject === "string" ? raw.subject.trim() : "";
  const body = typeof raw.body === "string" ? raw.body.trim() : "";
  if (!subject || body.length < 60) return null;
  return {
    subject: subject.slice(0, 250),
    body,
    bodyUser:
      typeof raw.bodyUser === "string" && raw.bodyUser.trim().length > 40 ? raw.bodyUser.trim() : null,
    advice: typeof raw.advice === "string" ? raw.advice.trim().slice(0, 600) : null,
    attachments: [],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const caseId = String(body.caseId ?? "");
    const c = await db.advocacyCase.findUnique({
      where: { id: caseId },
      include: { institution: true, emails: true },
    });
    if (!c) {
      return NextResponse.json({ ok: false, error: "CASE_NOT_FOUND" }, { status: 404 });
    }
    if (c.status !== "sent" && c.status !== "followed_up") {
      return NextResponse.json({ ok: false, error: "CASE_NOT_SENT" }, { status: 400 });
    }

    const sentEmails = c.emails
      .filter((e) => e.status === "sent")
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const first = sentEmails[0];
    if (!first) {
      return NextResponse.json({ ok: false, error: "NO_SENT_EMAIL" }, { status: 400 });
    }

    const daysSinceSent = c.sentAt
      ? Math.max(1, Math.floor((Date.now() - c.sentAt.getTime()) / 86_400_000))
      : 30;

    const messages = buildFollowUpMessages({
      institutionName: c.institution.name,
      institutionLanguage: c.institution.language,
      originalSubject: first.subject,
      sentAt: (c.sentAt ?? first.sentAt ?? first.createdAt).toISOString().slice(0, 10),
      followUpNumber: sentEmails.filter((e) => e.type === "followup").length + 1,
      daysSinceSent,
      caseNumber: c.caseNumber,
      categoryLabel: CATEGORY_META[c.category as CaseCategory]?.label ?? c.category,
      chronologyBrief: (c.chronology ?? "").slice(0, 300),
      userLanguage: "Indonesian",
      workerName: c.anonymous ? null : c.createdByName,
      anonymous: c.anonymous,
    });

    let draft: EmailDraft | null = null;
    let lastError = "";
    for (let attempt = 0; attempt < 2 && !draft; attempt++) {
      try {
        const raw = await cfChatCompletion(messages, { maxTokens: 2048, temperature: 0.3 });
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

    return NextResponse.json({ ok: true, draft, institution: { name: c.institution.name, language: c.institution.language } });
  } catch (err) {
    console.error("[advocacy/followup POST]", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}

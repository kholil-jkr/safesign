// SafeSign Advokasi — daftar kasus & pembuatan kasus (menyimpan draf email AI)
// Kasus bersifat PRIBADI: hanya visible & bisa dibuat oleh user yang login.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeCase } from "@/lib/advocacy/serialize";
import { CATEGORY_META, type AttachmentItem } from "@/lib/advocacy/types";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["draft", "sent", "followed_up", "in_progress", "resolved", "closed"];

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "LOGIN_REQUIRED" }, { status: 401 });
  try {
    const sp = req.nextUrl.searchParams;
    const status = sp.get("status") ?? "";
    const where = {
      userId: user.id,
      ...(VALID_STATUSES.includes(status) ? { status } : {}),
    };

    const cases = await db.advocacyCase.findMany({
      where,
      include: { institution: true, emails: true },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ ok: true, cases: cases.map(serializeCase) });
  } catch (err) {
    console.error("[advocacy/cases GET]", err);
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "LOGIN_REQUIRED" }, { status: 401 });
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const title = String(body.title ?? "").trim();
    const category = String(body.category ?? "");
    const institutionId = String(body.institutionId ?? "");
    const draft = body.draft as
      | { subject?: unknown; body?: unknown; bodyUser?: unknown; advice?: unknown; attachments?: unknown }
      | undefined;

    if (title.length < 5) {
      return NextResponse.json({ ok: false, error: "TITLE_REQUIRED" }, { status: 400 });
    }
    if (!CATEGORY_META[category as keyof typeof CATEGORY_META]) {
      return NextResponse.json({ ok: false, error: "CATEGORY_INVALID" }, { status: 400 });
    }
    if (!draft || typeof draft.subject !== "string" || !draft.subject.trim() || typeof draft.body !== "string" || draft.body.trim().length < 80) {
      return NextResponse.json({ ok: false, error: "DRAFT_REQUIRED" }, { status: 400 });
    }
    const institution = await db.institution.findUnique({ where: { id: institutionId } });
    if (!institution) {
      return NextResponse.json({ ok: false, error: "INSTITUTION_NOT_FOUND" }, { status: 404 });
    }

    const year = new Date().getFullYear();
    const seq = (await db.advocacyCase.count()) + 1;
    const caseNumber = `ADV-${year}-${String(seq).padStart(4, "0")}`;

    const now = new Date().toISOString();
    const attachments: AttachmentItem[] = Array.isArray(body.attachments)
      ? (body.attachments as AttachmentItem[])
          .filter((a) => a && typeof a.name === "string" && a.name.trim())
          .slice(0, 10)
          .map((a) => ({ name: String(a.name).slice(0, 160), kind: String(a.kind ?? "evidence") }))
      : [];

    const c = await db.advocacyCase.create({
      data: {
        caseNumber,
        userId: user.id,
        title: title.slice(0, 250),
        category,
        priority: ["low", "medium", "high", "urgent"].includes(String(body.priority)) ? String(body.priority) : "medium",
        status: "draft",
        originCountry: String(body.originCountry ?? "Indonesia").slice(0, 60),
        destinationCountry:
          typeof body.destinationCountry === "string" && body.destinationCountry && body.destinationCountry !== "none"
            ? body.destinationCountry.slice(0, 60)
            : null,
        chronology: typeof body.chronology === "string" ? body.chronology.slice(0, 8000) : null,
        anonymous: body.anonymous === true,
        contractId: typeof body.contractId === "string" && body.contractId ? body.contractId : null,
        institutionId,
        timelineJson: JSON.stringify([
          { at: now, event: "CREATED", note: "Kasus dibuat melalui wizard Advokasi" },
          { at: now, event: "DRAFT_CREATED", note: `AI menyusun draf email ke ${institution.shortName ?? institution.name}` },
        ]),
        attachmentsJson: JSON.stringify(attachments),
        createdByEmail: user.email,
        createdByName: user.name,
      },
    });

    await db.caseEmail.create({
      data: {
        caseId: c.id,
        type: "initial",
        subject: String(draft.subject).slice(0, 250),
        body: String(draft.body).slice(0, 20000),
        bodyUser: typeof draft.bodyUser === "string" ? draft.bodyUser.slice(0, 20000) : null,
        advice: typeof draft.advice === "string" ? draft.advice.slice(0, 600) : null,
        attachmentsJson: JSON.stringify(
          Array.isArray(draft.attachments) ? draft.attachments.filter((a): a is string => typeof a === "string").slice(0, 12) : []
        ),
        status: "draft",
      },
    });

    const created = await db.advocacyCase.findUnique({
      where: { id: c.id },
      include: { institution: true, emails: true },
    });
    return NextResponse.json({ ok: true, case: created ? serializeCase(created) : null });
  } catch (err) {
    console.error("[advocacy/cases POST]", err);
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
}

// SafeSign Advokasi — detail kasus (email + timeline), sunting draf, ubah status, catatan
// Akses: HANYA pemilik kasus (user login) — isolasi antarpengguna.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeCase } from "@/lib/advocacy/serialize";
import type { TimelineEntry } from "@/lib/advocacy/types";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const SETTABLE_STATUSES = ["in_progress", "resolved", "closed"];

async function pushTimeline(caseId: string, entry: TimelineEntry) {
  const c = await db.advocacyCase.findUnique({ where: { id: caseId }, select: { timelineJson: true } });
  if (!c) return null;
  let timeline: TimelineEntry[] = [];
  try {
    timeline = JSON.parse(c.timelineJson) as TimelineEntry[];
    if (!Array.isArray(timeline)) timeline = [];
  } catch {
    timeline = [];
  }
  timeline.push(entry);
  const updated = await db.advocacyCase.update({
    where: { id: caseId },
    data: { timelineJson: JSON.stringify(timeline) },
    include: { institution: true, emails: true },
  });
  return updated;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "LOGIN_REQUIRED" }, { status: 401 });
  try {
    const { id } = await params;
    const c = await db.advocacyCase.findUnique({
      where: { id },
      include: { institution: true, emails: true },
    });
    if (!c || c.userId !== user.id) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ ok: true, case: serializeCase(c) });
  } catch (err) {
    console.error("[advocacy/cases/[id] GET]", err);
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "LOGIN_REQUIRED" }, { status: 401 });
  try {
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const c = await db.advocacyCase.findUnique({ where: { id }, include: { emails: true } });
    if (!c || c.userId !== user.id) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    // 1) Sunting draf email (hanya email berstatus draft)
    if (typeof body.subject === "string" || typeof body.body === "string") {
      const draftEmail = c.emails.find((e) => e.type === "initial" && e.status === "draft");
      if (!draftEmail) {
        return NextResponse.json({ ok: false, error: "NO_DRAFT_EMAIL" }, { status: 400 });
      }
      const subject = typeof body.subject === "string" ? body.subject.trim().slice(0, 250) : draftEmail.subject;
      const emailBody = typeof body.body === "string" ? body.body.trim().slice(0, 20000) : draftEmail.body;
      if (!subject || emailBody.length < 80) {
        return NextResponse.json({ ok: false, error: "DRAFT_INVALID" }, { status: 400 });
      }
      await db.caseEmail.update({ where: { id: draftEmail.id }, data: { subject, body: emailBody } });
      const updated = await pushTimeline(id, { at: new Date().toISOString(), event: "DRAFT_UPDATED", note: "Draf email disunting oleh pengguna" });
      return NextResponse.json({ ok: true, case: updated ? serializeCase(updated) : null });
    }

    // 2) Ubah status (dengan catatan opsional)
    if (typeof body.status === "string") {
      if (!SETTABLE_STATUSES.includes(body.status)) {
        return NextResponse.json({ ok: false, error: "STATUS_INVALID" }, { status: 400 });
      }
      await db.advocacyCase.update({ where: { id }, data: { status: body.status } });
      const labels: Record<string, string> = {
        in_progress: "Lembaga mulai menangani kasus",
        resolved: "Kasus selesai",
        closed: "Kasus ditutup",
      };
      const updated = await pushTimeline(id, {
        at: new Date().toISOString(),
        event: "STATUS_CHANGED",
        note: typeof body.note === "string" && body.note.trim() ? body.note.trim().slice(0, 500) : labels[body.status],
        by: typeof body.by === "string" ? body.by.slice(0, 200) : undefined,
      });
      return NextResponse.json({ ok: true, case: updated ? serializeCase(updated) : null });
    }

    // 3) Tambah catatan timeline
    if (typeof body.note === "string" && body.note.trim()) {
      const updated = await pushTimeline(id, {
        at: new Date().toISOString(),
        event: "NOTE",
        note: body.note.trim().slice(0, 500),
        by: typeof body.by === "string" ? body.by.slice(0, 200) : undefined,
      });
      return NextResponse.json({ ok: true, case: updated ? serializeCase(updated) : null });
    }

    return NextResponse.json({ ok: false, error: "NOTHING_TO_DO" }, { status: 400 });
  } catch (err) {
    console.error("[advocacy/cases/[id] PATCH]", err);
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
}

// SafeSign Advokasi — kirim email TINDAK LANJUT (follow-up) dengan gerbang izin.
// Draf tindak lanjut disusun AI via /api/advocacy/followup, direview pengguna,
// lalu dikirim ke sini dengan { confirm: true } dan isi draf final.
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import { serializeCase } from "@/lib/advocacy/serialize";
import type { TimelineEntry } from "@/lib/advocacy/types";
import { getSessionUser } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "LOGIN_REQUIRED" }, { status: 401 });

  const rl = rateLimit(`send-email:${user.id}`, 10, 3_600_000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "RATE_LIMITED", retryAfter: rl.retryAfter }, { status: 429 });
  }

  try {
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;

    // ── GERBANG IZIN ──
    if (body.confirm !== true) {
      return NextResponse.json({ ok: false, error: "PERMISSION_REQUIRED" }, { status: 403 });
    }

    const subject = typeof body.subject === "string" ? body.subject.trim().slice(0, 250) : "";
    const emailBody = typeof body.body === "string" ? body.body.trim().slice(0, 20000) : "";
    if (!subject || emailBody.length < 60) {
      return NextResponse.json({ ok: false, error: "DRAFT_INVALID" }, { status: 400 });
    }

    const c = await db.advocacyCase.findUnique({ where: { id }, include: { institution: true, emails: true } });
    if (!c || c.userId !== user.id) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    if (c.status !== "sent" && c.status !== "followed_up") {
      return NextResponse.json({ ok: false, error: "CASE_NOT_SENT" }, { status: 400 });
    }
    // Lembaga tanpa email resmi → tetap diproses dalam mode manual

    const now = new Date();
    const by = typeof body.by === "string" ? body.by.slice(0, 200) : undefined;
    const noEmail = !c.institution.email;

    let mode: "smtp" | "manual" = "manual";
    if (!noEmail && smtpConfigured()) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT ?? 587),
          secure: process.env.SMTP_SECURE === "true",
          auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
        });
        await transporter.sendMail({
          from: process.env.SMTP_FROM!,
          to: c.institution.email!,
          replyTo: user.email,
          subject,
          text: emailBody,
        });
        mode = "smtp";
      } catch (mailErr) {
        console.error("[advocacy/followup-send SMTP]", mailErr);
        return NextResponse.json({ ok: false, error: "SMTP_ERROR" }, { status: 502 });
      }
    }

    const followUpNumber = c.emails.filter((e) => e.type === "followup" && e.status === "sent").length + 1;
    await db.caseEmail.create({
      data: {
        caseId: id,
        type: "followup",
        subject,
        body: emailBody,
        bodyUser: typeof body.bodyUser === "string" ? body.bodyUser.slice(0, 20000) : null,
        advice: typeof body.advice === "string" ? body.advice.slice(0, 600) : null,
        attachmentsJson: "[]",
        status: "sent",
        sentAt: now,
      },
    });
    await db.advocacyCase.update({
      where: { id },
      data: {
        status: "followed_up",
        followUpDue: new Date(now.getTime() + 14 * 86_400_000),
      },
    });

    const fresh = await db.advocacyCase.findUnique({ where: { id }, include: { institution: true, emails: true } });
    if (fresh) {
      let timeline: TimelineEntry[] = [];
      try {
        timeline = JSON.parse(fresh.timelineJson) as TimelineEntry[];
      } catch {
        timeline = [];
      }
      timeline.push({ at: now.toISOString(), event: "APPROVED", note: "Pengguna mengizinkan pengiriman tindak lanjut", by });
      timeline.push({
        at: now.toISOString(),
        event: "FOLLOWUP_SENT",
        note: noEmail
          ? `Tindak lanjut #${followUpNumber} tercatat ke ${c.institution.shortName ?? c.institution.name} — kirim manual via situs web/telepon`
          : `Tindak lanjut #${followUpNumber} tercatat terkirim ke ${c.institution.email} (${mode === "smtp" ? "SMTP" : "mode manual"})`,
        by,
      });
      await db.advocacyCase.update({ where: { id }, data: { timelineJson: JSON.stringify(timeline) } });
    }
    const finalCase = await db.advocacyCase.findUnique({ where: { id }, include: { institution: true, emails: true } });

    const mailto = c.institution.email
      ? `mailto:${encodeURIComponent(c.institution.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`
      : undefined;

    return NextResponse.json({ ok: true, mode, mailto, noEmail, website: c.institution.website, case: finalCase ? serializeCase(finalCase) : null });
  } catch (err) {
    console.error("[advocacy/cases/[id]/followup-send POST]", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}

// SafeSign Advokasi — KIRIM email awal dengan GERBANG IZIN pengguna.
// Body wajib { confirm: true } — tanpa itu tidak ada yang terkirim.
// Mode SMTP bila env lengkap; selain itu "manual mode" (mailto + salin) —
// kasus tetap tercatat terkirim dan terlacak.
// Balasan lembaga dikirim ke email user (Reply-To), dan dicocokkan otomatis
// via webhook /api/email/inbound menggunakan Message-ID.
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

    // ── GERBANG IZIN: tidak ada pengiriman tanpa konfirmasi eksplisit ──
    if (body.confirm !== true) {
      return NextResponse.json({ ok: false, error: "PERMISSION_REQUIRED" }, { status: 403 });
    }

    const c = await db.advocacyCase.findUnique({
      where: { id },
      include: { institution: true, emails: true },
    });
    if (!c || c.userId !== user.id) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    if (c.status !== "draft") {
      return NextResponse.json({ ok: false, error: "ALREADY_SENT" }, { status: 400 });
    }
    const draftEmail = c.emails.find((e) => e.type === "initial" && e.status === "draft");
    if (!draftEmail) {
      return NextResponse.json({ ok: false, error: "NO_DRAFT_EMAIL" }, { status: 400 });
    }
    const inst = c.institution;
    // Lembaga tanpa email resmi → tetap diproses dalam mode manual
    // (salin draf / formulir web / telepon), kasus tetap terlacak.

    const now = new Date();
    const by = typeof body.by === "string" ? body.by.slice(0, 200) : undefined;
    const noEmail = !inst.email;

    // Percobaan kirim SMTP nyata (opsional, tergantung env)
    let mode: "smtp" | "manual" = "manual";
    let messageId: string | undefined;
    if (!noEmail && smtpConfigured()) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT ?? 587),
          secure: process.env.SMTP_SECURE === "true",
          auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
        });
        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM!,
          to: inst.email!,
          // Balasan lembaga langsung masuk ke kotak masuk email user (email login)
          replyTo: user.email,
          subject: draftEmail.subject,
          text: draftEmail.body,
          headers: {
            "X-Entity-Ref": c.caseNumber, // penanda kasus untuk penyedia email
          },
        });
        messageId = typeof info.messageId === "string" ? info.messageId : undefined;
        mode = "smtp";
      } catch (mailErr) {
        console.error("[advocacy/send SMTP]", mailErr);
        return NextResponse.json({ ok: false, error: "SMTP_ERROR" }, { status: 502 });
      }
    }

    await db.caseEmail.update({
      where: { id: draftEmail.id },
      data: { status: "sent", sentAt: now, messageId: messageId ?? null },
    });
    await db.advocacyCase.update({
      where: { id },
      data: { status: "sent", sentAt: now, followUpDue: new Date(now.getTime() + 14 * 86_400_000) },
    });

    const fresh = await db.advocacyCase.findUnique({ where: { id }, include: { institution: true, emails: true } });
    if (fresh) {
      let timeline: TimelineEntry[] = [];
      try {
        timeline = JSON.parse(fresh.timelineJson) as TimelineEntry[];
      } catch {
        timeline = [];
      }
      timeline.push({ at: now.toISOString(), event: "APPROVED", note: "Pengguna mengizinkan pengiriman email ini", by });
      timeline.push({
        at: now.toISOString(),
        event: "SENT",
        note: noEmail
          ? `Kasus tercatat terkirim ke ${inst.shortName ?? inst.name} — lembaga tanpa email resmi, kirim manual via situs web/telepon`
          : mode === "smtp"
            ? `Email terkirim ke ${inst.email} (SMTP)`
            : `Kasus tercatat terkirim ke ${inst.email} (mode manual — salin/mailto)`,
        by,
      });
      await db.advocacyCase.update({ where: { id }, data: { timelineJson: JSON.stringify(timeline) } });
    }
    const finalCase = await db.advocacyCase.findUnique({ where: { id }, include: { institution: true, emails: true } });

    const mailto = inst.email
      ? `mailto:${encodeURIComponent(inst.email)}?subject=${encodeURIComponent(draftEmail.subject)}&body=${encodeURIComponent(draftEmail.body)}`
      : undefined;

    return NextResponse.json({
      ok: true,
      mode,
      mailto,
      noEmail,
      website: inst.website,
      case: finalCase ? serializeCase(finalCase) : null,
    });
  } catch (err) {
    console.error("[advocacy/cases/[id]/send POST]", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}

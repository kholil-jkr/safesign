// SafeSign — webhook email MASUK (balasan lembaga).
// Didorong oleh penyedia email (Resend Inbound / forwarder) ke endpoint ini.
// Keamanan: header x-webhook-secret wajib cocok dengan EMAIL_WEBHOOK_SECRET.
// Cocokkan balasan ke CaseEmail via Message-ID / In-Reply-To / (fallback)
// alamat + subjek, lalu: simpan balasan, timeline kasus, dan kirim
// notifikasi "laporan otomatis" ke email user (bila SMTP aktif).
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import type { TimelineEntry } from "@/lib/advocacy/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM);
}

export async function POST(req: NextRequest) {
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "WEBHOOK_DISABLED" }, { status: 404 });
  }
  const provided = req.headers.get("x-webhook-secret") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (provided !== secret) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      from?: string;
      to?: string;
      subject?: string;
      text?: string;
      messageId?: string;
      inReplyTo?: string;
    };
    const from = String(body.from ?? "").slice(0, 300);
    const subject = String(body.subject ?? "").slice(0, 300);
    const text = String(body.text ?? "").slice(0, 50_000);
    const refs = [body.messageId, body.inReplyTo]
      .filter((v): v is string => typeof v === "string" && v.length > 0)
      .map((v) => v.trim());

    if (!from || !subject) {
      return NextResponse.json({ ok: false, error: "INVALID_PAYLOAD" }, { status: 400 });
    }

    // 1) Cocokkan via Message-ID / In-Reply-To
    let email = null as null | { id: string; caseId: string; repliedAt: Date | null };
    for (const ref of refs) {
      const hit = await db.caseEmail.findFirst({ where: { messageId: ref } });
      if (hit) {
        email = hit;
        break;
      }
    }

    // 2) Fallback: subjek sama + pengirim = email lembaga + email sudah terkirim
    if (!email) {
      const hit = await db.caseEmail.findFirst({
        where: { status: "sent", subject },
        include: { case: { include: { institution: true } } },
      });
      if (hit && hit.case.institution.email && from.includes(hit.case.institution.email)) {
        email = hit;
      }
    }

    if (!email) {
      // Balasan tak terkait (bukan kasus SafeSign) — terima tapi abaikan
      return NextResponse.json({ ok: true, matched: false });
    }

    const now = new Date();
    await db.caseEmail.update({
      where: { id: email.id },
      data: { status: "replied", repliedAt: now, replyFrom: from, replyText: text },
    });

    // Timeline kasus + notifikasi ke user
    const c = await db.advocacyCase.findUnique({
      where: { id: email.caseId },
      include: { institution: true },
    });
    if (c) {
      let timeline: TimelineEntry[] = [];
      try {
        timeline = JSON.parse(c.timelineJson) as TimelineEntry[];
      } catch {
        timeline = [];
      }
      timeline.push({
        at: now.toISOString(),
        event: "REPLY_RECEIVED",
        note: `Balasan diterima dari ${from}: "${subject.slice(0, 120)}"`,
      });
      await db.advocacyCase.update({
        where: { id: c.id },
        data: { timelineJson: JSON.stringify(timeline), status: c.status === "sent" ? "in_progress" : c.status },
      });

      // Laporan otomatis ke email user (SMTP opsional)
      if (smtpConfigured() && c.userId) {
        try {
          const u = await db.user.findUnique({ where: { id: c.userId } });
          if (u) {
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST,
              port: Number(process.env.SMTP_PORT ?? 587),
              secure: process.env.SMTP_SECURE === "true",
              auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
            });
            await transporter.sendMail({
              from: process.env.SMTP_FROM!,
              to: u.email,
              subject: `[SafeSign] Balasan baru untuk kasus ${c.caseNumber} dari ${c.institution.shortName ?? c.institution.name}`,
              text: `Balasan diterima dari ${from}\n\nSubjek: ${subject}\n\n--- ISI BALASAN ---\n${text.slice(0, 5000)}\n\nBuka aplikasi SafeSign untuk melihat status kasus Anda.`,
            });
          }
        } catch (e) {
          console.error("[email/inbound notify]", e); // notifikasi best-effort
        }
      }
    }

    return NextResponse.json({ ok: true, matched: true });
  } catch (err) {
    console.error("[email/inbound]", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}

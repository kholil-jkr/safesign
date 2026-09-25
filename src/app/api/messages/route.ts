// SafeSign — Kotak Masuk email advokasi milik user.
// Menampilkan semua email terkait kasus user (terkirim + balasan lembaga),
// sehingga user tahu status tiap email tanpa membuka email aslinya.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "LOGIN_REQUIRED" }, { status: 401 });

  const cases = await db.advocacyCase.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      caseNumber: true,
      title: true,
      status: true,
      institution: { select: { name: true, shortName: true, email: true } },
      emails: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          subject: true,
          status: true,
          sentAt: true,
          repliedAt: true,
          replyFrom: true,
          replyText: true,
          createdAt: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const items = cases.flatMap((c) =>
    c.emails.map((e) => ({
      id: e.id,
      caseId: c.id,
      caseNumber: c.caseNumber,
      caseTitle: c.title,
      caseStatus: c.status,
      institution: c.institution.shortName ?? c.institution.name,
      institutionEmail: c.institution.email,
      type: e.type,
      subject: e.subject,
      status: e.status, // draft | sent | replied
      sentAt: e.sentAt,
      repliedAt: e.repliedAt,
      replyFrom: e.replyFrom,
      replyText: e.replyText,
      createdAt: e.createdAt,
    }))
  );

  const unreadReplies = items.filter((i) => i.repliedAt).length;
  return NextResponse.json({ ok: true, items, total: items.length, replies: unreadReplies });
}

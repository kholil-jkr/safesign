// SafeSign — detail & hapus satu riwayat kontrak (ownership ketat).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "LOGIN_REQUIRED" }, { status: 401 });
  const { id } = await params;

  const log = await db.analysisLog.findFirst({ where: { id, userId: user.id } });
  if (!log) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true, log });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "LOGIN_REQUIRED" }, { status: 401 });
  const { id } = await params;

  const log = await db.analysisLog.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!log) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

  await db.analysisLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

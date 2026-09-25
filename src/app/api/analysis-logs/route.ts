// SafeSign — Riwayat Kontrak (log analisis milik user yang login).
// GET  : daftar ringkas (terbaru dulu)
// POST : simpan hasil analisis baru (ditolak saat Mode Penyamaran? TIDAK —
//        disimpan dengan flag incognito=true lalu dihapus saat logout)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_TEXT = 40_000;
const MAX_RESULT = 60_000;
const MAX_LOGS_PER_USER = 300;

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "LOGIN_REQUIRED" }, { status: 401 });

  const logs = await db.analysisLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      language: true,
      sourceType: true,
      riskLevel: true,
      incognito: true,
      createdAt: true,
      resultJson: true,
    },
  });

  // ringkasan ringan untuk daftar (tanpa inputText besar)
  const items = logs.map((l) => {
    let summary = "";
    try {
      const r = JSON.parse(l.resultJson) as { summary?: string; risk_level?: string };
      summary = (r.summary ?? "").slice(0, 160);
    } catch {
      summary = "";
    }
    return {
      id: l.id,
      title: l.title,
      language: l.language,
      sourceType: l.sourceType,
      riskLevel: l.riskLevel,
      incognito: l.incognito,
      createdAt: l.createdAt,
      summary,
      resultJson: l.resultJson, // klien butuh full result untuk buka ulang tanpa fetch kedua
    };
  });
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "LOGIN_REQUIRED" }, { status: 401 });

  try {
    const body = (await req.json()) as {
      title?: string;
      language?: string;
      sourceType?: string;
      inputText?: string;
      resultJson?: string;
      riskLevel?: string;
    };

    const title = String(body.title ?? "").trim().slice(0, 200) || "Kontrak tanpa judul";
    const resultJson = String(body.resultJson ?? "");
    if (!resultJson || resultJson.length < 10) {
      return NextResponse.json({ ok: false, error: "RESULT_REQUIRED" }, { status: 400 });
    }
    const riskLevel = ["low", "medium", "high"].includes(String(body.riskLevel)) ? String(body.riskLevel) : null;
    const language = String(body.language ?? "en").slice(0, 10);
    const sourceType = String(body.sourceType ?? "manual").slice(0, 30);

    // Batasi jumlah log per user (buang yang terlama bila lewat)
    const count = await db.analysisLog.count({ where: { userId: user.id } });
    if (count >= MAX_LOGS_PER_USER) {
      const oldest = await db.analysisLog.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
      });
      if (oldest && !oldest.incognito) {
        await db.analysisLog.delete({ where: { id: oldest.id } });
      }
    }

    const log = await db.analysisLog.create({
      data: {
        userId: user.id,
        title,
        language,
        sourceType,
        inputText: typeof body.inputText === "string" ? body.inputText.slice(0, MAX_TEXT) : null,
        resultJson: resultJson.slice(0, MAX_RESULT),
        riskLevel,
        incognito: user.incognito,
      },
      select: { id: true, createdAt: true, incognito: true },
    });
    return NextResponse.json({ ok: true, log });
  } catch (err) {
    console.error("[analysis-logs POST]", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}

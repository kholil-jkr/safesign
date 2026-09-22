// SafeSign Manajemen — CSV export (Excel-compatible, UTF-8 BOM)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { daysLeftLabel } from "@/lib/manage/types";

export const dynamic = "force-dynamic";

function csvEscape(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  try {
    const contracts = await db.contract.findMany({
      orderBy: { updatedAt: "desc" },
      include: { createdBy: true },
    });

    const header = [
      "Judul Kontrak", "No. Kontrak", "Pihak Pertama", "Pihak Kedua",
      "Tanggal Mulai", "Tanggal Berakhir", "Sisa Hari", "Nilai", "Mata Uang",
      "Kategori", "Status", "Risiko", "Auto-Renew", "Tag", "Dibuat Oleh", "Terakhir Diperbarui",
    ];
    const rows = contracts.map((c) => [
      c.title,
      c.contractNo ?? "",
      c.partyA ?? "",
      c.partyB ?? "",
      c.startDate ? c.startDate.toISOString().slice(0, 10) : "",
      c.endDate ? c.endDate.toISOString().slice(0, 10) : "",
      daysLeftLabel(c.endDate ? Math.round((c.endDate.getTime() - Date.now()) / 86_400_000) : null),
      c.value ?? "",
      c.currency,
      c.category,
      c.status,
      c.riskLevel ?? "",
      c.autoRenew ? "Ya" : "Tidak",
      c.tags,
      c.createdBy?.name ?? "",
      c.updatedAt.toISOString().slice(0, 10),
    ]);

    const csv = [header, ...rows].map((r) => r.map(csvEscape).join(";")).join("\r\n");
    const bom = "\uFEFF"; // so Excel opens UTF-8 correctly

    return new NextResponse(bom + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="safesign-kontrak-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error("[export]", err);
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
}

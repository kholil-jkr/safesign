// SafeSign Manajemen — reports & export: CSV (Excel) download + printable report
"use client";

import { useEffect, useState } from "react";
import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchContracts, useManage } from "@/lib/manage/store";
import type { ContractDTO } from "@/lib/manage/types";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  formatCurrency,
  formatDate,
  parseTags,
} from "@/lib/manage/types";
import { LoadingRow, RiskBadge, SectionCard, StatusBadge, TimeBadge } from "./shared";

export function ReportsView() {
  const { refreshKey } = useManage();
  const [contracts, setContracts] = useState<ContractDTO[] | null>(null);

  useEffect(() => {
    fetchContracts({ sort: "endDate", dir: "asc" })
      .then(setContracts)
      .catch(() => setContracts([]));
  }, [refreshKey]);

  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const totals = (contracts ?? []).reduce<Record<string, number>>((acc, c) => {
    if (c.value) acc[c.currency] = (acc[c.currency] ?? 0) + c.value;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Laporan & Export
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Unduh seluruh registry kontrak untuk audit/Excel, atau cetak laporan ringkasan sebagai PDF.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            className="h-11 rounded-xl bg-teal-700 text-sm font-bold text-white hover:bg-teal-800"
          >
            <a href="/api/export" download>
              <Download className="h-4 w-4" aria-hidden="true" />
              Unduh CSV (Excel)
            </a>
          </Button>
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="h-11 rounded-xl text-sm font-bold"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Cetak / Simpan PDF
          </Button>
        </div>
      </div>

      {contracts === null ? (
        <LoadingRow label="Menyiapkan laporan…" />
      ) : (
        <div className="space-y-4">
          {/* Print header (only visible when printing) */}
          <div className="hidden print:block">
            <h1 className="text-xl font-extrabold">SafeSign — Laporan Registry Kontrak</h1>
            <p className="text-sm text-slate-600">Dicetak: {today} · {contracts.length} kontrak</p>
          </div>

          {/* Summary */}
          <SectionCard title="Ringkasan" className="print:border-0 print:shadow-none">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryTile label="Total Kontrak" value={String(contracts.length)} />
              <SummaryTile
                label="Nilai (IDR)"
                value={formatCurrency(totals["IDR"] ?? 0, "IDR")}
              />
              <SummaryTile
                label="Kontrak Disetujui"
                value={String(contracts.filter((c) => c.status === "approved").length)}
              />
              <SummaryTile
                label="Segera Berakhir (≤30 hr)"
                value={String(
                  contracts.filter((c) => {
                    if (!c.endDate) return false;
                    const dl = Math.round((new Date(c.endDate).getTime() - Date.now()) / 86_400_000);
                    return dl >= 0 && dl <= 30;
                  }).length
                )}
              />
            </div>
          </SectionCard>

          {/* Full table (also printable) */}
          <SectionCard title={`Daftar Kontrak (${contracts.length})`} className="print:border-0 print:shadow-none">
            <div className="max-h-[60vh] overflow-y-auto print:max-h-none print:overflow-visible">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-3 py-2.5 font-bold">Kontrak</th>
                    <th scope="col" className="px-3 py-2.5 font-bold">Pihak Kedua</th>
                    <th scope="col" className="px-3 py-2.5 font-bold">Status</th>
                    <th scope="col" className="px-3 py-2.5 font-bold">Nilai</th>
                    <th scope="col" className="px-3 py-2.5 font-bold">Berakhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contracts.map((c) => (
                    <tr key={c.id}>
                      <td className="max-w-64 px-3 py-3">
                        <p className="line-clamp-1 font-bold text-slate-800">{c.title}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {c.contractNo ?? "—"} · {CATEGORY_LABELS[c.category] ?? c.category}
                        </p>
                      </td>
                      <td className="max-w-40 px-3 py-3 text-slate-600">
                        <p className="line-clamp-1">{c.partyB ?? "—"}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {parseTags(c.tags).slice(0, 2).map((t) => (
                            <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col items-start gap-1 print:hidden">
                          <StatusBadge status={c.status} />
                          <TimeBadge contract={c} />
                          <RiskBadge risk={c.riskLevel} />
                        </div>
                        <span className="hidden print:inline">
                          {STATUS_LABELS[c.status] ?? c.status}
                          {c.riskLevel ? ` · risiko ${c.riskLevel}` : ""}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-semibold text-slate-700">
                        {formatCurrency(c.value, c.currency)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                        {formatDate(c.endDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <p className="flex items-center justify-center gap-2 text-xs text-slate-400 print:hidden">
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            File CSV kompatibel dengan Excel/Google Sheets (UTF-8, pemisah “;”)
          </p>
        </div>
      )}
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1.5 text-xl font-extrabold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

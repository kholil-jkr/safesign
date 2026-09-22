// SafeSign Advokasi — Panduan Hak per negara penempatan (accordion per negara)
"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  Coffee,
  FileBadge2,
  Megaphone,
  PlaneTakeoff,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RIGHTS_COUNTRIES } from "@/lib/advocacy/rights";
import { useAdvocacy } from "@/lib/advocacy/store";

export function RightsView() {
  const startNewCase = useAdvocacy((s) => s.startNewCase);
  const [open, setOpen] = useState<string | null>(RIGHTS_COUNTRIES[0]?.id ?? null);

  return (
    <section aria-label="Panduan hak pekerja migran per negara" className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Panduan Hak</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ringkasan hak dasar di negara penempatan: upah, jam kerja, hari istirahat, cuti, dan aturan pemutusan
          kontrak. AI juga menggunakan data ini untuk memperkuat email advokasi Anda.
        </p>
      </div>

      <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800" role="note">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Angka bersifat indikatif per 2025–2026 dan dapat berubah. Verifikasi angka terkini di situs resmi
        pemerintah negara penempatan atau kedutaan sebelum menjadikannya dasar klaim.
      </p>

      <div className="space-y-3">
        {RIGHTS_COUNTRIES.map((c) => {
          const isOpen = open === c.id;
          return (
            <article key={c.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button
                onClick={() => setOpen(isOpen ? null : c.id)}
                aria-expanded={isOpen}
                className="flex min-h-14 w-full items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-base font-bold text-slate-900">{c.name}</span>
                    <span className="block text-xs text-slate-500">{c.currency}</span>
                  </span>
                </span>
                <span className={cn("text-sm font-bold text-teal-700 transition-transform", isOpen && "rotate-180")} aria-hidden="true">
                  ▾
                </span>
              </button>
              {isOpen ? (
                <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <Fact icon={Wallet} label="Upah minimum / gaji" value={c.minWage} />
                    <Fact icon={Clock3} label="Jam kerja" value={c.workHours} />
                    <Fact icon={Coffee} label="Hari istirahat" value={c.restDays} />
                    <Fact icon={CalendarDays} label="Cuti" value={c.leave} />
                    <Fact icon={FileBadge2} label="Pemutusan kontrak" value={c.termination} />
                    <Fact icon={PlaneTakeoff} label="Nomor penting" value={c.hotlines.map((h) => `${h.label}: ${h.value}`).join(" · ")} />
                  </dl>
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Perlindungan utama</p>
                    <ul className="mt-2 space-y-1.5">
                      {c.protections.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-slate-600">
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {c.notes ? (
                    <p className="mt-3 rounded-lg bg-slate-50 px-3.5 py-2 text-xs leading-relaxed text-slate-500">{c.notes}</p>
                  ) : null}
                  <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => startNewCase(c.id)}>
                    <Megaphone className="h-4 w-4" aria-hidden="true" />
                    Alami masalah di {c.name}? Buat laporan
                  </Button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Fact({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
      <dt className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
        <Icon className="h-3.5 w-3.5 text-teal-600" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold leading-relaxed text-slate-700">{value}</dd>
    </div>
  );
}

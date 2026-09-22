// SafeSign Advokasi — daftar kasus: ringkasan, filter status, banner tindak lanjut
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FilePlus2,
  Inbox,
  MailCheck,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdvocacy, fetchCases } from "@/lib/advocacy/store";
import {
  CASE_STATUS_META,
  CATEGORY_META,
  PRIORITY_META,
  type AdvocacyCaseDTO,
  type CaseCategory,
} from "@/lib/advocacy/types";
import { formatDateTime } from "@/lib/manage/types";

const STATUS_FILTERS = [
  { value: "", label: "Semua" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Terkirim" },
  { value: "followed_up", label: "Tindak Lanjut" },
  { value: "in_progress", label: "Sedang Ditangani" },
  { value: "resolved", label: "Selesai" },
];

export function CasesView() {
  const { openCase, startNewCase, refreshKey, bumpRefresh } = useAdvocacy();
  const [cases, setCases] = useState<AdvocacyCaseDTO[] | null>(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCases(await fetchCases(filter || undefined));
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const stats = {
    total: cases?.length ?? 0,
    draft: cases?.filter((c) => c.status === "draft").length ?? 0,
    overdue: cases?.filter((c) => c.followUpOverdueDays > 0).length ?? 0,
    resolved: cases?.filter((c) => c.status === "resolved" || c.status === "closed").length ?? 0,
  };

  return (
    <section aria-label="Kasus advokasi saya" className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Kasus Saya</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pantau laporan yang dikirim ke lembaga — status, email, dan tindak lanjut dalam satu tempat.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => bumpRefresh()} aria-label="Muat ulang daftar kasus" className="gap-2">
            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden="true" />
            Muat ulang
          </Button>
          <Button onClick={() => startNewCase()} className="gap-2 bg-teal-700 hover:bg-teal-800">
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            Buat Laporan
          </Button>
        </div>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Inbox} label="Total Kasus" value={stats.total} tone="slate" />
        <StatCard icon={Clock} label="Draft belum terkirim" value={stats.draft} tone="amber" />
        <StatCard icon={AlertTriangle} label="Perlu tindak lanjut" value={stats.overdue} tone="red" />
        <StatCard icon={CheckCircle2} label="Selesai" value={stats.resolved} tone="emerald" />
      </div>

      {/* Filter status */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter status kasus">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors",
              filter === f.value
                ? "border-teal-700 bg-teal-700 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-800"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Daftar */}
      {cases === null ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-slate-100 bg-slate-100/60" />
          ))}
        </div>
      ) : cases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <Inbox className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
          <p className="mt-3 text-base font-bold text-slate-700">Belum ada kasus</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Gunakan <span className="font-semibold text-teal-800">Buat Laporan</span> — AI akan mencarikan lembaga
            yang tepat dan menyusun emailnya untuk Anda.
          </p>
          <Button onClick={() => startNewCase()} className="mt-5 gap-2 bg-teal-700 hover:bg-teal-800">
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            Buat Laporan Pertama
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {cases.map((c) => {
            const cat = CATEGORY_META[c.category as CaseCategory];
            return (
              <li key={c.id}>
                <button
                  onClick={() => openCase(c.id)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-teal-300 hover:shadow-md sm:p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">{c.caseNumber}</span>
                    <StatusChip status={c.status} />
                    <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-bold", PRIORITY_META[c.priority]?.chip)}>
                      {PRIORITY_META[c.priority]?.label ?? c.priority}
                    </span>
                    {cat ? (
                      <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-bold", cat.chip)}>{cat.label}</span>
                    ) : null}
                    {c.anonymous ? (
                      <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                        Anonim
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-base font-bold leading-snug text-slate-900">{c.title}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                    <span className="font-semibold text-slate-600">{c.institution.shortName ?? c.institution.name}</span>
                    {c.lastEmailSubject ? ` · ${c.lastEmailSubject}` : ""}
                  </p>

                  {c.followUpOverdueDays > 0 ? (
                    <p
                      className={cn(
                        "mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-sm",
                        c.followUpOverdueDays > 7
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-amber-200 bg-amber-50 text-amber-800"
                      )}
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>
                        <span className="font-bold">Belum ada respon {c.followUpOverdueDays} hari.</span>{" "}
                        Klik untuk menyusun tindak lanjut dengan AI.
                      </span>
                    </p>
                  ) : c.status === "sent" || c.status === "followed_up" ? (
                    <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-teal-700">
                      <MailCheck className="h-4 w-4" aria-hidden="true" />
                      Terkirim {formatDateTime(c.sentAt)} · menunggu respon lembaga
                    </p>
                  ) : null}

                  <p className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Dibuat {formatDateTime(c.createdAt)} · {c.emailCount} email
                    </span>
                    <span className="flex items-center gap-1 font-bold text-teal-700">
                      Buka detail <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function StatusChip({ status }: { status: string }) {
  const meta = CASE_STATUS_META[status];
  if (!meta) return null;
  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-bold", meta.chip)}>{meta.label}</span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: "slate" | "amber" | "red" | "emerald";
}) {
  const tones: Record<string, string> = {
    slate: "text-slate-600",
    amber: "text-amber-600",
    red: "text-red-600",
    emerald: "text-emerald-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <Icon className={cn("h-5 w-5", tones[tone])} aria-hidden="true" />
      <p className="mt-2 text-2xl font-extrabold tabular-nums text-slate-900">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}

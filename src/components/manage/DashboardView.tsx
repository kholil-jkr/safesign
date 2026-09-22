// SafeSign Manajemen — dashboard: stat cards, charts, expiring soon, approvals queue
"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Hourglass,
  PenTool,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchDashboard, useManage } from "@/lib/manage/store";
import type { DashboardStats } from "@/lib/manage/types";
import {
  daysLeftLabel,
  formatCurrency,
  formatDate,
  CATEGORY_LABELS,
  ROLE_LABELS,
  type Role,
} from "@/lib/manage/types";
import {
  CategoryBadge,
  LoadingRow,
  RiskBadge,
  SectionCard,
  StatusBadge,
  TimeBadge,
} from "./shared";

const STATUS_COLORS: Record<string, string> = {
  draft: "#94a3b8",
  pending_approval: "#f59e0b",
  approved: "#10b981",
  rejected: "#ef4444",
  terminated: "#334155",
};

const RISK_COLORS: Record<string, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
};

const PIE_COLORS = ["#0f766e", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4", "#ccfbf1"];

export function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState(false);
  const { refreshKey, openContract, setView, currentUser } = useManage();

  useEffect(() => {
    let cancelled = false;
    fetchDashboard()
      .then((s) => !cancelled && setStats(s))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (error) {
    return (
      <SectionCard>
        <p className="text-sm font-medium text-red-700">
          Gagal memuat dashboard. Coba muat ulang halaman.
        </p>
      </SectionCard>
    );
  }
  if (!stats) return <LoadingRow label="Memuat dashboard…" />;

  const cards = [
    {
      label: "Total Kontrak",
      value: String(stats.total),
      icon: FileText,
      tone: "bg-teal-700 text-white",
      sub: `${stats.counts.drafts} draft · ${stats.counts.pending} menunggu approval`,
    },
    {
      label: "Aktif",
      value: String(stats.counts.active),
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      sub: "sedang berjalan",
    },
    {
      label: "Segera Berakhir",
      value: String(stats.counts.expiring30),
      icon: Hourglass,
      tone: "bg-amber-50 text-amber-700 border border-amber-200",
      sub: "dalam 30 hari ke depan",
    },
    {
      label: "Kedaluwarsa",
      value: String(stats.counts.expired),
      icon: AlertTriangle,
      tone: "bg-red-50 text-red-700 border border-red-200",
      sub: "perlu tindak lanjut",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Selamat datang, {currentUser.name} — ringkasan portofolio kontrak Anda hari ini.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{c.label}</p>
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", c.tone)}>
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{c.value}</p>
              <p className="mt-1 text-xs text-slate-400">{c.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Value + charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Nilai Portofolio" className="lg:col-span-1">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <Wallet className="h-5.5 w-5.5" aria-hidden="true" />
            </span>
            <div>
              {stats.totalValueByCurrency.length === 0 ? (
                <p className="text-2xl font-extrabold text-slate-900">—</p>
              ) : (
                stats.totalValueByCurrency.map((v) => (
                  <p key={v.currency} className="text-2xl font-extrabold tracking-tight text-slate-900">
                    {formatCurrency(v.total, v.currency)}
                  </p>
                ))
              )}
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                total nilai kontrak aktif terpantau
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-teal-800">
                <PenTool className="h-4 w-4" aria-hidden="true" />
                {stats.counts.signed} tanda tangan digital tercatat
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Kontrak per Status" className="lg:col-span-1">
          {stats.byStatus.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Belum ada data.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byStatus.map((s) => ({ name: s.label ?? s.status, value: s.count, key: s.status }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {stats.byStatus.map((s) => (
                      <Cell key={s.status} fill={STATUS_COLORS[s.status] ?? "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number, n: string) => [`${v} kontrak`, n]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v: string) => <span style={{ fontSize: 12, color: "#475569" }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Kontrak per Kategori" className="lg:col-span-1">
          {stats.byCategory.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Belum ada data.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byCategory.map((c) => ({ name: c.label ?? c.category, value: c.count }))} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis type="category" dataKey="name" width={104} tick={{ fontSize: 11, fill: "#475569" }} />
                  <Tooltip
                    formatter={(v: number, n: string) => [`${v} kontrak`, n]}
                    cursor={{ fill: "#f0fdfa" }}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={16}>
                    {stats.byCategory.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Renewal timeline */}
      <SectionCard title="Jadwal Berakhirnya Kontrak (8 Bulan ke Depan)">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.monthlyRenewals} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#475569" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip
                formatter={(v: number, n: string) => (n === "count" ? [`${v} kontrak berakhir`, "Jumlah"] : [v, n])}
                cursor={{ fill: "#f0fdfa" }}
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={36} fill="#0f766e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* Expiring soon + pending approvals */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Segera Berakhir — Butuh Tindakan"
          action={
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-teal-800 hover:bg-teal-50" onClick={() => setView("contracts")}>
              Lihat semua <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          }
        >
          {stats.expiringSoon.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              Tidak ada kontrak yang berakhir dalam 90 hari ke depan.
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {stats.expiringSoon.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => {
                      setView("contracts");
                      openContract(c.id);
                    }}
                    className="flex w-full flex-col gap-1.5 px-1 py-3 text-left transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                  >
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-bold text-slate-800">{c.title}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {c.partyB ?? "—"} · berakhir {formatDate(c.endDate)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {c.autoRenew ? (
                        <span className="rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-xs font-semibold text-teal-800">
                          Auto-renew
                        </span>
                      ) : null}
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-extrabold",
                          c.daysLeft <= 7
                            ? "bg-red-100 text-red-700"
                            : c.daysLeft <= 30
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {daysLeftLabel(c.daysLeft)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Menunggu Approval">
          {stats.pendingApprovals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileCheck2 className="mb-2 h-8 w-8 text-emerald-300" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-600">Semua approval sudah diproses.</p>
              <p className="mt-1 text-xs text-slate-400">Tidak ada kontrak yang menunggu persetujuan.</p>
            </div>
          ) : (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {stats.pendingApprovals.map((c) => {
                const canSee = currentUser.role === "admin" || currentUser.role === (c.pendingRole as Role);
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => {
                        setView("contracts");
                        openContract(c.id);
                      }}
                      className="flex w-full flex-col gap-1.5 px-1 py-3 text-left transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                    >
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-sm font-bold text-slate-800">{c.title}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          Diajukan oleh {c.createdBy?.name ?? "—"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                          canSee
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                        )}
                      >
                        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                        Tahap {c.pendingStep}: {ROLE_LABELS[c.pendingRole as Role] ?? c.pendingRole}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Recent activity */}
      <SectionCard title="Aktivitas Terbaru">
        <ul className="divide-y divide-slate-100">
          {stats.recent.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => {
                  setView("contracts");
                  openContract(c.id);
                }}
                className="flex w-full flex-col gap-2 px-1 py-3 text-left transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-bold text-slate-800">{c.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <CategoryBadge category={c.category} />
                    <RiskBadge risk={c.riskLevel} />
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  <StatusBadge status={c.status} />
                  <TimeBadge contract={c} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

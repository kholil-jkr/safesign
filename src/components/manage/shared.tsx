// SafeSign Manajemen — shared small UI pieces (badges, empty states)
"use client";

import { cn } from "@/lib/utils";
import {
  STATUS_META,
  TIME_STATUS_META,
  RISK_META,
  CATEGORY_LABELS,
  daysLeft,
  daysLeftLabel,
  timeStatus,
} from "@/lib/manage/types";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = STATUS_META[status] ?? { label: status, className: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        meta.className,
        className
      )}
    >
      {meta.label}
    </span>
  );
}

export function TimeBadge({ contract, className }: {
  contract: { endDate: string | null; startDate: string | null };
  className?: string;
}) {
  const ts = timeStatus(contract);
  const meta = TIME_STATUS_META[ts];
  const dl = daysLeft(contract.endDate);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        meta.className,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden="true" />
      {ts === "expired" || ts === "no_date" || dl === null ? meta.label : `${meta.label} · ${daysLeftLabel(dl)}`}
    </span>
  );
}

export function RiskBadge({ risk, className }: { risk: string | null; className?: string }) {
  if (!risk) return null;
  const meta = RISK_META[risk] ?? { label: risk, className: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        meta.className,
        className
      )}
    >
      {meta.label}
    </span>
  );
}

export function CategoryBadge({ category, className }: { category: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-xs font-medium text-teal-800 whitespace-nowrap",
        className
      )}
    >
      {CATEGORY_LABELS[category] ?? "Lainnya"}
    </span>
  );
}

export function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6", className)}>
      {title ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center">
      {icon ? <div className="mb-3 text-slate-300" aria-hidden="true">{icon}</div> : null}
      <p className="text-base font-semibold text-slate-700">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function LoadingRow({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-10 text-sm font-medium text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600" aria-hidden="true" />
      {label}
    </div>
  );
}

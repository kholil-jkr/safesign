"use client";

// SafeSign — risk badge (Brief §4.1 item 3, §8): the risk rating must
// communicate urgency even across language barriers via color + icon,
// large and prominent (🟢🟡🔴).

import type { Dictionary } from "@/lib/safesign/i18n";
import type { RiskLevel } from "@/lib/safesign/types";

const RISK_STYLES: Record<
  RiskLevel,
  {
    wrapper: string;
    circle: string;
    label: string;
    reason: string;
    icon: string;
  }
> = {
  low: {
    wrapper: "border-emerald-300 bg-emerald-50",
    circle: "bg-emerald-100 text-emerald-700",
    label: "text-emerald-900",
    reason: "text-emerald-900/80",
    icon: "🟢",
  },
  medium: {
    wrapper: "border-amber-300 bg-amber-50",
    circle: "bg-amber-100 text-amber-700",
    label: "text-amber-900",
    reason: "text-amber-900/80",
    icon: "🟡",
  },
  high: {
    wrapper: "border-red-300 bg-red-50",
    circle: "bg-red-100 text-red-700",
    label: "text-red-900",
    reason: "text-red-900/80",
    icon: "🔴",
  },
};

interface RiskBadgeProps {
  level: RiskLevel;
  reason: string;
  dict: Dictionary;
}

export function RiskBadge({ level, reason, dict }: RiskBadgeProps) {
  const style = RISK_STYLES[level] ?? RISK_STYLES.medium;
  const label =
    level === "low" ? dict.riskLow : level === "medium" ? dict.riskMedium : dict.riskHigh;

  return (
    <section
      aria-label={label}
      className={`rounded-2xl border-2 p-5 sm:p-6 ${style.wrapper}`}
    >
      <div className="flex items-center gap-4">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-3xl ${style.circle}`}
          aria-hidden="true"
        >
          {style.icon}
        </span>
        <div className="min-w-0">
          <p className={`text-xl font-bold leading-snug sm:text-2xl ${style.label}`}>
            {label}
          </p>
        </div>
      </div>
      {reason ? (
        <p className={`mt-3 text-base leading-relaxed ${style.reason}`}>
          <span className="font-semibold">{dict.riskReasonLabel}: </span>
          {reason}
        </p>
      ) : null}
    </section>
  );
}

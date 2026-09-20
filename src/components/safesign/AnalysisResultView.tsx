"use client";

// SafeSign — analysis result view: risk badge, plain-language summary,
// red flags with quoted clauses, next steps, and the always-visible
// "not formal legal advice" disclaimer (Brief §4.1, §8, §12).

import { AlertTriangle, CheckCircle2, Compass, FileText, Scale } from "lucide-react";
import { RiskBadge } from "./RiskBadge";
import type { Dictionary } from "@/lib/safesign/i18n";
import type { AnalysisResult } from "@/lib/safesign/types";

interface AnalysisResultViewProps {
  analysis: AnalysisResult;
  dict: Dictionary;
}

function Paragraphs({ text, className = "" }: { text: string; className?: string }) {
  const parts = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className={`space-y-2.5 ${className}`}>
      {parts.map((p, i) => (
        <p key={i} className="text-base leading-relaxed">
          {p}
        </p>
      ))}
    </div>
  );
}

export function AnalysisResultView({ analysis, dict }: AnalysisResultViewProps) {
  const hasFlags = analysis.red_flags.length > 0;

  return (
    <div className="space-y-5">
      <RiskBadge level={analysis.risk_level} reason={analysis.risk_reason} dict={dict} />

      {/* Summary */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <FileText className="h-5 w-5 text-teal-700" aria-hidden="true" />
          {dict.summaryTitle}
        </h3>
        <div className="mt-3 text-slate-700">
          <Paragraphs text={analysis.summary} />
        </div>
      </section>

      {/* Red flags */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
          {dict.redFlagsTitle}
          {hasFlags ? (
            <span className="ms-1 rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-bold text-red-800">
              {dict.redFlagsCount.replace("{n}", String(analysis.red_flags.length))}
            </span>
          ) : null}
        </h3>

        {hasFlags ? (
          <ul className="mt-4 space-y-4">
            {analysis.red_flags.map((flag, i) => (
              <li
                key={i}
                className="rounded-xl border-s-4 border-red-400 bg-red-50/60 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700/80">
                  {dict.clauseLabel}
                </p>
                <blockquote className="mt-1 border-s-2 border-red-200 ps-3 text-base italic leading-relaxed text-slate-800">
                  “{flag.clause}”
                </blockquote>
                <p className="mt-2.5 text-base leading-relaxed text-slate-700">
                  {flag.explanation}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-900">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" aria-hidden="true" />
            <p className="text-base leading-relaxed">{dict.noRedFlags}</p>
          </div>
        )}
      </section>

      {/* Next steps */}
      {analysis.next_steps ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Compass className="h-5 w-5 text-teal-700" aria-hidden="true" />
            {dict.nextStepsTitle}
          </h3>
          <div className="mt-3 text-slate-700">
            <Paragraphs text={analysis.next_steps} />
          </div>
        </section>
      ) : null}

      {/* Disclaimer — must always be visible (Brief §12) */}
      <aside
        className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5"
        role="note"
      >
        <Scale className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" aria-hidden="true" />
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-amber-800">
            {dict.footerDisclaimerTitle}
          </p>
          <p className="mt-1 text-base leading-relaxed text-amber-900">
            {analysis.disclaimer || dict.footerDisclaimer}
          </p>
        </div>
      </aside>
    </div>
  );
}

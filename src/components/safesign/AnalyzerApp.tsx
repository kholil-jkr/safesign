"use client";

// SafeSign — Analyzer module (worker-facing, 10 languages).
// Linear flow: upload/paste contract → wait → see results → (optional) chat →
// optionally save the contract into the Manajemen registry (org-facing module).

import { useCallback, useEffect, useRef, useState } from "react";
import { FolderPlus, Loader2, Lock, LayoutDashboard, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AnalysisResultView } from "@/components/safesign/AnalysisResultView";
import { ChatBox } from "@/components/safesign/ChatBox";
import { LanguageSwitcher } from "@/components/safesign/LanguageSwitcher";
import { UploadZone } from "@/components/safesign/UploadZone";
import { HELP_RESOURCES } from "@/components/safesign/resources";
import {
  detectLangFromLocale,
  format,
  getDictionary,
  getLangMeta,
  isValidLang,
} from "@/lib/safesign/i18n";
import { SAMPLE_CONTRACTS } from "@/lib/safesign/samples";
import type { AnalysisResult, AnalyzeApiResponse, LangCode } from "@/lib/safesign/types";
import { useManage } from "@/lib/manage/store";

type Phase = "input" | "analyzing" | "results";

const LANG_STORAGE_KEY = "safesign.lang";
const MAX_CHARS = 20_000;

export function AnalyzerApp({
  onSaveToRegistry,
  onOpenManage,
}: {
  onSaveToRegistry: () => void;
  onOpenManage: () => void;
}) {
  const [lang, setLang] = useState<LangCode>("en");
  const [langReady, setLangReady] = useState(false);
  const [contractText, setContractText] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [phase, setPhase] = useState<Phase>("input");
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(0); // remounts the chat on new analysis
  const [sampleIndex, setSampleIndex] = useState(0);
  const resultsRef = useRef<HTMLDivElement>(null);

  const dict = getDictionary(lang);
  const meta = getLangMeta(lang);

  // Brief §4.2: auto-detect browser language on load; never default to a
  // single language. Manual choice (localStorage) overrides detection.
  useEffect(() => {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (isValidLang(stored)) {
      setLang(stored);
    } else {
      const candidates = [
        window.navigator.language,
        ...(window.navigator.languages ?? []),
      ];
      const detected = detectLangFromLocale(candidates[0]) === "en" && candidates.length > 1
        ? detectLangFromLocale(candidates.find((c) => detectLangFromLocale(c) !== "en") ?? candidates[0])
        : detectLangFromLocale(candidates[0]);
      setLang(detected);
    }
    setLangReady(true);
  }, []);

  // Reflect language + direction on <html> (SSR default stays "en"/"ltr")
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = meta.dir;
  }, [lang, meta.dir]);

  const handleLanguageChange = useCallback((next: LangCode) => {
    setLang(next);
    window.localStorage.setItem(LANG_STORAGE_KEY, next);
  }, []);

  const loadSample = useCallback(() => {
    // Cycle: the sample matching the current UI language first, then the others
    const all: LangCode[] = ["id", "en", "ar"];
    const preferred: LangCode = all.includes(lang) ? lang : "en";
    const sequence: LangCode[] = [preferred, ...all.filter((l) => l !== preferred)];
    const pick = sequence[sampleIndex % sequence.length];
    setSampleIndex((i) => i + 1);
    setContractText(SAMPLE_CONTRACTS[pick] ?? SAMPLE_CONTRACTS.en);
    setErrorKey(null);
  }, [lang, sampleIndex]);

  const handleExtracted = useCallback((text: string, _info: { pages: number; truncated: boolean }) => {
    // Append to (or fill) the editable textarea so the user can review
    // and correct the OCR result before analysing.
    setContractText((prev) => {
      const merged = prev.trim() ? `${prev}\n\n${text}` : text;
      return merged.slice(0, MAX_CHARS);
    });
    setErrorKey(null);
  }, []);

  const handleAnalyze = useCallback(async () => {
    const text = contractText.trim();
    if (text.length < 20) {
      setErrorKey("EMPTY");
      return;
    }
    if (text.length > MAX_CHARS) {
      setErrorKey("TOO_LONG");
      return;
    }
    setErrorKey(null);
    setPhase("analyzing");
    try {
      const res = await fetch("/api/safesign/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractText: text, lang }),
      });
      const data = (await res.json()) as AnalyzeApiResponse;
      if (!data.ok || !data.analysis) {
        throw new Error(data.error || "UPSTREAM");
      }
      setAnalysis(data.analysis);
      setChatKey((k) => k + 1);
      setPhase("results");
      // Scroll to results on mobile
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      console.error("[SafeSign] analyze failed:", err);
      setErrorKey("GENERIC");
      setPhase("input");
    }
  }, [contractText, lang]);

  const handleSaveToRegistry = useCallback(() => {
    useManage.getState().startDraft({
      text: contractText,
      analysisJson: JSON.stringify(analysis),
      source: "file",
    });
    onSaveToRegistry();
    window.scrollTo({ top: 0 });
  }, [contractText, analysis, onSaveToRegistry]);

  const handleReset = useCallback(() => {
    setContractText("");
    setAnalysis(null);
    setPhase("input");
    setErrorKey(null);
    setSampleIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const errorMessage =
    errorKey === "EMPTY"
      ? dict.errorEmpty
      : errorKey === "TOO_LONG"
        ? dict.errorTooLong
        : errorKey
          ? dict.errorGeneric
          : null;

  return (
    <div
      dir={meta.dir}
      className="flex min-h-screen flex-col bg-gradient-to-b from-teal-50/60 via-white to-white text-[17px] text-slate-800"
    >
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-700">
              <ShieldCheck className="h-6 w-6 text-white" aria-hidden="true" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="text-lg font-extrabold tracking-tight text-slate-900">
                SafeSign
              </p>
              <p className="truncate text-xs font-medium text-teal-700">{dict.tagline}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              onClick={onOpenManage}
              className="h-10 rounded-xl border-teal-200 bg-white px-3 text-xs font-bold text-teal-800 hover:bg-teal-50 sm:px-4 sm:text-sm"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Manajemen Kontrak</span>
              <span className="sm:hidden">Kelola</span>
            </Button>
            <LanguageSwitcher value={lang} onChange={handleLanguageChange} />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-10 pt-8 sm:pt-10">
        {/* Hero */}
        <section className="text-center">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            {dict.heroTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            {dict.heroSubtitle}
          </p>
        </section>

        {/* How it works */}
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            {dict.howItWorksTitle}
          </h2>
          <ol className="mt-3 grid gap-3 sm:grid-cols-3">
            {dict.howItWorks.map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-slate-700">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Input / Analyzing / Results */}
        <div ref={resultsRef} className="mt-8 space-y-6 scroll-mt-20">
          {phase !== "results" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <label
                htmlFor="contract-input"
                className="text-lg font-bold text-slate-900"
              >
                {dict.inputLabel}
              </label>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                {dict.inputHint}
              </p>

              {/* Upload zone: camera / photos / files / drag & drop / paste / link */}
              <div className="mt-4">
                <UploadZone
                  dict={dict}
                  disabled={phase === "analyzing"}
                  onExtracted={handleExtracted}
                />
              </div>

              <div className="my-4 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-medium text-slate-400">{dict.orPasteDivider}</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <Textarea
                id="contract-input"
                value={contractText}
                onChange={(e) => setContractText(e.target.value.slice(0, MAX_CHARS))}
                placeholder={dict.inputPlaceholder}
                disabled={phase === "analyzing"}
                className="mt-4 min-h-48 w-full rounded-xl border-slate-300 bg-white text-base leading-relaxed shadow-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
              />
              <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
                <span>{contractText.length > 0 ? format(dict.charCount, contractText.length) : ""}</span>
                <span>{format(dict.charCount, MAX_CHARS)}</span>
              </div>

              {errorMessage ? (
                <div
                  role="alert"
                  className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm leading-relaxed text-red-800"
                >
                  <p className="font-semibold">{dict.errorTitle}</p>
                  <p className="mt-0.5">{errorMessage}</p>
                </div>
              ) : null}

              <div className="mt-4 flex flex-col gap-3">
                {phase === "analyzing" ? (
                  <div className="flex min-h-14 items-center justify-center gap-3 rounded-xl bg-teal-50 p-4 text-base font-semibold text-teal-900">
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    <span>{dict.analyzing}</span>
                  </div>
                ) : (
                  <Button
                    onClick={handleAnalyze}
                    className="h-14 w-full rounded-xl bg-teal-700 text-lg font-bold text-white hover:bg-teal-800 focus-visible:ring-4 focus-visible:ring-teal-600/30"
                  >
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                    {dict.analyzeButton}
                  </Button>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={loadSample}
                    disabled={phase === "analyzing"}
                    className="h-11 rounded-xl border-teal-200 bg-white px-4 text-sm font-semibold text-teal-800 hover:bg-teal-50"
                  >
                    {dict.trySample}
                  </Button>
                  {contractText ? (
                    <Button
                      variant="ghost"
                      onClick={() => setContractText("")}
                      className="h-11 rounded-xl px-4 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    >
                      {dict.clearButton}
                    </Button>
                  ) : null}
                </div>
                {phase === "analyzing" ? (
                  <p className="text-center text-sm text-slate-500">{dict.analyzingHint}</p>
                ) : (
                  <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    {dict.privacyNote}
                  </p>
                )}
              </div>
            </section>
          ) : null}

          {phase === "results" && analysis ? (
            <>
              <AnalysisResultView analysis={analysis} dict={dict} />

              <ChatBox
                key={chatKey}
                contractText={contractText}
                analysis={analysis}
                lang={lang}
                dict={dict}
              />

              {/* Save into the Manajemen registry (org-facing module) */}
              <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-5 text-center">
                <p className="text-sm font-bold text-teal-900">
                  Simpan kontrak ini ke Registry Manajemen?
                </p>
                <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-teal-800/80">
                  Teks & hasil analisis akan dibawa ke formulir kontrak — AI mengekstrak data penting
                  (pihak, tanggal, nilai) secara otomatis, lalu pengingat jatuh tempo aktif.
                </p>
                <Button
                  onClick={handleSaveToRegistry}
                  className="mt-3 h-11 rounded-xl bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800"
                >
                  <FolderPlus className="h-4 w-4" aria-hidden="true" />
                  Simpan ke Registry Kontrak
                </Button>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="h-12 rounded-xl border-slate-300 bg-white px-6 text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <RotateCcw className="h-5 w-5" aria-hidden="true" />
                  {dict.newAnalysis}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </main>

      {/* Footer (sticky bottom per layout rules) */}
      <footer className="mt-auto border-t border-slate-200 bg-slate-50">
        <div className="mx-auto w-full max-w-3xl px-4 py-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            {dict.resourcesTitle}
          </h2>
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {HELP_RESOURCES.map((r) => (
              <li key={r.name}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-teal-800 transition-colors hover:border-teal-300 hover:bg-teal-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{r.name}</span>
                    <span className="block truncate text-xs font-normal text-slate-400">
                      {r.note}
                    </span>
                  </span>
                  <span aria-hidden="true" className="shrink-0 text-slate-300">
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-2xl bg-white p-4 text-sm leading-relaxed text-slate-500">
            <p>
              <span className="font-bold text-slate-700">{dict.footerDisclaimerTitle}: </span>
              {dict.footerDisclaimer}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {dict.privacyNote}
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            SafeSign · {dict.poweredBy}
          </p>
        </div>
      </footer>
    </div>
  );
}

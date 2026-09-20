// SafeSign — UI string dictionary contract (Brief §4.2).
// The dictionary is a simple JS object keyed by language code so more
// languages can be added later without restructuring code.

import type { LangCode } from "../types";

export interface Dictionary {
  /** Native name shown in the language switcher (e.g. "Bahasa Indonesia"). */
  nativeName: string;
  /** Text direction for this language. */
  dir: "ltr" | "rtl";
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  howItWorksTitle: string;
  howItWorks: [string, string, string];
  inputLabel: string;
  inputHint: string;
  inputPlaceholder: string;
  charCount: string; // {n} placeholder
  trySample: string;
  clearButton: string;
  analyzeButton: string;
  analyzing: string;
  analyzingHint: string;
  resultsTitle: string;
  riskReasonLabel: string;
  riskLow: string;
  riskMedium: string;
  riskHigh: string;
  summaryTitle: string;
  redFlagsTitle: string;
  redFlagsCount: string; // {n} placeholder
  noRedFlags: string;
  clauseLabel: string;
  nextStepsTitle: string;
  chatTitle: string;
  chatSubtitle: string;
  chatIntro: string;
  chatPlaceholder: string;
  chatSend: string;
  quickReplies: string[];
  chatTurnsLeft: string; // {n} placeholder
  chatLimitReached: string;
  offTopicMessage: string;
  newAnalysis: string;
  errorTitle: string;
  errorEmpty: string;
  errorTooLong: string;
  errorGeneric: string;
  tryAgain: string;
  footerDisclaimerTitle: string;
  footerDisclaimer: string;
  privacyNote: string;
  resourcesTitle: string;
  poweredBy: string;
}

export interface LanguageMeta {
  code: LangCode;
  nativeName: string;
  englishName: string;
  dir: "ltr" | "rtl";
}

/** Supported languages, in switcher order (Brief §4.2). */
export const LANGUAGES: LanguageMeta[] = [
  { code: "en", nativeName: "English", englishName: "English", dir: "ltr" },
  { code: "id", nativeName: "Bahasa Indonesia", englishName: "Indonesian", dir: "ltr" },
  { code: "ar", nativeName: "العربية", englishName: "Arabic", dir: "rtl" },
  { code: "tl", nativeName: "Tagalog", englishName: "Tagalog/Filipino", dir: "ltr" },
  { code: "hi", nativeName: "हिन्दी", englishName: "Hindi", dir: "ltr" },
  { code: "bn", nativeName: "বাংলা", englishName: "Bengali", dir: "ltr" },
  { code: "ne", nativeName: "नेपाली", englishName: "Nepali", dir: "ltr" },
  { code: "ur", nativeName: "اردو", englishName: "Urdu", dir: "rtl" },
  { code: "es", nativeName: "Español", englishName: "Spanish", dir: "ltr" },
  { code: "am", nativeName: "አማርኛ", englishName: "Amharic", dir: "ltr" },
];

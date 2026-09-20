// SafeSign i18n — Brief §4.2: auto-detect browser language, manual override,
// never default to a single language; fall back to English only if the
// detected language is not supported.

import type { LangCode } from "../types";
import type { Dictionary } from "./dictionary";
import { LANGUAGES } from "./dictionary";
import { en } from "./en";
import { id } from "./id";
import { ar } from "./ar";
import { tl } from "./tl";
import { hi } from "./hi";
import { bn } from "./bn";
import { ne } from "./ne";
import { ur } from "./ur";
import { es } from "./es";
import { am } from "./am";

export { LANGUAGES };
export type { Dictionary, LanguageMeta } from "./dictionary";

const TRANSLATIONS: Record<LangCode, Dictionary> = {
  en,
  id,
  ar,
  tl,
  hi,
  bn,
  ne,
  ur,
  es,
  am,
};

export const SUPPORTED_CODES = LANGUAGES.map((l) => l.code);

export function isValidLang(value: string | null | undefined): value is LangCode {
  return !!value && (SUPPORTED_CODES as string[]).includes(value);
}

export function getDictionary(lang: LangCode): Dictionary {
  return TRANSLATIONS[lang] ?? en;
}

export function getLangMeta(lang: LangCode) {
  return LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
}

/**
 * Detect the UI language from a browser locale string (e.g. "id-ID",
 * "ar-SA", "fil-PH", "en-US"). Checks the primary subtag and a few common
 * aliases, then falls back to English (Brief §4.2).
 */
export function detectLangFromLocale(locale: string | null | undefined): LangCode {
  if (!locale) return "en";
  const primary = locale.toLowerCase().split(/[-_]/)[0];
  const direct = primary as LangCode;
  if (isValidLang(direct)) return direct;
  // Common aliases for supported languages
  const aliases: Record<string, LangCode> = {
    in: "id", // legacy code for Indonesian
    ind: "id",
    fil: "tl", // Filipino
    fil_PH: "tl",
    pb: "bn",
    bangla: "bn",
    np: "ne",
    esp: "es",
    amh: "am",
  };
  if (primary in aliases) return aliases[primary];
  return "en";
}

/** Replace {n} placeholders in a dictionary string. */
export function format(template: string, n: number | string): string {
  return template.replace("{n}", String(n));
}

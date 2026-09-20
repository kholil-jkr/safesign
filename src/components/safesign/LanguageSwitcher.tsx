"use client";

// SafeSign — manual language switcher (Brief §4.2): fallback/override for the
// auto-detected browser language. Shows each language in its own script so a
// worker can always find their own language.

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Globe } from "lucide-react";
import { LANGUAGES } from "@/lib/safesign/i18n";
import type { LangCode } from "@/lib/safesign/types";

interface LanguageSwitcherProps {
  value: LangCode;
  onChange: (lang: LangCode) => void;
}

export function LanguageSwitcher({ value, onChange }: LanguageSwitcherProps) {
  const current = LANGUAGES.find((l) => l.code === value);
  return (
    <div className="flex items-center gap-1.5">
      <Globe className="h-4 w-4 text-teal-700 shrink-0" aria-hidden="true" />
      <Select value={value} onValueChange={(v) => onChange(v as LangCode)}>
        <SelectTrigger
          className="h-10 w-[9.5rem] gap-1 rounded-xl border-slate-300 bg-white text-sm font-medium text-slate-800 shadow-none focus:ring-2 focus:ring-teal-600/40"
          aria-label="Language"
        >
          <span className="truncate">{current?.nativeName ?? "Language"}</span>
        </SelectTrigger>
        <SelectContent className="max-h-80 rounded-xl">
          {LANGUAGES.map((lang) => (
            <SelectItem
              key={lang.code}
              value={lang.code}
              className="cursor-pointer py-2.5 text-base"
            >
              <span className="flex items-center gap-2">
                <span>{lang.nativeName}</span>
                <span className="text-xs text-slate-400">{lang.englishName}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

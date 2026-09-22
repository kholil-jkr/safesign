// SafeSign Advokasi — direktori lembaga: pencarian & filter (tipe, negara asal,
// negara penempatan, kategori), kartu lembaga dengan kontak lengkap.
"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Clock, ExternalLink, Globe2, Info, Mail, Phone, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fetchInstitutions, useAdvocacy } from "@/lib/advocacy/store";
import { RIGHTS_COUNTRIES } from "@/lib/advocacy/rights";
import {
  CATEGORY_META,
  INST_TYPE_META,
  ORIGIN_COUNTRIES,
  type CaseCategory,
  type InstitutionDTO,
} from "@/lib/advocacy/types";
import { TypeChip } from "./NewCaseView";

const LANG_LABEL: Record<string, string> = {
  English: "Bahasa Inggris",
  Indonesian: "Bahasa Indonesia",
  Arabic: "Bahasa Arab",
};

export function InstitutionsView() {
  const startNewCase = useAdvocacy((s) => s.startNewCase);
  const [institutions, setInstitutions] = useState<InstitutionDTO[] | null>(null);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [category, setCategory] = useState("");

  const load = useCallback(async () => {
    setInstitutions(null);
    try {
      setInstitutions(
        await fetchInstitutions({ q, type, origin, destination, category })
      );
    } catch {
      setInstitutions([]);
    }
  }, [q, type, origin, destination, category]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250); // debounce pencarian
    return () => clearTimeout(t);
  }, [load]);

  return (
    <section aria-label="Direktori lembaga perlindungan pekerja migran" className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Direktori Lembaga</h1>
        <p className="mt-1 text-sm text-slate-500">
          Lembaga pemerintah, kedutaan, organisasi internasional, dan LSM yang menangani pekerja migran — dari
          berbagai negara asal dan penempatan.
        </p>
      </div>

      {/* Filter */}
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="inst-search">Cari</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <Input id="inst-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nama / kewenangan…" className="pl-9" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inst-type">Tipe</Label>
          <Select value={type || "all"} onValueChange={(v) => setType(v === "all" ? "" : v)}>
            <SelectTrigger id="inst-type" aria-label="Filter tipe lembaga">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua tipe</SelectItem>
              {Object.entries(INST_TYPE_META).map(([v, m]) => (
                <SelectItem key={v} value={v}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inst-origin">Negara asal</Label>
          <Select value={origin || "all"} onValueChange={(v) => setOrigin(v === "all" ? "" : v)}>
            <SelectTrigger id="inst-origin" aria-label="Filter negara asal">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua negara</SelectItem>
              {ORIGIN_COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inst-dest">Negara penempatan</Label>
          <Select value={destination || "all"} onValueChange={(v) => setDestination(v === "all" ? "" : v)}>
            <SelectTrigger id="inst-dest" aria-label="Filter negara penempatan">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua negara</SelectItem>
              {RIGHTS_COUNTRIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="inst-cat">Kategori</Label>
          <Select value={category || "all"} onValueChange={(v) => setCategory(v === "all" ? "" : v)}>
            <SelectTrigger id="inst-cat" aria-label="Filter kategori masalah">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua kategori</SelectItem>
              {(Object.keys(CATEGORY_META) as CaseCategory[]).map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_META[c].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs leading-relaxed text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Kontak lembaga dapat berubah sewaktu-waktu — selalu verifikasi di situs resmi sebelum mengirim laporan
        penting. Fitur <span className="font-bold text-teal-700">Buat Laporan</span> akan otomatis memilih lembaga
        yang paling berwenang untuk kasus Anda.
      </p>

      {/* Hasil */}
      {institutions === null ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl border border-slate-100 bg-slate-100/60" />
          ))}
        </div>
      ) : institutions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <Building2 className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
          <p className="mt-3 font-bold text-slate-700">Tidak ada lembaga yang cocok dengan filter</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setQ("");
              setType("");
              setOrigin("");
              setDestination("");
              setCategory("");
            }}
          >
            Reset Filter
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold text-slate-500">
            {institutions.length} lembaga ditemukan
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {institutions.map((inst) => (
              <InstitutionCard key={inst.id} inst={inst} />
            ))}
          </div>
        </>
      )}

      <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 text-center">
        <p className="text-sm font-bold text-teal-900">Tidak yakin harus menghubungi siapa?</p>
        <p className="mx-auto mt-1 max-w-lg text-sm text-teal-800/80">
          Wizard Buat Laporan akan mencocokkan lembaga secara otomatis berdasarkan negara asal, negara penempatan,
          dan jenis masalah Anda.
        </p>
        <Button onClick={() => startNewCase()} className="mt-3 bg-teal-700 hover:bg-teal-800">
          Mulai Buat Laporan
        </Button>
      </div>
    </section>
  );
}

function InstitutionCard({ inst }: { inst: InstitutionDTO }) {
  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <TypeChip type={inst.type} />
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
          {inst.originCountry === "ANY" ? "Semua negara asal" : `Asal: ${inst.originCountry}`}
        </span>
        {inst.destinationCountry ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            Penempatan: {inst.destinationCountry}
          </span>
        ) : null}
      </div>
      <h2 className="mt-2.5 text-base font-bold leading-snug text-slate-900">{inst.shortName ?? inst.name}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{inst.description}</p>
      <p className="mt-2.5 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
        <span className="font-bold text-slate-600">Kewenangan:</span> {inst.jurisdiction}
      </p>
      <div className="mt-3 space-y-1 text-sm">
        {inst.email ? (
          <p className="flex items-center gap-2 break-all text-slate-600">
            <Mail className="h-3.5 w-3.5 shrink-0 text-teal-600" aria-hidden="true" />
            {inst.email}
          </p>
        ) : null}
        {inst.phone ? (
          <p className="flex items-center gap-2 text-slate-600">
            <Phone className="h-3.5 w-3.5 shrink-0 text-teal-600" aria-hidden="true" />
            {inst.phone}
          </p>
        ) : null}
        {inst.responseTime ? (
          <p className="flex items-center gap-2 text-slate-500">
            <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            Estimasi respon: {inst.responseTime}
          </p>
        ) : null}
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
        <div className="flex flex-wrap gap-1.5">
          {inst.categories.slice(0, 4).map((c) => (
            <span key={c} className={cn("rounded-full border px-2 py-0.5 text-[11px] font-bold", CATEGORY_META[c as CaseCategory]?.chip ?? "border-slate-200 bg-slate-50 text-slate-500")}>
              {CATEGORY_META[c as CaseCategory]?.label ?? c}
            </span>
          ))}
          {inst.categories.length > 4 ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-500">
              +{inst.categories.length - 4}
            </span>
          ) : null}
        </div>
        {inst.website ? (
          <a
            href={inst.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:underline"
          >
            <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
            Situs resmi
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        ) : null}
      </div>
      <p className="mt-2 text-[11px] font-semibold text-slate-400">Email AI akan ditulis dalam {LANG_LABEL[inst.language] ?? inst.language}</p>
    </article>
  );
}

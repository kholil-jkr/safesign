// SafeSign Manajemen — contract registry: instant search, filters, sort
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownUp,
  FileSearch,
  FilterX,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchContracts, useManage } from "@/lib/manage/store";
import type { ContractDTO } from "@/lib/manage/types";
import {
  CATEGORY_OPTIONS,
  STATUS_OPTIONS,
  formatCurrency,
  formatDate,
  parseTags,
} from "@/lib/manage/types";
import {
  CategoryBadge,
  EmptyState,
  LoadingRow,
  RiskBadge,
  StatusBadge,
  TimeBadge,
} from "./shared";

const TIME_FILTERS = [
  { value: "all", label: "Semua Waktu", query: "" },
  { value: "active", label: "Aktif", query: "active" },
  { value: "expiring", label: "Segera Berakhir (≤30 hr)", query: "expiring" },
  { value: "expired", label: "Kedaluwarsa", query: "expired" },
];

const SORTS = [
  { value: "updated", label: "Terakhir Diperbarui" },
  { value: "endDate", label: "Tanggal Berakhir" },
  { value: "value", label: "Nilai Kontrak" },
  { value: "title", label: "Judul (A-Z)" },
  { value: "created", label: "Terbaru Dibuat" },
];

export function ContractsView() {
  const { openContract, setView, refreshKey } = useManage();
  const [contracts, setContracts] = useState<ContractDTO[] | null>(null);
  const [error, setError] = useState(false);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [risk, setRisk] = useState("");
  const [time, setTime] = useState("");
  const [sort, setSort] = useState("updated");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  // debounce search
  const [qInput, setQInput] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQ(qInput.trim()), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [qInput]);

  useEffect(() => {
    let cancelled = false;
    fetchContracts({ q, category, status, risk, time, sort, dir })
      .then((list) => {
        if (cancelled) return;
        setContracts(list);
        setError(false);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [q, category, status, risk, time, sort, dir, refreshKey]);

  const hasFilter = useMemo(
    () => Boolean(q || category || status || risk || time),
    [q, category, status, risk, time]
  );

  const clearFilters = () => {
    setQInput("");
    setQ("");
    setCategory("");
    setStatus("");
    setRisk("");
    setTime("");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Registry Kontrak
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Cari, filter, dan kelola seluruh kontrak organisasi Anda.
          </p>
        </div>
        <Button
          onClick={() => setView("new")}
          className="h-11 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Tambah Kontrak
        </Button>
      </div>

      {/* Search & filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Cari judul, nomor kontrak, pihak, atau tag…"
            aria-label="Cari kontrak"
            className="h-12 rounded-xl border-slate-300 pl-11 text-base focus-visible:ring-teal-600/40"
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Select value={category || "all"} onValueChange={(v) => setCategory(v === "all" ? "" : v)}>
            <SelectTrigger className="h-10 rounded-xl border-slate-300 text-xs font-semibold" aria-label="Filter kategori">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {CATEGORY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="h-10 rounded-xl border-slate-300 text-xs font-semibold" aria-label="Filter status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={risk || "all"} onValueChange={(v) => setRisk(v === "all" ? "" : v)}>
            <SelectTrigger className="h-10 rounded-xl border-slate-300 text-xs font-semibold" aria-label="Filter risiko">
              <SelectValue placeholder="Risiko" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Risiko</SelectItem>
              <SelectItem value="high">Risiko Tinggi</SelectItem>
              <SelectItem value="medium">Risiko Sedang</SelectItem>
              <SelectItem value="low">Risiko Rendah</SelectItem>
            </SelectContent>
          </Select>
          <Select value={time || "all"} onValueChange={(v) => setTime(TIME_FILTERS.find((f) => f.value === v)?.query ?? "")}>
            <SelectTrigger className="h-10 rounded-xl border-slate-300 text-xs font-semibold" aria-label="Filter waktu">
              <SelectValue placeholder="Waktu" />
            </SelectTrigger>
            <SelectContent>
              {TIME_FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v)}>
            <SelectTrigger className="h-10 rounded-xl border-slate-300 text-xs font-semibold" aria-label="Urutkan" >
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="h-10 rounded-xl border-slate-300 text-xs font-semibold"
            aria-label={`Arah urutan: ${dir === "asc" ? "naik" : "turun"}`}
          >
            <ArrowDownUp className="h-4 w-4" aria-hidden="true" />
            {dir === "asc" ? "Naik (A→Z / lama→baru)" : "Turun (Z→A / baru→lama)"}
          </Button>
        </div>
        {hasFilter ? (
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-500">
              {contracts ? `${contracts.length} kontrak ditemukan` : "Mencari…"}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 gap-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
            >
              <FilterX className="h-3.5 w-3.5" aria-hidden="true" />
              Reset filter
            </Button>
          </div>
        ) : null}
      </div>

      {/* Results */}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          Gagal memuat daftar kontrak. Coba muat ulang halaman.
        </div>
      ) : contracts === null ? (
        <LoadingRow label="Memuat kontrak…" />
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={<FileSearch className="h-10 w-10" aria-hidden="true" />}
          title={hasFilter ? "Tidak ada kontrak yang cocok" : "Belum ada kontrak"}
          description={
            hasFilter
              ? "Coba ubah kata kunci pencarian atau reset filter."
              : "Mulai dengan mengunggah kontrak pertama Anda — kamera, foto, file, atau link cloud semuanya didukung."
          }
          action={
            hasFilter ? (
              <Button variant="outline" onClick={clearFilters} className="rounded-xl">
                Reset filter
              </Button>
            ) : (
              <Button onClick={() => setView("new")} className="rounded-xl bg-teal-700 text-white hover:bg-teal-800">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Tambah Kontrak
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="grid gap-3 md:hidden">
            {contracts.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => openContract(c.id)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-teal-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-bold text-slate-900">{c.title}</p>
                    <TimeBadge contract={c} />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {c.partyB ?? c.partyA ?? "—"} · {c.contractNo ?? "tanpa nomor"}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={c.status} />
                    <CategoryBadge category={c.category} />
                    <RiskBadge risk={c.riskLevel} />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-600">
                    {formatCurrency(c.value, c.currency)} · berakhir {formatDate(c.endDate)}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <div className="max-h-[65vh] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-bold">Kontrak</th>
                    <th scope="col" className="px-4 py-3 font-bold">Status</th>
                    <th scope="col" className="px-4 py-3 font-bold">Waktu</th>
                    <th scope="col" className="px-4 py-3 font-bold">Nilai</th>
                    <th scope="col" className="px-4 py-3 font-bold">Berakhir</th>
                    <th scope="col" className="px-4 py-3 font-bold">Tag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contracts.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => openContract(c.id)}
                      className="cursor-pointer transition-colors hover:bg-teal-50/50"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") openContract(c.id);
                      }}
                    >
                      <td className="max-w-xs px-4 py-3.5">
                        <p className="line-clamp-1 font-bold text-slate-900">{c.title}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                          {c.contractNo ?? "tanpa nomor"} · {c.partyB ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={c.status} />
                          <RiskBadge risk={c.riskLevel} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <TimeBadge contract={c} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-700">
                        {formatCurrency(c.value, c.currency)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">
                        {formatDate(c.endDate)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex max-w-44 flex-wrap gap-1">
                          {parseTags(c.tags).slice(0, 3).map((t) => (
                            <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

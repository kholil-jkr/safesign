// SafeSign Advokasi — wizard Buat Laporan (4 langkah):
// 1) Kategori & negara  2) Kronologi + kontrak + lampiran  3) Lembaga rekomendasi
// 4) Draf email AI (bahasa lembaga + terjemahan) → simpan sebagai draft kasus.
// Pengiriman dengan gerbang izin ada di CaseDetailView.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FileWarning,
  HeartPulse,
  IdCard,
  Languages,
  Lightbulb,
  Loader2,
  Lock,
  Paperclip,
  Plane,
  Plus,
  Save,
  ShieldAlert,
  Sparkles,
  Trash2,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  fetchInstitutions,
  generateDraft,
  matchInstitutions,
  useAdvocacy,
} from "@/lib/advocacy/store";
import { fetchContracts } from "@/lib/manage/store";
import { RIGHTS_COUNTRIES } from "@/lib/advocacy/rights";
import {
  CATEGORY_META,
  ORIGIN_COUNTRIES,
  PRIORITY_META,
  type AttachmentItem,
  type CaseCategory,
  type EmailDraft,
  type InstitutionDTO,
  type MatchedInstitution,
} from "@/lib/advocacy/types";
import type { ContractDTO } from "@/lib/manage/types";
import { useManage } from "@/lib/manage/store";

const CATEGORY_ICONS: Record<CaseCategory, React.ElementType> = {
  SALARY: Banknote,
  ABUSE: ShieldAlert,
  TRAFFICKING: UserX,
  CONTRACT: FileWarning,
  REPATRIATION: Plane,
  PLACEMENT: BriefcaseBusiness,
  DOCUMENT: IdCard,
  WELFARE: HeartPulse,
};

const STEPS = ["Kategori", "Kronologi", "Lembaga", "Draf & Izin"];

const LANG_LABEL: Record<string, string> = {
  English: "Bahasa Inggris",
  Indonesian: "Bahasa Indonesia",
  Arabic: "Bahasa Arab",
};

export function NewCaseView({ onOpenContract }: { onOpenContract: (id: string) => void }) {
  const { prefillDestination, clearPrefill, openCase, bumpRefresh } = useAdvocacy();
  const currentUser = useManage((s) => s.currentUser);

  const [step, setStep] = useState(1);
  // step 1
  const [category, setCategory] = useState<CaseCategory | "">("");
  const [title, setTitle] = useState("");
  const [originCountry, setOriginCountry] = useState("Indonesia");
  const [destinationCountry, setDestinationCountry] = useState("");
  const [priority, setPriority] = useState("medium");
  // step 2
  const [chronology, setChronology] = useState("");
  const [contractId, setContractId] = useState("");
  const [contracts, setContracts] = useState<ContractDTO[]>([]);
  const [anonymous, setAnonymous] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [attachmentInput, setAttachmentInput] = useState("");
  // step 3
  const [matches, setMatches] = useState<MatchedInstitution[] | null>(null);
  const [matching, setMatching] = useState(false);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState("");
  const selectedInstitution = useMemo(
    () => matches?.find((m) => m.id === selectedInstitutionId) ?? null,
    [matches, selectedInstitutionId]
  );
  // step 4
  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const [generating, setGenerating] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);

  // Prefill tujuan dari Panduan Hak / SOS
  useEffect(() => {
    if (prefillDestination) {
      setDestinationCountry(prefillDestination);
      clearPrefill();
    }
  }, [prefillDestination, clearPrefill]);

  // Muat daftar kontrak (untuk ditautkan)
  useEffect(() => {
    let cancelled = false;
    fetchContracts({ category: "employment" })
      .then((list) => {
        if (!cancelled) setContracts(list);
      })
      .catch(() => {
        if (!cancelled) setContracts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const linkedContract = contracts.find((c) => c.id === contractId) ?? null;

  const pickCategory = (c: CaseCategory) => {
    setCategory(c);
    if (!title.trim()) {
      setTitle(
        `${CATEGORY_META[c].label}${destinationCountry ? ` — ${destinationCountry}` : ""}`
      );
    }
    setPriority(CATEGORY_META[c].defaultPriority);
  };

  // Step 3: cari lembaga saat masuk
  useEffect(() => {
    if (step !== 3 || matches !== null || matching) return;
    setMatching(true);
    matchInstitutions({
      originCountry,
      destinationCountry: destinationCountry || null,
      category: category as string,
    })
      .then((list) => {
        setMatches(list);
        if (list.length > 0) setSelectedInstitutionId(list[0].id);
      })
      .catch(() => setMatches([]))
      .finally(() => setMatching(false));
  }, [step, matches, matching, originCountry, destinationCountry, category]);

  const step1Valid = category !== "" && title.trim().length >= 5;
  const step2Valid = chronology.trim().length >= 30;

  const handleGenerate = useCallback(async () => {
    if (!selectedInstitution) return;
    setGenerating(true);
    setDraftError(null);
    try {
      const res = await generateDraft({
        category: category as string,
        priority,
        chronology,
        originCountry,
        destinationCountry: destinationCountry || null,
        anonymous,
        institutionId: selectedInstitution.id,
        contractId: contractId || null,
        attachments: attachments.map((a) => a.name),
        workerName: anonymous ? null : (linkedContract?.partyB ?? currentUser.name),
      });
      setDraft(res.draft);
    } catch (err) {
      setDraftError(
        err instanceof Error && err.message === "CHRONOLOGY_TOO_SHORT"
          ? "Cerita masih terlalu pendek — tambahkan detail (minimal 30 karakter)."
          : "AI gagal menyusun draf. Coba lagi sebentar — jika berlanjut, periksa koneksi server."
      );
    } finally {
      setGenerating(false);
    }
  }, [selectedInstitution, category, priority, chronology, originCountry, destinationCountry, anonymous, contractId, attachments, linkedContract, currentUser.name]);

  const handleSave = useCallback(async () => {
    if (!draft || !selectedInstitution) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/advocacy/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          priority,
          originCountry,
          destinationCountry: destinationCountry || null,
          chronology,
          anonymous,
          contractId: contractId || null,
          institutionId: selectedInstitution.id,
          attachments,
          createdByEmail: currentUser.email,
          createdByName: currentUser.name,
          draft,
        }),
      });
      const data = (await res.json()) as { ok: boolean; case?: { id: string }; error?: string };
      if (!data.ok || !data.case) throw new Error(data.error ?? "GAGAL");
      bumpRefresh();
      openCase(data.case.id);
    } catch (err) {
      setSaveError("Gagal menyimpan kasus. " + (err instanceof Error ? err.message : ""));
    } finally {
      setSaving(false);
    }
  }, [draft, selectedInstitution, title, category, priority, originCountry, destinationCountry, chronology, anonymous, contractId, attachments, currentUser, bumpRefresh, openCase]);

  return (
    <section aria-label="Buat laporan advokasi baru" className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Buat Laporan</h1>
        <p className="mt-1 text-sm text-slate-500">
          AI mencarikan lembaga yang tepat dan menyusun email resmi — Anda tinggal memeriksa dan memberi izin.
        </p>
      </div>

      {/* Stepper */}
      <ol className="flex items-center gap-2" aria-label="Langkah pembuatan laporan">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const active = step === n;
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold",
                  done
                    ? "bg-teal-700 text-white"
                    : active
                      ? "bg-teal-100 text-teal-800 ring-2 ring-teal-600"
                      : "bg-slate-100 text-slate-400"
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? <CheckCircle2 className="h-4.5 w-4.5" aria-hidden="true" /> : n}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-bold sm:block",
                  active ? "text-teal-800" : done ? "text-slate-600" : "text-slate-400"
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 ? <span className="h-0.5 flex-1 rounded bg-slate-200" aria-hidden="true" /> : null}
            </li>
          );
        })}
      </ol>

      {/* ── STEP 1: Kategori & negara ── */}
      {step === 1 ? (
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Apa masalah yang Anda alami?</h2>
            <p className="mt-0.5 text-sm text-slate-500">Pilih kategori — AI akan menyarankan lembaga yang berwenang.</p>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4" role="radiogroup" aria-label="Kategori masalah">
            {(Object.keys(CATEGORY_META) as CaseCategory[]).map((c) => {
              const Icon = CATEGORY_ICONS[c];
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => pickCategory(c)}
                  className={cn(
                    "flex min-h-24 flex-col items-start rounded-2xl border p-3.5 text-left transition-all",
                    active
                      ? "border-teal-600 bg-teal-50 ring-2 ring-teal-600"
                      : "border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50"
                  )}
                >
                  <Icon className={cn("h-6 w-6", active ? "text-teal-700" : "text-slate-400")} aria-hidden="true" />
                  <span className={cn("mt-2 text-sm font-bold leading-tight", active ? "text-teal-900" : "text-slate-700")}>
                    {CATEGORY_META[c].label}
                  </span>
                  <span className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500">{CATEGORY_META[c].desc}</span>
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="case-title">Judul laporan</Label>
              <Input
                id="case-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="mis. Gaji 3 bulan tidak dibayar — pabrik di Johor"
                maxLength={250}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="case-priority">Prioritas</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="case-priority" aria-label="Prioritas kasus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_META).map(([v, m]) => (
                    <SelectItem key={v} value={v}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="case-origin">Negara asal Anda</Label>
              <Select value={originCountry} onValueChange={setOriginCountry}>
                <SelectTrigger id="case-origin" aria-label="Negara asal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORIGIN_COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">AI hanya menampilkan lembaga yang berwenang untuk negara asal ini.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="case-destination">Negara penempatan (tempat Anda bekerja)</Label>
              <Select value={destinationCountry || "none"} onValueChange={(v) => setDestinationCountry(v === "none" ? "" : v)}>
                <SelectTrigger id="case-destination" aria-label="Negara penempatan">
                  <SelectValue placeholder="Pilih negara" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ditentukan / lainnya</SelectItem>
                  {RIGHTS_COUNTRIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── STEP 2: Kronologi ── */}
      {step === 2 ? (
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Ceritakan kronologi masalah Anda</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Tulis <span className="font-semibold text-teal-800">dalam bahasa apa pun yang nyaman bagi Anda</span> — AI
              akan menerjemahkannya ke bahasa yang dipahami lembaga. Sertakan tanggal, jumlah, dan nama bila ada.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="chronology">Kronologi (minimal 30 karakter)</Label>
            <Textarea
              id="chronology"
              value={chronology}
              onChange={(e) => setChronology(e.target.value)}
              rows={7}
              placeholder="mis. Saya bekerja di pabrik elektronik di Johor sejak Agustus 2024. Sejak Januari 2026 gaji saya tidak dibayar. Sudah 3 kali minta ke supervisor…"
              maxLength={8000}
            />
            <p className="text-right text-xs text-slate-400">{chronology.trim().length} karakter</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contract-link">Tautkan kontrak (opsional, sangat disarankan)</Label>
              <Select value={contractId || "none"} onValueChange={(v) => setContractId(v === "none" ? "" : v)}>
                <SelectTrigger id="contract-link" aria-label="Pilih kontrak terkait">
                  <SelectValue placeholder="Tanpa kontrak terkait" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa kontrak terkait</SelectItem>
                  {contracts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">
                {linkedContract
                  ? `Fakta kontrak (${linkedContract.contractNo ?? "tanpa nomor"}) akan dilampirkan otomatis ke email.`
                  : "Data kontrak akan memperkuat isi email."}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Lampiran / bukti (opsional)</Label>
              <div className="flex gap-2">
                <Input
                  value={attachmentInput}
                  onChange={(e) => setAttachmentInput(e.target.value)}
                  placeholder="mis. Foto slip gaji Maret"
                  aria-label="Nama lampiran bukti"
                  maxLength={160}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && attachmentInput.trim()) {
                      e.preventDefault();
                      setAttachments((a) => [...a, { name: attachmentInput.trim(), kind: "evidence" }]);
                      setAttachmentInput("");
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 gap-1.5"
                  onClick={() => {
                    if (!attachmentInput.trim()) return;
                    setAttachments((a) => [...a, { name: attachmentInput.trim(), kind: "evidence" }]);
                    setAttachmentInput("");
                  }}
                  aria-label="Tambah lampiran"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Tambah
                </Button>
              </div>
              {attachments.length > 0 ? (
                <ul className="mt-1 space-y-1.5">
                  {attachments.map((a, i) => (
                    <li
                      key={`${a.name}-${i}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2 text-slate-700">
                        <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                        <span className="truncate">{a.name}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                        className="shrink-0 text-slate-400 hover:text-red-600"
                        aria-label={`Hapus lampiran ${a.name}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">Daftar nama bukti yang akan dicantumkan dalam email.</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <Switch id="anonymous" checked={anonymous} onCheckedChange={setAnonymous} aria-label="Mode laporan anonim" />
            <div>
              <Label htmlFor="anonymous" className="cursor-pointer">
                Laporkan secara anonim
              </Label>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                Identitas Anda tidak akan dicantumkan dalam email dan diminta kerahasiaannya. Cocok untuk kasus
                sensitif (pelecehan, ancaman pemulangan paksa). Nama majikan/agensi tetap dicantumkan agar kasus
                dapat ditindaklanjuti.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── STEP 3: Lembaga rekomendasi ── */}
      {step === 3 ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-bold text-slate-900">Lembaga yang berwenang mengurus masalah Anda</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Pencarian pintar berdasarkan negara asal <span className="font-semibold text-teal-800">{originCountry}</span>
              {destinationCountry ? (
                <>
                  ,{" "}
                  <span className="font-semibold text-teal-800">penempatan di {destinationCountry}</span>
                </>
              ) : (
                ""
              )}
              , dan kategori <span className="font-semibold text-teal-800">{category ? CATEGORY_META[category].label : ""}</span>.
            </p>
          </div>

          {matching ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl border border-slate-100 bg-slate-100/60" />
              ))}
            </div>
          ) : !matches || matches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Building2 className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
              <p className="mt-3 font-bold text-slate-700">Tidak ada lembaga spesifik yang cocok</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                Coba ubah kategori atau negara, atau telusuri seluruh direktori lembaga secara manual.
              </p>
              <BrowseAllButton />
            </div>
          ) : (
            <ul className="space-y-3">
              {matches.map((m, i) => (
                <InstitutionMatchCard
                  key={m.id}
                  inst={m}
                  rank={i + 1}
                  selected={selectedInstitutionId === m.id}
                  onSelect={() => setSelectedInstitutionId(m.id)}
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {/* ── STEP 4: Draf email AI ── */}
      {step === 4 ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Draf email untuk {selectedInstitution?.shortName ?? selectedInstitution?.name}</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {selectedInstitution
                    ? `Email ditulis dalam ${LANG_LABEL[selectedInstitution.language] ?? selectedInstitution.language} — bahasa kerja lembaga ini.`
                    : ""}
                </p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">
                <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                {selectedInstitution ? (LANG_LABEL[selectedInstitution.language] ?? selectedInstitution.language) : ""}
              </span>
            </div>
          </div>

          {!draft && !generating ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <Sparkles className="mx-auto h-10 w-10 text-teal-600" aria-hidden="true" />
              <p className="mt-3 text-base font-bold text-slate-900">AI siap menyusun email Anda</p>
              <ul className="mx-auto mt-3 max-w-md space-y-1.5 text-left text-sm text-slate-600">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                  Menerjemahkan kronologi Anda ke bahasa lembaga
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                  Melampirkan fakta kontrak {linkedContract ? `(${linkedContract.contractNo ?? "terkait"})` : "(bila ditautkan)"}
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                  Menyusun permintaan konkret sesuai kewenangan lembaga
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
                  Menyiapkan terjemahan Bahasa Indonesia agar Anda paham isinya
                </li>
              </ul>
              {draftError ? (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700" role="alert">
                  {draftError}
                </p>
              ) : null}
              <Button onClick={handleGenerate} className="mt-6 gap-2 bg-teal-700 hover:bg-teal-800" size="lg">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Susun Draf Email dengan AI
              </Button>
              <p className="mt-3 text-xs text-slate-400">Proses ± 15–45 detik. Tidak ada yang dikirim pada tahap ini.</p>
            </div>
          ) : null}

          {generating ? (
            <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-8 text-center shadow-sm">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-teal-600" aria-hidden="true" />
              <p className="mt-4 text-base font-bold text-teal-900">AI sedang menyusun email Anda…</p>
              <p className="mt-1 text-sm text-teal-800/70">Menerjemahkan kronologi, menyusun struktur formal, dan menyiapkan terjemahan.</p>
            </div>
          ) : null}

          {draft ? (
            <div className="space-y-4">
              {draft.advice ? (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-amber-900">Saran AI untuk Anda</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-amber-800">{draft.advice}</p>
                  </div>
                </div>
              ) : null}

              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-900">Periksa & sunting sebelum disimpan</p>
                  <Button variant="outline" size="sm" onClick={handleGenerate} className="gap-1.5" disabled={generating}>
                    <RefreshIcon /> Buat Ulang
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="draft-subject">Subjek</Label>
                  <Input id="draft-subject" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} maxLength={250} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="draft-body">Isi email ({selectedInstitution ? LANG_LABEL[selectedInstitution.language] ?? selectedInstitution.language : ""})</Label>
                  <Textarea
                    id="draft-body"
                    value={draft.body}
                    onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                    rows={16}
                    className="font-mono text-[13px] leading-relaxed"
                  />
                </div>

                {draft.bodyUser ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setShowTranslation((s) => !s)}
                      className="flex w-full items-center justify-between px-4 py-3 text-sm font-bold text-slate-700"
                      aria-expanded={showTranslation}
                    >
                      <span className="flex items-center gap-2">
                        <Languages className="h-4 w-4 text-teal-700" aria-hidden="true" />
                        Terjemahan Bahasa Indonesia — agar Anda paham apa yang dikirim
                      </span>
                      <span className="text-xs font-semibold text-teal-700">{showTranslation ? "Sembunyikan" : "Lihat"}</span>
                    </button>
                    {showTranslation ? (
                      <pre className="whitespace-pre-wrap border-t border-slate-200 px-4 py-3 text-sm leading-relaxed text-slate-700" style={{ fontFamily: "inherit" }}>
                        {draft.bodyUser}
                      </pre>
                    ) : null}
                  </div>
                ) : null}

                {draft.attachments.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Lampiran:</span>
                    {draft.attachments.map((a, i) => (
                      <span key={i} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        <Paperclip className="h-3 w-3" aria-hidden="true" />
                        {a}
                      </span>
                    ))}
                  </div>
                ) : null}

                {saveError ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700" role="alert">
                    {saveError}
                  </p>
                ) : null}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2 bg-teal-700 hover:bg-teal-800">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
                    Simpan & Lanjut ke Pengiriman
                  </Button>
                </div>
                <p className="flex items-start gap-1.5 text-xs leading-relaxed text-slate-400">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Kasus disimpan sebagai DRAFT. Pengiriman hanya terjadi setelah Anda memberi izin eksplisit pada
                  langkah berikutnya.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Navigasi bawah */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali
        </Button>
        <p className="hidden text-xs font-semibold text-slate-400 sm:block">
          Langkah {step} dari {STEPS.length} — {STEPS[step - 1]}
        </p>
        {step === 1 ? (
          <Button onClick={() => setStep(2)} disabled={!step1Valid} className="gap-2 bg-teal-700 hover:bg-teal-800">
            Lanjut
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : step === 2 ? (
          <Button onClick={() => setStep(3)} disabled={!step2Valid} className="gap-2 bg-teal-700 hover:bg-teal-800">
            Cari Lembaga
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : step === 3 ? (
          <Button onClick={() => setStep(4)} disabled={!selectedInstitutionId} className="gap-2 bg-teal-700 hover:bg-teal-800">
            Susun Email
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <span />
        )}
      </div>
    </section>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

function BrowseAllButton() {
  const setView = useAdvocacy((s) => s.setView);
  return (
    <Button variant="outline" onClick={() => setView("institutions")} className="mt-4 gap-2">
      <Building2 className="h-4 w-4" aria-hidden="true" />
      Telusuri Direktori Lembaga
    </Button>
  );
}

function InstitutionMatchCard({
  inst,
  rank,
  selected,
  onSelect,
}: {
  inst: MatchedInstitution;
  rank: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
          "w-full rounded-2xl border p-5 text-left shadow-sm transition-all",
          selected ? "border-teal-600 bg-teal-50/60 ring-2 ring-teal-600" : "border-slate-200 bg-white hover:border-teal-300"
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          {rank === 1 ? (
            <span className="flex items-center gap-1 rounded-full bg-teal-700 px-2.5 py-0.5 text-xs font-bold text-white">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Rekomendasi utama
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">Rekomendasi #{rank}</span>
          )}
          <TypeChip type={inst.type} />
          {inst.email ? (
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-500">
              Email tersedia
            </span>
          ) : (
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-500">
              Via situs web
            </span>
          )}
        </div>
        <p className="mt-2.5 text-base font-bold text-slate-900">{inst.shortName ?? inst.name}</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{inst.description}</p>
        <ul className="mt-3 space-y-1">
          {inst.reasons.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-teal-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {r}
            </li>
          ))}
        </ul>
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          {inst.email ? <span>✉ {inst.email}</span> : null}
          {inst.phone ? <span>☎ {inst.phone}</span> : null}
          {inst.responseTime ? <span>⏱ Respon {inst.responseTime}</span> : null}
          <span className="font-semibold text-slate-500">
            Email AI: {LANG_LABEL[inst.language] ?? inst.language}
          </span>
        </p>
      </button>
    </li>
  );
}

export function TypeChip({ type }: { type: string }) {
  const meta = { government: "Pemerintah", embassy: "Kedutaan", international: "Internasional", ngo: "LSM" }[type];
  const chip = {
    government: "bg-teal-50 text-teal-700 border-teal-200",
    embassy: "bg-emerald-50 text-emerald-700 border-emerald-200",
    international: "bg-amber-50 text-amber-700 border-amber-200",
    ngo: "bg-rose-50 text-rose-700 border-rose-200",
  }[type];
  if (!meta) return null;
  return <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-bold", chip)}>{meta}</span>;
}

export { CATEGORY_ICONS };

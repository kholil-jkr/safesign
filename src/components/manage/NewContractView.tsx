// SafeSign Manajemen — new contract: upload (camera/photo/file/cloud) →
// AI field extraction → review form → save as draft / submit for approval.
"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  Save,
  Send,
  Sparkles,
  Upload,
  Wand2,
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
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useManage } from "@/lib/manage/store";
import type { ExtractedFields } from "@/lib/manage/types";
import { CATEGORY_OPTIONS, REMINDER_OPTIONS } from "@/lib/manage/types";
import { getDictionary } from "@/lib/safesign/i18n";
import type { AnalysisResult } from "@/lib/safesign/types";
import { UploadZone } from "@/components/safesign/UploadZone";
import { SectionCard } from "./shared";

const idDict = getDictionary("id");

const EMPTY_FORM = {
  title: "",
  contractNo: "",
  partyA: "",
  partyB: "",
  startDate: "",
  endDate: "",
  value: "",
  currency: "IDR",
  category: "other",
  tags: "",
  autoRenew: false,
  notes: "",
  contentText: "",
};

export function NewContractView() {
  const { draftText, draftAnalysisJson, draftSource, clearDraft, setView, currentUser, bumpRefresh, openContract, setView: setV } = useManage();
  const [text, setText] = useState(draftText);
  const [sourceType, setSourceType] = useState<string>(draftSource ?? "manual");
  const [fileName, setFileName] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedFields | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(() => {
    if (!draftAnalysisJson) return null;
    try {
      return JSON.parse(draftAnalysisJson) as AnalysisResult;
    } catch {
      return null;
    }
  });
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [reminders, setReminders] = useState<number[]>([90, 60, 30, 7]);
  const [saving, setSaving] = useState(false);
  const [saveMode, setSaveMode] = useState<"draft" | "submit">("draft");

  // clear carried draft once consumed
  useEffect(() => {
    if (draftText) clearDraft();
  }, [draftText, clearDraft]);

  const applyExtracted = (f: ExtractedFields) => {
    setForm((prev) => ({
      ...prev,
      title: f.title || prev.title,
      contractNo: f.contractNo || prev.contractNo,
      partyA: f.partyA || prev.partyA,
      partyB: f.partyB || prev.partyB,
      startDate: f.startDate || prev.startDate,
      endDate: f.endDate || prev.endDate,
      value: f.value != null ? String(f.value) : prev.value,
      currency: f.currency || prev.currency,
      category: f.category || prev.category,
      autoRenew: f.autoRenew ?? prev.autoRenew,
      tags: Array.isArray(f.tags) ? f.tags.join(", ") : prev.tags,
    }));
  };

  const handleExtracted = (t: string, info: { pages: number; truncated: boolean }) => {
    setText((prev) => {
      const merged = prev.trim() ? `${prev}\n\n${t}` : t;
      return merged.slice(0, 100_000);
    });
    setSourceType((prev) => (prev === "manual" || prev === "template" ? "file" : prev));
    if (info.pages) setFileName(`${info.pages} halaman/dokumen terproses`);
    toast({
      title: "Teks berhasil diekstrak",
      description: `Teks dari ${info.pages} sumber sudah masuk — periksa lalu lanjutkan dengan Ekstraksi Data AI.`,
    });
  };

  const runExtraction = async () => {
    const t = text.trim();
    if (t.length < 30) {
      toast({
        title: "Teks terlalu pendek",
        description: "Unggah dokumen kontrak atau tempel teks terlebih dahulu (min. 30 karakter).",
        variant: "destructive",
      });
      return;
    }
    setExtracting(true);
    setExtracted(null);
    try {
      const res = await fetch("/api/ai/extract-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t.slice(0, 18_000) }),
      });
      const data = (await res.json()) as { ok: boolean; fields?: ExtractedFields; error?: string };
      if (!data.ok || !data.fields) throw new Error(data.error);
      setExtracted(data.fields);
      applyExtracted(data.fields);
      toast({
        title: "Ekstraksi AI selesai",
        description: "Kolom formulir sudah terisi otomatis — periksa dan perbaiki bila perlu.",
      });
    } catch {
      toast({
        title: "Ekstraksi gagal",
        description: "AI tidak dapat membaca dokumen ini. Anda tetap bisa mengisi formulir secara manual.",
        variant: "destructive",
      });
    } finally {
      setExtracting(false);
    }
  };

  const runAnalysis = async () => {
    const t = text.trim();
    if (t.length < 20) {
      toast({
        title: "Teks terlalu pendek",
        description: "Analisis risiko membutuhkan teks kontrak minimal 20 karakter.",
        variant: "destructive",
      });
      return;
    }
    setAnalyzing(true);
    try {
      const res = await fetch("/api/safesign/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractText: t.slice(0, 20_000), lang: "id" }),
      });
      const data = (await res.json()) as { ok: boolean; analysis?: AnalysisResult };
      if (!data.ok || !data.analysis) throw new Error();
      setAnalysis(data.analysis);
      toast({
        title: "Analisis risiko selesai",
        description: `Tingkat risiko: ${data.analysis.risk_level === "high" ? "TINGGI" : data.analysis.risk_level === "medium" ? "SEDANG" : "RENDAH"}.`,
      });
    } catch {
      toast({ title: "Analisis gagal", description: "Coba lagi sebentar.", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const save = async (mode: "draft" | "submit") => {
    if (!form.title.trim()) {
      toast({
        title: "Judul kontrak wajib diisi",
        description: "Isi judul secara manual atau gunakan Ekstraksi Data AI.",
        variant: "destructive",
      });
      return;
    }
    setSaveMode(mode);
    setSaving(true);
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          value: form.value.trim() ? Number(form.value.replace(/[^\d.]/g, "")) : null,
          contentText: text.trim() || null,
          analysisJson: analysis ? JSON.stringify(analysis) : null,
          riskLevel: analysis?.risk_level ?? null,
          sourceType,
          fileName,
          reminders,
          createdByEmail: currentUser.email,
          editedBy: currentUser.name,
          submit: mode === "submit",
        }),
      });
      const data = (await res.json()) as { ok: boolean; id?: string };
      if (!data.ok || !data.id) throw new Error();
      bumpRefresh();
      toast({
        title: mode === "submit" ? "Kontrak diajukan untuk approval" : "Kontrak disimpan sebagai draft",
        description: "Lanjutkan ke detail kontrak untuk lengkapi data.",
      });
      setText("");
      setForm({ ...EMPTY_FORM });
      setExtracted(null);
      setAnalysis(null);
      setV("contracts");
      if (data.id) openContract(data.id);
    } catch {
      toast({ title: "Gagal menyimpan", description: "Coba lagi.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <Button variant="ghost" onClick={() => setView("contracts")} className="mb-2 h-9 rounded-xl px-3 text-sm font-semibold text-slate-500 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Registry
        </Button>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Tambah Kontrak Baru
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
          Unggah dokumen dari kamera, foto, file lokal, atau link cloud — AI akan mengekstrak teks,
          mengenali data penting, dan mengisi formulir secara otomatis. Anda tinggal memeriksa lalu menyimpan.
        </p>
      </div>

      {/* Step 1: upload */}
      <SectionCard>
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-sm font-extrabold text-white">1</span>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">Unggah Dokumen Kontrak</h2>
        </div>
        <UploadZone dict={idDict} onExtracted={handleExtracted} />
        <div className="my-4 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium text-slate-400">atau tempel teks manual</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 100_000))}
          placeholder="Tempel teks kontrak di sini (bisa diedit sebelum ekstraksi)…"
          aria-label="Teks kontrak"
          className="min-h-40 w-full rounded-xl border-slate-300 text-base leading-relaxed focus-visible:ring-teal-600/40"
        />
        <p className="mt-1.5 text-right text-xs text-slate-400">{text.length.toLocaleString("id-ID")} karakter</p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={() => void runExtraction()}
            disabled={extracting || text.trim().length < 30}
            className="h-12 flex-1 rounded-xl bg-teal-700 text-sm font-bold text-white hover:bg-teal-800"
          >
            {extracting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Mengekstrak data… (±15 detik)
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" aria-hidden="true" />
                Ekstraksi Data dengan AI
              </>
            )}
          </Button>
          <Button
            onClick={() => void runAnalysis()}
            disabled={analyzing || text.trim().length < 20}
            variant="outline"
            className="h-12 flex-1 rounded-xl border-teal-300 text-sm font-bold text-teal-800 hover:bg-teal-50"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Menganalisis risiko… (±20 detik)
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Analisis Risiko AI (opsional)
              </>
            )}
          </Button>
        </div>

        {analysis ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Analisis risiko tersimpan: {analysis.risk_level === "high" ? "RISIKO TINGGI" : analysis.risk_level === "medium" ? "RISIKO SEDANG" : "RISIKO RENDAH"}
              · {analysis.red_flags.length} red flag
            </p>
            <p className="mt-1 text-xs leading-relaxed text-emerald-700">{analysis.summary.slice(0, 180)}…</p>
          </div>
        ) : null}
      </SectionCard>

      {/* Step 2: form */}
      <SectionCard>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-sm font-extrabold text-white">2</span>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">Data Kontrak {extracted ? <span className="text-xs font-semibold text-teal-700">(terisi otomatis oleh AI — silakan periksa)</span> : null}</h2>
          </div>
          {extracted ? (
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">
              ✓ Terisi otomatis dari ekstraksi AI
            </span>
          ) : null}
        </div>

        <div className="grid gap-4">
          <div>
            <Label htmlFor="f-title" className="text-xs font-bold">Judul Kontrak *</Label>
            <Input id="f-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="mis. PKWT Penempatan Pekerja — Arab Saudi" className="mt-1.5 h-11 rounded-xl" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="f-no" className="text-xs font-bold">Nomor Kontrak</Label>
              <Input id="f-no" value={form.contractNo} onChange={(e) => setForm({ ...form, contractNo: e.target.value })} className="mt-1.5 h-11 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-bold">Kategori</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1.5 h-11 rounded-xl" aria-label="Kategori kontrak">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="f-pa" className="text-xs font-bold">Pihak Pertama (Perusahaan)</Label>
              <Input id="f-pa" value={form.partyA} onChange={(e) => setForm({ ...form, partyA: e.target.value })} className="mt-1.5 h-11 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="f-pb" className="text-xs font-bold">Pihak Kedua</Label>
              <Input id="f-pb" value={form.partyB} onChange={(e) => setForm({ ...form, partyB: e.target.value })} className="mt-1.5 h-11 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="f-start" className="text-xs font-bold">Tanggal Mulai</Label>
              <Input id="f-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="mt-1.5 h-11 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="f-end" className="text-xs font-bold">Tanggal Berakhir</Label>
              <Input id="f-end" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="mt-1.5 h-11 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="f-value" className="text-xs font-bold">Nilai Kontrak (angka)</Label>
              <Input id="f-value" inputMode="numeric" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="mis. 42000000" className="mt-1.5 h-11 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="f-curr" className="text-xs font-bold">Mata Uang</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger id="f-curr" className="mt-1.5 h-11 rounded-xl" aria-label="Mata uang">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["IDR", "USD", "SAR", "MYR", "HKD", "JPY", "TWD", "SGD", "AED", "QAR", "EUR"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="f-tags" className="text-xs font-bold">Tag (pisahkan dengan koma)</Label>
            <Input id="f-tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="mis. pekerja migran, saudi, pkwt" className="mt-1.5 h-11 rounded-xl" />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <div>
              <Label htmlFor="f-renew" className="text-sm font-bold text-slate-800">Perpanjangan Otomatis (Auto-Renew)</Label>
              <p className="text-xs text-slate-500">Pengingat khusus akan diaktifkan menjelang H-60</p>
            </div>
            <Switch id="f-renew" checked={form.autoRenew} onCheckedChange={(v) => setForm({ ...form, autoRenew: v })} />
          </div>
          <div>
            <Label className="text-xs font-bold">Pengingat Jatuh Tempo</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {REMINDER_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() =>
                    setReminders((r) => (r.includes(d) ? r.filter((x) => x !== d) : [...r, d].sort((a, b) => b - a)))
                  }
                  aria-pressed={reminders.includes(d)}
                  className={cn(
                    "rounded-xl border-2 px-3.5 py-2 text-xs font-bold transition-colors",
                    reminders.includes(d)
                      ? "border-teal-600 bg-teal-50 text-teal-800"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  )}
                >
                  H-{d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="f-notes" className="text-xs font-bold">Catatan Internal (opsional)</Label>
            <Textarea id="f-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1.5 min-h-20 rounded-xl" />
          </div>
        </div>

        {/* Key clauses from AI */}
        {extracted?.keyClauses && extracted.keyClauses.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50/50 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-teal-900">
              <FileText className="h-4 w-4" aria-hidden="true" />
              Klausul Penting (dikenali AI)
            </p>
            <ul className="mt-2.5 space-y-2">
              {extracted.keyClauses.map((k, i) => (
                <li key={i} className="rounded-xl bg-white px-3.5 py-2.5">
                  <p className="text-xs font-extrabold text-teal-800">{k.clause}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{k.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={() => void save("draft")}
            disabled={saving}
            variant="outline"
            className="h-12 flex-1 rounded-xl border-slate-300 text-sm font-bold"
          >
            {saving && saveMode === "draft" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            Simpan sebagai Draft
          </Button>
          <Button
            onClick={() => void save("submit")}
            disabled={saving}
            className="h-12 flex-1 rounded-xl bg-teal-700 text-sm font-bold text-white hover:bg-teal-800"
          >
            {saving && saveMode === "submit" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            Simpan & Ajukan Approval
          </Button>
        </div>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
          <Upload className="h-3.5 w-3.5" aria-hidden="true" />
          Sumber tersimpan: {sourceLabel(sourceType)} · semua teks dapat diedit sebelum disimpan
        </p>
      </SectionCard>
    </div>
  );
}

function sourceLabel(s: string): string {
  const map: Record<string, string> = {
    camera: "kamera",
    photo: "galeri foto",
    file: "file unggahan",
    cloud: "link cloud",
    template: "template",
    manual: "input manual",
  };
  return map[s] ?? s;
}

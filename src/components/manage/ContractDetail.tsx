// SafeSign Manajemen — contract detail: header actions, edit dialog, info tab,
// AI analysis tab (reuses Analyzer components), and the tab router.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Ban,
  FileText,
  Loader2,
  MessageCircle,
  Pencil,
  Send,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { fetchContractDetail, useManage } from "@/lib/manage/store";
import type { ContractDetailDTO } from "@/lib/manage/types";
import {
  CATEGORY_OPTIONS,
  formatFullCurrency,
  formatDate,
  parseTags,
} from "@/lib/manage/types";
import { getDictionary } from "@/lib/safesign/i18n";
import type { AnalysisResult } from "@/lib/safesign/types";
import { AnalysisResultView } from "@/components/safesign/AnalysisResultView";
import { ChatBox } from "@/components/safesign/ChatBox";
import { ApprovalTab, RemindersTab, SignaturesTab, VersionsTab } from "./ContractTabs";
import { CategoryBadge, LoadingRow, RiskBadge, SectionCard, StatusBadge, TimeBadge } from "./shared";

const idDict = getDictionary("id");

type TabKey = "info" | "analysis" | "versions" | "approval" | "sign" | "reminders";

export function ContractDetail() {
  const { selectedContractId, closeContract, currentUser, bumpRefresh } = useManage();
  const [contract, setContract] = useState<ContractDetailDTO | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<TabKey>("info");
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const load = useCallback(async () => {
    if (!selectedContractId) return;
    try {
      setContract(null);
      const c = await fetchContractDetail(selectedContractId);
      setContract(c);
      setError(false);
    } catch {
      setError(true);
    }
  }, [selectedContractId]);

  useEffect(() => {
    void load();
  }, [load]);

  const analysis = useMemo<AnalysisResult | null>(() => {
    if (!contract?.analysisJson) return null;
    try {
      return JSON.parse(contract.analysisJson) as AnalysisResult;
    } catch {
      return null;
    }
  }, [contract?.analysisJson]);

  if (error) {
    return (
      <SectionCard>
        <p className="text-sm font-medium text-red-700">Kontrak tidak ditemukan atau gagal dimuat.</p>
        <Button variant="outline" onClick={closeContract} className="mt-3 rounded-xl">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Registry
        </Button>
      </SectionCard>
    );
  }
  if (!contract) return <LoadingRow label="Memuat detail kontrak…" />;

  const isAdmin = currentUser.role === "admin";
  const canEdit = isAdmin || currentUser.role === "legal" || currentUser.role === "manager" || currentUser.role === "staff";

  /* ---------- actions ---------- */

  const workflow = async (action: "submit" | "approve" | "reject" | "terminate" | "reopen", note?: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/contracts/${contract.id}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, actorName: currentUser.name, note }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error ?? "GAGAL");
      toast({
        title: "Berhasil",
        description:
          action === "submit" ? "Kontrak diajukan untuk approval." :
          action === "approve" ? "Kontrak disetujui." :
          action === "reject" ? "Kontrak ditolak." :
          action === "terminate" ? "Kontrak dihentikan." :
          "Kontrak dibuka kembali sebagai draft.",
      });
      await load();
      bumpRefresh();
    } catch {
      toast({ title: "Gagal", description: "Aksi gagal dijalankan. Coba lagi.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleSign = async (r: { signerName: string; signerRole: string; signatureData: string; typedName: string | null }) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/contracts/${contract.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(r),
      });
      const data = (await res.json()) as { ok: boolean };
      if (!data.ok) throw new Error();
      toast({ title: "Tanda tangan tersimpan", description: `Ditandatangani oleh ${r.signerName}.` });
      await load();
      bumpRefresh();
    } catch {
      toast({ title: "Gagal", description: "Tanda tangan gagal disimpan.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleReminders = async (reminders: number[]) => {
    setBusy(true);
    try {
      await fetch(`/api/contracts/${contract.id}/reminders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminders }),
      });
      await load();
      bumpRefresh();
    } finally {
      setBusy(false);
    }
  };

  const handleAck = async () => {
    setBusy(true);
    try {
      const dl = contract.endDate
        ? Math.round((new Date(contract.endDate).getTime() - Date.now()) / 86_400_000)
        : null;
      const triggered = contract.reminders.filter((t) => (dl ?? Infinity) <= t);
      const key = `${contract.id}:${triggered.length ? Math.max(...triggered) : 90}`;
      await fetch(`/api/contracts/${contract.id}/reminders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ackKey: key }),
      });
      await load();
      bumpRefresh();
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/contracts/${contract.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId, actorName: currentUser.name }),
      });
      const data = (await res.json()) as { ok: boolean };
      if (!data.ok) throw new Error();
      toast({ title: "Restore berhasil", description: "Kontrak dikembalikan ke versi yang dipilih." });
      await load();
      bumpRefresh();
    } catch {
      toast({ title: "Gagal", description: "Restore versi gagal.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await fetch(`/api/contracts/${contract.id}`, { method: "DELETE" });
      toast({ title: "Kontrak dihapus" });
      closeContract();
      bumpRefresh();
    } catch {
      toast({ title: "Gagal", description: "Hapus kontrak gagal.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const runAnalysis = async () => {
    if (!contract.contentText || contract.contentText.trim().length < 20) {
      toast({
        title: "Teks kontrak belum cukup",
        description: "Tambahkan teks kontrak (unggah file atau tempel) melalui Edit Kontrak terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }
    setAnalyzing(true);
    try {
      const res = await fetch("/api/safesign/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractText: contract.contentText.slice(0, 20_000), lang: "id" }),
      });
      const data = (await res.json()) as { ok: boolean; analysis?: AnalysisResult };
      if (!data.ok || !data.analysis) throw new Error();
      await fetch(`/api/contracts/${contract.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisJson: JSON.stringify(data.analysis),
          riskLevel: data.analysis.risk_level,
          editedBy: currentUser.name,
        }),
      });
      await load();
      bumpRefresh();
      toast({ title: "Analisis AI selesai", description: `Tingkat risiko: ${data.analysis.risk_level.toUpperCase()}.` });
    } catch {
      toast({ title: "Analisis gagal", description: "AI tidak dapat menganalisis teks ini. Coba lagi.", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div>
        <Button
          variant="ghost"
          onClick={closeContract}
          className="h-9 rounded-xl px-3 text-sm font-semibold text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Registry
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold leading-snug tracking-tight text-slate-900 sm:text-2xl">
              {contract.title}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              {contract.contractNo ?? "Tanpa nomor"} · {contract.partyA ?? "?"} ↔ {contract.partyB ?? "?"}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <StatusBadge status={contract.status} />
              <TimeBadge contract={contract} />
              <CategoryBadge category={contract.category} />
              <RiskBadge risk={contract.riskLevel} />
              {contract.autoRenew ? (
                <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
                  Auto-renew
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:shrink-0">
            {canEdit ? (
              <Button
                variant="outline"
                onClick={() => setEditOpen(true)}
                className="h-10 rounded-xl text-sm font-semibold"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit
              </Button>
            ) : null}
            {(contract.status === "draft" || contract.status === "rejected") ? (
              <Button
                onClick={() => void workflow("submit")}
                disabled={busy}
                className="h-10 rounded-xl bg-teal-700 text-sm font-bold text-white hover:bg-teal-800"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                Ajukan
              </Button>
            ) : null}
            {contract.status === "approved" ? (
              <Button
                variant="outline"
                onClick={() => void workflow("terminate")}
                disabled={busy}
                className="h-10 rounded-xl text-sm font-semibold text-slate-600"
              >
                <Ban className="h-4 w-4" aria-hidden="true" />
                Hentikan
              </Button>
            ) : null}
            {isAdmin ? (
              <>
                {(contract.status === "terminated" || contract.status === "rejected") ? (
                  <Button
                    variant="outline"
                    onClick={() => void workflow("reopen")}
                    disabled={busy}
                    className="h-10 rounded-xl text-sm font-semibold"
                  >
                    Buka Ulang
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  onClick={() => setDeleteOpen(true)}
                  className="h-10 rounded-xl border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Hapus
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList className="h-auto w-full max-w-full flex-wrap justify-start gap-1 rounded-2xl bg-slate-100 p-1.5">
          <TabsTrigger value="info" className="rounded-xl px-3 py-2 text-xs font-bold data-[state=active]:bg-white sm:text-sm">
            Informasi
          </TabsTrigger>
          <TabsTrigger value="analysis" className="rounded-xl px-3 py-2 text-xs font-bold data-[state=active]:bg-white sm:text-sm">
            <Sparkles className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
            Analisis AI
          </TabsTrigger>
          <TabsTrigger value="versions" className="rounded-xl px-3 py-2 text-xs font-bold data-[state=active]:bg-white sm:text-sm">
            Versi ({contract.versions.length})
          </TabsTrigger>
          <TabsTrigger value="approval" className="rounded-xl px-3 py-2 text-xs font-bold data-[state=active]:bg-white sm:text-sm">
            Approval
          </TabsTrigger>
          <TabsTrigger value="sign" className="rounded-xl px-3 py-2 text-xs font-bold data-[state=active]:bg-white sm:text-sm">
            TTD ({contract.signatures.length})
          </TabsTrigger>
          <TabsTrigger value="reminders" className="rounded-xl px-3 py-2 text-xs font-bold data-[state=active]:bg-white sm:text-sm">
            Pengingat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <InfoTab contract={contract} />
        </TabsContent>

        <TabsContent value="analysis" className="mt-4 space-y-4">
          {analysis ? (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-800">
                    Hasil analisis AI — tersimpan otomatis di registry
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void runAnalysis()}
                    disabled={analyzing}
                    className="h-9 rounded-xl text-xs font-semibold"
                  >
                    {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />}
                    Analisis Ulang
                  </Button>
                </div>
              </div>
              <AnalysisResultView analysis={analysis} dict={idDict} />
              {contract.contentText && contract.contentText.trim().length >= 20 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                  <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
                    <MessageCircle className="h-4.5 w-4.5 text-teal-700" aria-hidden="true" />
                    Tanya AI tentang kontrak ini
                  </h2>
                  <ChatBox
                    contractText={contract.contentText.slice(0, 20_000)}
                    analysis={analysis}
                    lang="id"
                    dict={idDict}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <SectionCard>
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Sparkles className="mb-3 h-10 w-10 text-teal-600" aria-hidden="true" />
                <p className="text-base font-bold text-slate-800">Belum ada analisis AI</p>
                <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-500">
                  Jalankan analisis risiko untuk mendeteksi klausul berbahaya (red flags), ringkasan
                  plain-language, dan tingkat risiko kontrak. Teks kontrak diambil dari isi yang tersimpan.
                </p>
                <Button
                  onClick={() => void runAnalysis()}
                  disabled={analyzing}
                  className="mt-5 h-12 rounded-xl bg-teal-700 px-6 text-sm font-bold text-white hover:bg-teal-800"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Menganalisis… (±20 detik)
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      Jalankan Analisis Risiko AI
                    </>
                  )}
                </Button>
                {(!contract.contentText || contract.contentText.trim().length < 20) ? (
                  <p className="mt-3 text-xs text-amber-600">
                    ⚠ Teks kontrak belum tersedia/tidak cukup — tambahkan lewat “Edit Kontrak”.
                  </p>
                ) : null}
              </div>
            </SectionCard>
          )}
        </TabsContent>

        <TabsContent value="versions" className="mt-4">
          <VersionsTab contract={contract} onRestore={handleRestore} busyId={busy ? "busy" : null} />
        </TabsContent>

        <TabsContent value="approval" className="mt-4">
          <ApprovalTab
            contract={contract}
            role={currentUser.role}
            userName={currentUser.name}
            onDecide={(a, n) => workflow(a, n)}
            onSubmit={() => workflow("submit")}
            busy={busy}
          />
        </TabsContent>

        <TabsContent value="sign" className="mt-4">
          <SignaturesTab contract={contract} onSign={handleSign} busy={busy} />
        </TabsContent>

        <TabsContent value="reminders" className="mt-4">
          <RemindersTab contract={contract} onToggle={handleReminders} onAck={handleAck} busy={busy} />
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <EditContractDialog
        contract={contract}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={async () => {
          await load();
          bumpRefresh();
        }}
      />

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus kontrak ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Kontrak “{contract.title}” beserta seluruh versi, approval, dan tanda tangan akan dihapus
              permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              className="rounded-xl bg-red-600 hover:bg-red-700"
            >
              Ya, Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ================= Info tab ================= */

function InfoTab({ contract }: { contract: ContractDetailDTO }) {
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Nomor Kontrak", value: contract.contractNo ?? "—" },
    { label: "Pihak Pertama", value: contract.partyA ?? "—" },
    { label: "Pihak Kedua", value: contract.partyB ?? "—" },
    { label: "Tanggal Mulai", value: formatDate(contract.startDate) },
    { label: "Tanggal Berakhir", value: formatDate(contract.endDate) },
    { label: "Nilai Kontrak", value: formatFullCurrency(contract.value, contract.currency) },
    { label: "Perpanjangan Otomatis", value: contract.autoRenew ? "Ya (auto-renew aktif)" : "Tidak" },
    { label: "Sumber Dokumen", value: sourceLabel(contract.sourceType) },
    { label: "Dibuat Oleh", value: contract.createdBy ? `${contract.createdBy.name}` : "—" },
    { label: "Dibuat", value: formatDate(contract.createdAt) },
    { label: "Terakhir Diperbarui", value: formatDate(contract.updatedAt) },
  ];

  return (
    <div className="space-y-4">
      <SectionCard title="Detail Kontrak">
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.label} className="flex flex-col border-b border-slate-100 pb-2.5">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{r.label}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-800">{r.value}</dd>
            </div>
          ))}
        </dl>
        {contract.tags ? (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Tag:</span>
            {parseTags(contract.tags).map((t) => (
              <span key={t} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                #{t}
              </span>
            ))}
          </div>
        ) : null}
        {contract.notes ? (
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 p-3.5">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Catatan</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-900">{contract.notes}</p>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="Teks / Isi Kontrak">
        {contract.contentText && contract.contentText.trim() ? (
          <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
            {contract.contentText}
          </pre>
        ) : (
          <p className="py-6 text-center text-sm text-slate-400">
            Teks kontrak belum tersimpan. Tambahkan lewat “Edit Kontrak” → tempel teks atau unggah ulang dokumen.
          </p>
        )}
      </SectionCard>
    </div>
  );
}

function sourceLabel(s: string | null): string {
  const map: Record<string, string> = {
    camera: "Foto Kamera",
    photo: "Galeri Foto",
    file: "File Unggahan",
    cloud: "Link Cloud",
    template: "Template",
    manual: "Input Manual",
  };
  return s ? (map[s] ?? s) : "—";
}

/* ================= Edit dialog ================= */

function EditContractDialog({
  contract,
  open,
  onOpenChange,
  onSaved,
}: {
  contract: ContractDetailDTO;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    title: contract.title,
    contractNo: contract.contractNo ?? "",
    partyA: contract.partyA ?? "",
    partyB: contract.partyB ?? "",
    startDate: contract.startDate ? contract.startDate.slice(0, 10) : "",
    endDate: contract.endDate ? contract.endDate.slice(0, 10) : "",
    value: contract.value?.toString() ?? "",
    currency: contract.currency,
    category: contract.category,
    tags: contract.tags,
    autoRenew: contract.autoRenew,
    notes: contract.notes ?? "",
    contentText: contract.contentText ?? "",
    changeNote: "",
  });
  const [saving, setSaving] = useState(false);
  const { currentUser } = useManage();

  useEffect(() => {
    if (open) {
      setForm({
        title: contract.title,
        contractNo: contract.contractNo ?? "",
        partyA: contract.partyA ?? "",
        partyB: contract.partyB ?? "",
        startDate: contract.startDate ? contract.startDate.slice(0, 10) : "",
        endDate: contract.endDate ? contract.endDate.slice(0, 10) : "",
        value: contract.value?.toString() ?? "",
        currency: contract.currency,
        category: contract.category,
        tags: contract.tags,
        autoRenew: contract.autoRenew,
        notes: contract.notes ?? "",
        contentText: contract.contentText ?? "",
        changeNote: "",
      });
    }
  }, [open, contract]);

  const save = async () => {
    if (!form.title.trim()) {
      toast({ title: "Judul wajib diisi", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/contracts/${contract.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          value: form.value.trim() ? Number(form.value.replace(/[^\d.]/g, "")) : null,
          editedBy: currentUser.name,
          changeNote: form.changeNote.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { ok: boolean };
      if (!data.ok) throw new Error();
      toast({ title: "Kontrak diperbarui", description: "Perubahan dicatat di riwayat versi." });
      onOpenChange(false);
      await onSaved();
    } catch {
      toast({ title: "Gagal", description: "Perubahan tidak tersimpan. Coba lagi.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Edit Kontrak</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="edit-title" className="text-xs font-bold">Judul Kontrak *</Label>
            <Input id="edit-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1.5 h-11 rounded-xl" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-no" className="text-xs font-bold">Nomor Kontrak</Label>
              <Input id="edit-no" value={form.contractNo} onChange={(e) => setForm({ ...form, contractNo: e.target.value })} className="mt-1.5 h-11 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-bold">Kategori</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1.5 h-11 rounded-xl" aria-label="Kategori">
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
              <Label htmlFor="edit-pa" className="text-xs font-bold">Pihak Pertama</Label>
              <Input id="edit-pa" value={form.partyA} onChange={(e) => setForm({ ...form, partyA: e.target.value })} className="mt-1.5 h-11 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="edit-pb" className="text-xs font-bold">Pihak Kedua</Label>
              <Input id="edit-pb" value={form.partyB} onChange={(e) => setForm({ ...form, partyB: e.target.value })} className="mt-1.5 h-11 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="edit-start" className="text-xs font-bold">Tanggal Mulai</Label>
              <Input id="edit-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="mt-1.5 h-11 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="edit-end" className="text-xs font-bold">Tanggal Berakhir</Label>
              <Input id="edit-end" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="mt-1.5 h-11 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="edit-value" className="text-xs font-bold">Nilai (angka)</Label>
              <Input id="edit-value" inputMode="numeric" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="mis. 42000000" className="mt-1.5 h-11 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="edit-curr" className="text-xs font-bold">Mata Uang</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger id="edit-curr" className="mt-1.5 h-11 rounded-xl" aria-label="Mata uang">
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
            <Label htmlFor="edit-tags" className="text-xs font-bold">Tag (pisahkan dengan koma)</Label>
            <Input id="edit-tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="pekerja migran, saudi" className="mt-1.5 h-11 rounded-xl" />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <div>
              <Label htmlFor="edit-renew" className="text-sm font-bold text-slate-800">Perpanjangan Otomatis</Label>
              <p className="text-xs text-slate-500">Kontrak diperpanjang otomatis saat berakhir</p>
            </div>
            <Switch id="edit-renew" checked={form.autoRenew} onCheckedChange={(v) => setForm({ ...form, autoRenew: v })} />
          </div>
          <div>
            <Label htmlFor="edit-notes" className="text-xs font-bold">Catatan Internal</Label>
            <Textarea id="edit-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1.5 min-h-20 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="edit-content" className="text-xs font-bold">Teks Kontrak (untuk analisis AI)</Label>
            <Textarea id="edit-content" value={form.contentText} onChange={(e) => setForm({ ...form, contentText: e.target.value })} className="mt-1.5 min-h-36 rounded-xl font-mono text-xs" placeholder="Tempel teks kontrak di sini…" />
          </div>
          <div>
            <Label htmlFor="edit-change" className="text-xs font-bold">Catatan Perubahan (untuk riwayat versi)</Label>
            <Input id="edit-change" value={form.changeNote} onChange={(e) => setForm({ ...form, changeNote: e.target.value })} placeholder="mis. Amandemen pasal upah" className="mt-1.5 h-11 rounded-xl" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 rounded-xl">
              Batal
            </Button>
            <Button onClick={() => void save()} disabled={saving} className="h-11 rounded-xl bg-teal-700 font-bold text-white hover:bg-teal-800">
              {saving ? "Menyimpan…" : "Simpan Perubahan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

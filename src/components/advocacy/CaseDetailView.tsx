// SafeSign Advokasi — detail kasus: draf (sunting + gerbang izin pengiriman),
// riwayat email, tindak lanjut AI, ubah status, timeline, kontrak terkait.
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ClipboardCopy,
  Clock,
  ExternalLink,
  FileText,
  Languages,
  Lightbulb,
  Loader2,
  Mail,
  MailCheck,
  RefreshCcw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  fetchCaseDetail,
  generateFollowUp,
  sendCaseEmail,
  sendFollowUpEmail,
  updateCase,
  useAdvocacy,
} from "@/lib/advocacy/store";
import {
  CASE_STATUS_META,
  CATEGORY_META,
  EVENT_META,
  PRIORITY_META,
  type AdvocacyCaseDTO,
  type CaseCategory,
  type CaseEmailDTO,
  type EmailDraft,
} from "@/lib/advocacy/types";
import { formatDateTime } from "@/lib/manage/types";
import { useManage } from "@/lib/manage/store";
import { TypeChip } from "./NewCaseView";

const LANG_LABEL: Record<string, string> = {
  English: "Bahasa Inggris",
  Indonesian: "Bahasa Indonesia",
  Arabic: "Bahasa Arab",
};

export function CaseDetailView({ onOpenContract }: { onOpenContract: (id: string) => void }) {
  const { selectedCaseId, closeCase, bumpRefresh } = useAdvocacy();
  const currentUser = useManage((s) => s.currentUser);
  const [kase, setKase] = useState<AdvocacyCaseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // sunting draf
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [editDirty, setEditDirty] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // gerbang izin kirim
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ mode: "smtp" | "manual"; mailto?: string; noEmail?: boolean; website?: string | null } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // tindak lanjut
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpDraft, setFollowUpDraft] = useState<EmailDraft | null>(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [followUpChecked, setFollowUpChecked] = useState(false);
  const [followUpSending, setFollowUpSending] = useState(false);
  const [showFollowUpTranslation, setShowFollowUpTranslation] = useState(false);

  // status & catatan
  const [statusNote, setStatusNote] = useState("");
  const [statusBusy, setStatusBusy] = useState(false);

  const load = useCallback(async () => {
    if (!selectedCaseId) return;
    setLoading(true);
    setError(null);
    try {
      const c = await fetchCaseDetail(selectedCaseId);
      setKase(c);
      const draftEmail = c.emails?.find((e) => e.type === "initial" && e.status === "draft");
      if (draftEmail) {
        setSubject(draftEmail.subject);
        setEmailBody(draftEmail.body);
        setEditDirty(false);
      }
    } catch {
      setError("Gagal memuat kasus.");
    } finally {
      setLoading(false);
    }
  }, [selectedCaseId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !kase) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-40 animate-pulse rounded-2xl border border-slate-100 bg-slate-100/60" />
        <div className="h-64 animate-pulse rounded-2xl border border-slate-100 bg-slate-100/60" />
      </div>
    );
  }
  if (error || !kase) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="font-bold text-red-700">{error ?? "Kasus tidak ditemukan."}</p>
        <Button variant="outline" onClick={closeCase} className="mt-4 gap-2">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke daftar
        </Button>
      </div>
    );
  }

  const cat = CATEGORY_META[kase.category as CaseCategory];
  const draftEmail = kase.emails?.find((e) => e.type === "initial" && e.status === "draft") ?? null;
  const sentEmails = (kase.emails ?? []).filter((e) => e.status === "sent");
  const langLabel = LANG_LABEL[kase.institution.language] ?? kase.institution.language;

  const handleSend = async () => {
    if (!permissionChecked) return;
    setSending(true);
    setSendError(null);
    try {
      // simpan suntingan draf bila berubah, sebelum kirim
      if (editDirty) {
        await updateCase(kase.id, { subject, body: emailBody });
      }
      const res = await sendCaseEmail(kase.id, currentUser.email);
      setSendResult({ mode: res.mode, mailto: res.mailto, noEmail: res.noEmail, website: res.website });
      setPermissionOpen(false);
      setPermissionChecked(false);
      await load();
      bumpRefresh();
    } catch {
      setSendError("Pengiriman gagal. Coba lagi sebentar.");
    } finally {
      setSending(false);
    }
  };

  const handleFollowUpDraft = async () => {
    setFollowUpLoading(true);
    setFollowUpError(null);
    setFollowUpDraft(null);
    setFollowUpChecked(false);
    setShowFollowUpTranslation(false);
    setFollowUpOpen(true);
    try {
      const res = await generateFollowUp(kase.id);
      setFollowUpDraft(res.draft);
    } catch {
      setFollowUpError("AI gagal menyusun tindak lanjut. Coba lagi.");
    } finally {
      setFollowUpLoading(false);
    }
  };

  const handleFollowUpSend = async () => {
    if (!followUpDraft || !followUpChecked) return;
    setFollowUpSending(true);
    try {
      const res = await sendFollowUpEmail(kase.id, followUpDraft, currentUser.email);
      setFollowUpOpen(false);
      setSendResult({ mode: res.mode, mailto: res.mailto, noEmail: res.noEmail, website: res.website });
      await load();
      bumpRefresh();
    } catch {
      setFollowUpError("Pengiriman tindak lanjut gagal. Coba lagi.");
    } finally {
      setFollowUpSending(false);
    }
  };

  const changeStatus = async (status: string) => {
    setStatusBusy(true);
    try {
      await updateCase(kase.id, { status, note: statusNote.trim() || undefined, by: currentUser.email });
      setStatusNote("");
      await load();
      bumpRefresh();
    } catch {
      setError("Gagal mengubah status.");
    } finally {
      setStatusBusy(false);
    }
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      window.setTimeout(() => alert(`${label} tersalin ke clipboard.`), 0);
    } catch {
      alert("Gagal menyalin — salin manual dari kotak email.");
    }
  };

  return (
    <section aria-label={`Detail kasus ${kase.caseNumber}`} className="space-y-5">
      <Button variant="ghost" onClick={closeCase} className="gap-2 px-2 text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Kembali ke Kasus Saya
      </Button>

      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-400">{kase.caseNumber}</span>
          <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-bold", CASE_STATUS_META[kase.status]?.chip)}>
            {CASE_STATUS_META[kase.status]?.label ?? kase.status}
          </span>
          <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-bold", PRIORITY_META[kase.priority]?.chip)}>
            Prioritas {PRIORITY_META[kase.priority]?.label ?? kase.priority}
          </span>
          {cat ? <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-bold", cat.chip)}>{cat.label}</span> : null}
          {kase.anonymous ? (
            <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-0.5 text-xs font-bold text-slate-600">Anonim</span>
          ) : null}
        </div>
        <h1 className="mt-2.5 text-xl font-extrabold leading-snug tracking-tight text-slate-900 sm:text-2xl">{kase.title}</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Dibuat {formatDateTime(kase.createdAt)} oleh {kase.createdByName || "—"} · Asal {kase.originCountry}
          {kase.destinationCountry ? ` · Penempatan ${kase.destinationCountry}` : ""}
        </p>
      </div>

      {/* Hasil kirim (mode manual / tanpa email) */}
      {sendResult ? (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-teal-900">
            <MailCheck className="h-5 w-5" aria-hidden="true" />
            {sendResult.mode === "smtp"
              ? "Email terkirim melalui server email."
              : sendResult.noEmail
                ? "Kasus tercatat terkirim — pengiriman manual"
                : "Kasus tercatat terkirim (mode manual)."}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-teal-800">
            {sendResult.noEmail
              ? "Lembaga ini belum memiliki email resmi di basis data kami. Salin draf email di bawah, lalu kirim melalui formulir kontak di situs resminya, atau sampaikan via telepon/WhatsApp yang tertera di kartu lembaga."
              : sendResult.mode === "manual"
                ? "Untuk memastikan email sampai: buka aplikasi email Anda (tombol di bawah — subjek & isi sudah terisi), atau salin isinya lalu tempel ke formulir kontak lembaga."
                : "Salinan tersimpan di riwayat email kasus ini."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sendResult.mailto ? (
              <a
                href={sendResult.mailto}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Buka di Email Saya
              </a>
            ) : null}
            <Button variant="outline" size="sm" className="gap-1.5 border-teal-300 bg-white" onClick={() => copy(`${subject}\n\n${emailBody}`, "Email")}>
              <ClipboardCopy className="h-4 w-4" aria-hidden="true" />
              Salin Email
            </Button>
            {kase.institution.website || sendResult.website ? (
              <a
                href={(sendResult.website || kase.institution.website) as string}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-teal-300 bg-white px-4 text-sm font-bold text-teal-800 hover:bg-teal-100"
              >
                <Building2 className="h-4 w-4" aria-hidden="true" />
                Situs Lembaga
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Kolom kiri: info & aksi */}
        <div className="space-y-5 lg:col-span-2">
          {/* Lembaga tujuan */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-900">Lembaga tujuan</p>
            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <TypeChip type={kase.institution.type} />
                <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  <Languages className="h-3 w-3" aria-hidden="true" />
                  Email AI: {langLabel}
                </span>
              </div>
              <p className="mt-2.5 text-sm font-bold text-slate-900">{kase.institution.shortName ?? kase.institution.name}</p>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                {kase.institution.email ? (
                  <p className="break-all">
                    <span className="font-semibold">Email:</span> {kase.institution.email}
                  </p>
                ) : null}
                {kase.institution.responseTime ? (
                  <p className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    Estimasi respon: {kase.institution.responseTime}
                  </p>
                ) : null}
                {kase.institution.website ? (
                  <a href={kase.institution.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    Situs resmi
                  </a>
                ) : null}
              </div>
            </div>
            {kase.contractId ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full gap-2"
                onClick={() => {
                  if (kase.contractId) onOpenContract(kase.contractId);
                }}
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                Lihat Kontrak Terkait (di Manajemen)
              </Button>
            ) : null}
          </div>

          {/* Kronologi & lampiran */}
          {kase.chronology ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-900">Kronologi versi Anda</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{kase.chronology}</p>
              {kase.attachments.length > 0 ? (
                <div className="mt-4 space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Lampiran terdaftar</p>
                  {kase.attachments.map((a, i) => (
                    <p key={i} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-600">
                      📎 {a.name}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Aksi status */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-900">Perbarui status kasus</p>
            <p className="mt-0.5 text-xs text-slate-500">Catat perkembangan dari lembaga (respon diterima, selesai, dll).</p>
            <Input
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Catatan opsional — mis. Dijawab via telepon oleh Atase"
              className="mt-3"
              aria-label="Catatan perkembangan"
              maxLength={500}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={statusBusy} onClick={() => changeStatus("in_progress")} className="gap-1.5">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Sedang Ditangani
              </Button>
              <Button variant="outline" size="sm" disabled={statusBusy} onClick={() => changeStatus("resolved")} className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Selesai
              </Button>
              <Button variant="outline" size="sm" disabled={statusBusy} onClick={() => changeStatus("closed")} className="gap-1.5">
                Tutup Kasus
              </Button>
            </div>
          </div>
        </div>

        {/* Kolom kanan: email & timeline */}
        <div className="space-y-5 lg:col-span-3">
          {/* ── Draf belum terkirim: sunting + gerbang izin ── */}
          {draftEmail ? (
            <div className="space-y-4 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Mail className="h-4 w-4 text-amber-600" aria-hidden="true" />
                  Draf email ({langLabel}) — belum terkirim
                </p>
                <p className="mt-0.5 text-xs text-slate-500">Sunting bila perlu, lalu beri izin untuk mengirim.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="detail-subject">Subjek</Label>
                <Input id="detail-subject" value={subject} onChange={(e) => { setSubject(e.target.value); setEditDirty(true); }} maxLength={250} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="detail-body">Isi email</Label>
                <Textarea
                  id="detail-body"
                  value={emailBody}
                  onChange={(e) => { setEmailBody(e.target.value); setEditDirty(true); }}
                  rows={14}
                  className="font-mono text-[13px] leading-relaxed"
                />
              </div>
              {draftEmail.bodyUser ? (
                <details className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <summary className="cursor-pointer text-sm font-bold text-slate-700">Terjemahan Bahasa Indonesia (klik untuk melihat)</summary>
                  <pre className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600" style={{ fontFamily: "inherit" }}>
                    {draftEmail.bodyUser}
                  </pre>
                </details>
              ) : null}
              {draftEmail.advice ? (
                <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {draftEmail.advice}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                {editDirty ? (
                  <Button
                    variant="outline"
                    disabled={savingEdit}
                    onClick={async () => {
                      setSavingEdit(true);
                      try {
                        await updateCase(kase.id, { subject, body: emailBody });
                        setEditDirty(false);
                        await load();
                      } finally {
                        setSavingEdit(false);
                      }
                    }}
                    className="gap-1.5"
                  >
                    {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                    Simpan Perubahan
                  </Button>
                ) : null}
                <Button onClick={() => setPermissionOpen(true)} className="ml-auto gap-2 bg-teal-700 hover:bg-teal-800">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Kirim dengan Izin Saya
                </Button>
              </div>
              {sendError ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-700" role="alert">
                  {sendError}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* ── Tindak lanjut ── */}
          {(kase.status === "sent" || kase.status === "followed_up") && !draftEmail ? (
            <div
              className={cn(
                "rounded-2xl border p-5",
                kase.followUpOverdueDays > 0 ? "border-red-200 bg-red-50" : "border-slate-200 bg-white shadow-sm"
              )}
            >
              {kase.followUpOverdueDays > 0 ? (
                <p className="flex items-start gap-2 text-sm font-bold text-red-800">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  Belum ada respon {kase.followUpOverdueDays} hari sejak jadwal tindak lanjut.
                </p>
              ) : (
                <p className="flex items-start gap-2 text-sm font-bold text-slate-800">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                  Menunggu respon lembaga.
                </p>
              )}
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                AI dapat menyusun email tindak lanjut yang sopan namun tegas — merujuk email awal dan meminta kabar
                perkembangan.
              </p>
              <Button onClick={handleFollowUpDraft} className="mt-3 gap-2 bg-teal-700 hover:bg-teal-800">
                <Send className="h-4 w-4" aria-hidden="true" />
                Susun Tindak Lanjut dengan AI
              </Button>
            </div>
          ) : null}

          {/* ── Riwayat email terkirim ── */}
          {sentEmails.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-900">Riwayat email ({sentEmails.length})</p>
              {sentEmails.map((e) => (
                <EmailHistoryCard key={e.id} email={e} onCopy={() => copy(`${e.subject}\n\n${e.body}`, "Email")} />
              ))}
            </div>
          ) : null}

          {/* ── Timeline ── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-900">Linimasa kasus</p>
            <ol className="mt-4 space-y-4 border-l-2 border-slate-100 pl-5">
              {kase.timeline.map((t, i) => (
                <li key={i} className="relative">
                  <span
                    className={cn(
                      "absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white",
                      t.event === "SENT" || t.event === "FOLLOWUP_SENT"
                        ? "bg-teal-600"
                        : t.event === "STATUS_CHANGED"
                          ? "bg-amber-500"
                          : "bg-slate-300"
                    )}
                    aria-hidden="true"
                  />
                  <p className="text-sm font-bold text-slate-800">
                    {EVENT_META[t.event]?.label ?? t.event}
                    <span className="ml-2 text-xs font-normal text-slate-400">{formatDateTime(t.at)}</span>
                  </p>
                  {t.note ? <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{t.note}</p> : null}
                  {t.by ? <p className="mt-0.5 text-xs text-slate-400">oleh {t.by}</p> : null}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* ── Dialog gerbang izin (email awal) ── */}
      <Dialog open={permissionOpen} onOpenChange={(o) => { setPermissionOpen(o); if (!o) setPermissionChecked(false); }}>
        <DialogContent className="rounded-2xl sm:max-w-lg" aria-describedby="izin-kirim-desc">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-700" aria-hidden="true" />
              Izinkan SafeSign mengirim email ini?
            </DialogTitle>
            <DialogDescription id="izin-kirim-desc">
              Email akan dikirim atas nama Anda ke <span className="font-bold text-slate-700">{kase.institution.shortName ?? kase.institution.name}</span>{" "}
              <span className="text-slate-600">({kase.institution.email ?? "via situs resmi"})</span> dengan subjek
              “{subject.length > 60 ? subject.slice(0, 60) + "…" : subject}”.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <pre className="whitespace-pre-wrap text-xs leading-relaxed text-slate-600" style={{ fontFamily: "inherit" }}>
              {emailBody.slice(0, 800)}
              {emailBody.length > 800 ? "\n…" : ""}
            </pre>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4">
            <Checkbox
              checked={permissionChecked}
              onCheckedChange={(v) => setPermissionChecked(v === true)}
              aria-label="Saya mengizinkan pengiriman email ini"
              className="mt-0.5"
            />
            <span className="text-sm font-semibold leading-relaxed text-teal-900">
              Saya mengizinkan SafeSign mengirim email ini atas nama saya, dan memahami isinya (terjemahan tersedia
              di atas).
            </span>
          </label>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPermissionOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSend} disabled={!permissionChecked || sending} className="gap-2 bg-teal-700 hover:bg-teal-800">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
              Izinkan & Kirim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog tindak lanjut ── */}
      <Dialog open={followUpOpen} onOpenChange={setFollowUpOpen}>
        <DialogContent className="rounded-2xl sm:max-w-2xl" aria-describedby="tindak-lanjut-desc">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-teal-700" aria-hidden="true" />
              Tindak lanjut ke {kase.institution.shortName ?? kase.institution.name}
            </DialogTitle>
            <DialogDescription id="tindak-lanjut-desc">
              AI merujuk email awal dan meminta perkembangan. Periksa draf, lalu beri izin bila setuju.
            </DialogDescription>
          </DialogHeader>
          {followUpLoading ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-600">AI sedang menyusun tindak lanjut…</p>
            </div>
          ) : followUpError && !followUpDraft ? (
            <div className="py-6 text-center">
              <p className="text-sm font-semibold text-red-700">{followUpError}</p>
              <Button variant="outline" className="mt-3 gap-1.5" onClick={handleFollowUpDraft}>
                <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Coba Lagi
              </Button>
            </div>
          ) : followUpDraft ? (
            <>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fu-subject">Subjek</Label>
                  <Input id="fu-subject" value={followUpDraft.subject} onChange={(e) => setFollowUpDraft({ ...followUpDraft, subject: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fu-body">Isi email ({langLabel})</Label>
                  <Textarea
                    id="fu-body"
                    value={followUpDraft.body}
                    onChange={(e) => setFollowUpDraft({ ...followUpDraft, body: e.target.value })}
                    rows={10}
                    className="font-mono text-[13px] leading-relaxed"
                  />
                </div>
                {followUpDraft.bodyUser ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setShowFollowUpTranslation((s) => !s)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-bold text-slate-700"
                      aria-expanded={showFollowUpTranslation}
                    >
                      Terjemahan Bahasa Indonesia
                      <span className="text-xs font-semibold text-teal-700">{showFollowUpTranslation ? "Sembunyikan" : "Lihat"}</span>
                    </button>
                    {showFollowUpTranslation ? (
                      <pre className="whitespace-pre-wrap border-t border-slate-200 px-4 py-3 text-sm leading-relaxed text-slate-600" style={{ fontFamily: "inherit" }}>
                        {followUpDraft.bodyUser}
                      </pre>
                    ) : null}
                  </div>
                ) : null}
                {followUpDraft.advice ? (
                  <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {followUpDraft.advice}
                  </p>
                ) : null}
                {followUpError ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700" role="alert">
                    {followUpError}
                  </p>
                ) : null}
              </div>
              <label className="mt-1 flex cursor-pointer items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4">
                <Checkbox
                  checked={followUpChecked}
                  onCheckedChange={(v) => setFollowUpChecked(v === true)}
                  aria-label="Izinkan pengiriman tindak lanjut"
                  className="mt-0.5"
                />
                <span className="text-sm font-semibold leading-relaxed text-teal-900">
                  Saya mengizinkan pengiriman tindak lanjut ini atas nama saya.
                </span>
              </label>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setFollowUpOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleFollowUpSend} disabled={!followUpChecked || followUpSending} className="gap-2 bg-teal-700 hover:bg-teal-800">
                  {followUpSending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                  Izinkan & Kirim Tindak Lanjut
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function EmailHistoryCard({ email, onCopy }: { email: CaseEmailDTO; onCopy: () => void }) {
  const [showBody, setShowBody] = useState(false);
  const isFollowUp = email.type === "followup";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-xs font-bold",
            isFollowUp ? "border-amber-200 bg-amber-50 text-amber-700" : "border-teal-200 bg-teal-50 text-teal-700"
          )}
        >
          {isFollowUp ? "Tindak Lanjut" : "Email Awal"}
        </span>
        <span className="flex items-center gap-1 text-xs font-semibold text-teal-700">
          <MailCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Terkirim {formatDateTime(email.sentAt)}
        </span>
      </div>
      <p className="mt-2 text-sm font-bold text-slate-900">{email.subject}</p>
      <button type="button" onClick={() => setShowBody((s) => !s)} className="mt-1 text-xs font-bold text-teal-700 hover:underline">
        {showBody ? "Sembunyikan isi" : "Lihat isi email"}
      </button>
      {showBody ? (
        <div className="mt-2 space-y-2">
          <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700" style={{ fontFamily: "inherit" }}>
            {email.body}
          </pre>
          {email.bodyUser ? (
            <details className="rounded-xl border border-slate-200 px-4 py-2.5">
              <summary className="cursor-pointer text-xs font-bold text-slate-600">Terjemahan Bahasa Indonesia</summary>
              <pre className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600" style={{ fontFamily: "inherit" }}>
                {email.bodyUser}
              </pre>
            </details>
          ) : null}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onCopy}>
            <ClipboardCopy className="h-3.5 w-3.5" aria-hidden="true" />
            Salin Email
          </Button>
        </div>
      ) : null}
    </div>
  );
}

// SafeSign Manajemen — contract detail tabs: versions, approval, signatures, reminders
"use client";

import { useMemo, useState } from "react";
import {
  BellRing,
  CheckCircle2,
  Clock3,
  Eye,
  History,
  PenTool,
  RotateCcw,
  ShieldCheck,
  Undo2,
  UserRound,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";
import type { ContractDetailDTO, Role } from "@/lib/manage/types";
import {
  REMINDER_OPTIONS,
  ROLE_LABELS,
  daysLeft,
  daysLeftLabel,
  formatDate,
  formatDateTime,
} from "@/lib/manage/types";
import { SectionCard } from "./shared";
import { SignaturePad } from "./SignaturePad";

/* ================= Versions & Amandemen ================= */

export function VersionsTab({
  contract,
  onRestore,
  busyId,
}: {
  contract: ContractDetailDTO;
  onRestore: (versionId: string) => Promise<void>;
  busyId: string | null;
}) {
  const [viewing, setViewing] = useState<ContractDetailDTO["versions"][number] | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  return (
    <SectionCard title="Riwayat Versi & Amandemen">
      {contract.versions.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">Belum ada riwayat versi.</p>
      ) : (
        <ol className="relative space-y-0">
          {contract.versions.map((v, i) => (
            <li key={v.id} className="relative flex gap-4 pb-6 last:pb-0">
              {/* timeline rail */}
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold",
                    i === 0 ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {v.version}
                </span>
                {i < contract.versions.length - 1 ? (
                  <span className="mt-1 w-px flex-1 bg-slate-200" aria-hidden="true" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-800">
                    {i === 0 ? `Versi #${v.version} (terbaru)` : `Versi #${v.version}`}
                  </p>
                  <p className="text-xs text-slate-400">{formatDateTime(v.createdAt)}</p>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{v.changeNote ?? "—"}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {v.editedBy ? `oleh ${v.editedBy}` : ""}
                </p>
                {i > 0 ? (
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewing(v)}
                      className="h-8 rounded-lg text-xs font-semibold"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      Lihat Teks
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmRestore(v.id)}
                      disabled={busyId === v.id}
                      className="h-8 rounded-lg text-xs font-semibold text-teal-800 hover:bg-teal-50"
                    >
                      <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                      {busyId === v.id ? "Memulihkan…" : "Restore"}
                    </Button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}

      <Dialog open={Boolean(viewing)} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent aria-describedby={undefined} className="max-h-[80vh] max-w-2xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">
              Teks Kontrak — Versi #{viewing?.version}
            </DialogTitle>
          </DialogHeader>
          <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
            {viewing?.contentText?.trim() || "(Tidak ada teks tersimpan pada versi ini)"}
          </pre>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(confirmRestore)} onOpenChange={(o) => !o && setConfirmRestore(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Restore ke versi ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Judul, teks, nilai, dan tanggal berakhir akan dikembalikan seperti versi tersebut.
              Perubahan ini dicatat sebagai versi baru — tidak ada data yang hilang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (confirmRestore) await onRestore(confirmRestore);
                setConfirmRestore(null);
              }}
              className="rounded-xl bg-teal-700 hover:bg-teal-800"
            >
              Ya, Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  );
}

/* ================= Approval ================= */

export function ApprovalTab({
  contract,
  role,
  userName,
  onDecide,
  onSubmit,
  busy,
}: {
  contract: ContractDetailDTO;
  role: Role;
  userName: string;
  onDecide: (action: "approve" | "reject", note?: string) => Promise<void>;
  onSubmit: () => Promise<void>;
  busy: boolean;
}) {
  const [note, setNote] = useState("");
  const pendingStep = contract.approvals.find((a) => a.status === "pending");
  const isMyTurn =
    contract.status === "pending_approval" &&
    pendingStep !== undefined &&
    (role === "admin" || role === (pendingStep.approverRole as Role));

  return (
    <SectionCard title="Alur Persetujuan (Approval)">
      {contract.status === "draft" || contract.status === "rejected" ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
          <Clock3 className="mx-auto mb-2 h-8 w-8 text-slate-300" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-700">
            {contract.status === "draft" ? "Kontrak belum diajukan untuk approval." : "Kontrak ini ditolak."}
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
            Alur: tahap 1 Manager (Agus Pratama) → tahap 2 Legal (Sari Wulandari). Setelah semua tahap
            disetujui, status kontrak menjadi <span className="font-semibold">Disetujui</span>.
          </p>
          <Button
            onClick={onSubmit}
            disabled={busy}
            className="mt-4 h-11 rounded-xl bg-teal-700 px-5 text-sm font-bold text-white hover:bg-teal-800"
          >
            {busy ? "Mengajukan…" : contract.status === "rejected" ? "Ajukan Ulang untuk Approval" : "Ajukan untuk Approval"}
          </Button>
        </div>
      ) : (
        <>
          <ol className="space-y-3">
            {contract.approvals.map((a) => (
              <li
                key={a.id}
                className={cn(
                  "flex flex-col gap-2 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between",
                  a.status === "approved" && "border-emerald-200 bg-emerald-50/60",
                  a.status === "rejected" && "border-red-200 bg-red-50/60",
                  a.status === "pending" && "border-amber-200 bg-amber-50/60"
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      a.status === "approved" && "bg-emerald-600 text-white",
                      a.status === "rejected" && "bg-red-600 text-white",
                      a.status === "pending" && "bg-amber-400 text-white"
                    )}
                  >
                    {a.status === "approved" ? (
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    ) : a.status === "rejected" ? (
                      <XCircle className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Clock3 className="h-5 w-5" aria-hidden="true" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Tahap {a.step} — {ROLE_LABELS[a.approverRole as Role] ?? a.approverRole}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {a.status === "pending"
                        ? "Menunggu keputusan"
                        : `${a.approverName ?? "—"} · ${formatDateTime(a.decidedAt)}`}
                    </p>
                    {a.note ? (
                      <p className="mt-1.5 rounded-lg bg-white/80 px-2.5 py-1.5 text-xs italic text-slate-600">
                        “{a.note}”
                      </p>
                    ) : null}
                  </div>
                </div>
                {isMyTurn && pendingStep?.id === a.id ? (
                  <span className="w-fit rounded-full bg-amber-500 px-2.5 py-1 text-xs font-extrabold text-white">
                    Giliran Anda
                  </span>
                ) : null}
              </li>
            ))}
          </ol>

          {isMyTurn ? (
            <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50/60 p-4">
              <Label htmlFor="approval-note" className="text-xs font-bold text-teal-900">
                Keputusan Anda sebagai {ROLE_LABELS[role]} — {userName}
              </Label>
              <Input
                id="approval-note"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 300))}
                placeholder="Catatan (opsional, tampil di riwayat approval)"
                className="mt-2 h-11 rounded-xl bg-white"
              />
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={() => void onDecide("approve", note.trim() || undefined)}
                  disabled={busy}
                  className="h-11 flex-1 rounded-xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {busy ? "Memproses…" : "Setujui"}
                </Button>
                <Button
                  onClick={() => void onDecide("reject", note.trim() || undefined)}
                  disabled={busy}
                  className="h-11 flex-1 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700"
                >
                  <XCircle className="h-4 w-4" aria-hidden="true" />
                  Tolak
                </Button>
              </div>
            </div>
          ) : contract.status === "pending_approval" ? (
            <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-center text-xs font-medium text-slate-500">
              Menunggu keputusan {ROLE_LABELS[(pendingStep?.approverRole ?? "manager") as Role]}.
              Anda dapat meninjau detail kontrak terlebih dahulu.
            </p>
          ) : null}
        </>
      )}
    </SectionCard>
  );
}

/* ================= Tanda Tangan ================= */

const SIGNER_ROLE_LABELS: Record<string, string> = {
  party_a: "Pihak Pertama",
  party_b: "Pihak Kedua",
  witness: "Saksi",
};

export function SignaturesTab({
  contract,
  onSign,
  busy,
}: {
  contract: ContractDetailDTO;
  onSign: (r: { signerName: string; signerRole: string; signatureData: string; typedName: string | null }) => Promise<void>;
  busy: boolean;
}) {
  const [signerName, setSignerName] = useState("");

  return (
    <div className="space-y-4">
      <SectionCard title="Daftar Tanda Tangan Digital">
        {contract.signatures.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <PenTool className="mb-2 h-8 w-8 text-slate-300" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-600">Belum ada tanda tangan.</p>
            <p className="mt-1 text-xs text-slate-400">
              Gunakan panel di bawah untuk menandatangani kontrak ini secara digital.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {contract.signatures.map((s) => (
              <li key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                    <UserRound className="h-4 w-4 text-teal-700" aria-hidden="true" />
                    {s.signerName}
                  </p>
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800">
                    {SIGNER_ROLE_LABELS[s.signerRole] ?? s.signerRole}
                  </span>
                </div>
                <img
                  src={s.signatureData}
                  alt={`Tanda tangan digital ${s.signerName}`}
                  className="mt-3 h-16 w-full rounded-xl border border-slate-100 bg-slate-50 object-contain p-1"
                />
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                  Ditandatangani {formatDateTime(s.signedAt)} · tersimpan dengan timestamp
                </p>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Tanda Tangani Kontrak Ini">
        <div className="max-w-md">
          <Label htmlFor="signer-name" className="text-xs font-bold text-slate-600">
            Nama lengkap penanda tangan
          </Label>
          <Input
            id="signer-name"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value.slice(0, 100))}
            placeholder="mis. Sari Wulandari"
            className="mt-1.5 h-11 rounded-xl"
          />
        </div>
        <div className="mt-4 max-w-xl">
          <SignaturePad
            signerName={signerName}
            busy={busy}
            onDone={(r) => void onSign(r)}
          />
        </div>
      </SectionCard>
    </div>
  );
}

/* ================= Pengingat ================= */

export function RemindersTab({
  contract,
  onToggle,
  onAck,
  busy,
}: {
  contract: ContractDetailDTO;
  onToggle: (days: number[]) => Promise<void>;
  onAck: () => Promise<void>;
  busy: boolean;
}) {
  const [local, setLocal] = useState<number[]>(contract.reminders);
  const dl = daysLeft(contract.endDate);
  const activeThreshold = useMemo(() => {
    if (dl === null) return null;
    const triggered = local.filter((t) => dl <= t);
    return triggered.length ? Math.max(...triggered) : null;
  }, [dl, local]);
  const isAcked = activeThreshold !== null && contract.acked.includes(`${contract.id}:${activeThreshold}`);

  const toggle = (d: number) => {
    const next = local.includes(d) ? local.filter((x) => x !== d) : [...local, d].sort((a, b) => b - a);
    setLocal(next);
    void onToggle(next);
  };

  return (
    <SectionCard title="Pengingat Jatuh Tempo & Renewal">
      <p className="text-sm leading-relaxed text-slate-600">
        Aktifkan ambang batas pengingat untuk kontrak ini. Saat sisa hari mencapai ambang batas,
        peringatan otomatis muncul di ikon <span className="font-semibold">lonceng notifikasi</span> dashboard.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {REMINDER_OPTIONS.map((d) => (
          <button
            key={d}
            onClick={() => toggle(d)}
            disabled={busy}
            aria-pressed={local.includes(d)}
            className={cn(
              "flex min-h-16 flex-col items-center justify-center rounded-2xl border-2 text-center transition-colors",
              local.includes(d)
                ? "border-teal-600 bg-teal-50 text-teal-800"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
            )}
          >
            <span className="text-lg font-extrabold">H-{d}</span>
            <span className="text-xs font-semibold">
              {local.includes(d) ? "Aktif" : "Nonaktif"}
            </span>
          </button>
        ))}
      </div>

      {dl !== null ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
            <BellRing className="h-4 w-4 text-amber-500" aria-hidden="true" />
            <span className="font-bold">{daysLeftLabel(dl)}</span>
            <span className="text-slate-400">·</span>
            <span>berakhir {formatDate(contract.endDate)}</span>
            {contract.autoRenew ? (
              <>
                <span className="text-slate-400">·</span>
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-800">
                  Perpanjangan otomatis aktif — evaluasi sebelum H-60
                </span>
              </>
            ) : null}
          </p>
          {activeThreshold !== null ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                {isAcked
                  ? "Peringatan sudah ditandai dibaca."
                  : `Peringatan H-${activeThreshold} sedang aktif di notifikasi.`}
              </p>
              {!isAcked ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void onAck()}
                  disabled={busy}
                  className="h-9 rounded-xl text-xs font-semibold"
                >
                  Tandai Sudah Dibaca
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">
              Belum melewati ambang batas mana pun — pengingat berikutnya muncul otomatis di H-
              {local.length ? Math.max(...local.filter((t) => (dl ?? 0) <= t ? false : true)) : 90}
              .
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
          Kontrak ini belum memiliki tanggal berakhir — tambahkan lewat “Edit Kontrak” agar
          pengingat dapat bekerja.
        </p>
      )}

      <p className="mt-4 flex items-start gap-2 rounded-xl bg-teal-50 px-4 py-3 text-xs leading-relaxed text-teal-900">
        <History className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Tips: untuk kontrak auto-renew, tetapkan minimal H-60 agar masih ada waktu negosiasi
        sebelum perpanjangan otomatis terjadi.
      </p>
    </SectionCard>
  );
}

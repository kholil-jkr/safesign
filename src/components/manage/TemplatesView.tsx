// SafeSign Manajemen — template library: preview, placeholder fill, use → new contract
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Eye,
  FilePlus2,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { fetchTemplates, useManage } from "@/lib/manage/store";
import type { TemplateDTO } from "@/lib/manage/types";
import { CATEGORY_OPTIONS, canManageTemplates, formatDate } from "@/lib/manage/types";
import { CategoryBadge, EmptyState, LoadingRow, SectionCard } from "./shared";

function extractPlaceholders(content: string): string[] {
  const matches = content.match(/\{\{([^}]+)\}\}/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(2, -2).trim()))];
}

export function TemplatesView() {
  const { currentUser, startDraft, setView, bumpRefresh } = useManage();
  const [templates, setTemplates] = useState<TemplateDTO[] | null>(null);
  const [viewing, setViewing] = useState<TemplateDTO | null>(null);
  const [using, setUsing] = useState<TemplateDTO | null>(null);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<TemplateDTO | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    fetchTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]));
  };
  useEffect(load, []);

  const placeholders = useMemo(
    () => (using ? extractPlaceholders(using.content) : []),
    [using]
  );

  const openUse = (t: TemplateDTO) => {
    setUsing(t);
    setPlaceholderValues({});
  };

  const buildFilledContent = () => {
    if (!using) return "";
    let content = using.content;
    for (const [k, v] of Object.entries(placeholderValues)) {
      if (v.trim()) content = content.replaceAll(`{{${k}}}`, v.trim());
    }
    return content;
  };

  const useTemplate = () => {
    const content = buildFilledContent();
    startDraft({ text: content, source: "template" });
    setUsing(null);
    toast({
      title: "Template siap digunakan",
      description: "Isi kontrak sudah masuk ke formulir kontrak baru — lanjutkan Ekstraksi Data AI atau simpan.",
    });
  };

  const canManage = canManageTemplates(currentUser.role);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Template Kontrak
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Template siap pakai dengan pengisi otomatis placeholder — pilih, isi variabel, lalu simpan sebagai kontrak baru.
          </p>
        </div>
        {canManage ? (
          <Button onClick={() => setCreateOpen(true)} className="h-11 rounded-xl bg-teal-700 text-sm font-bold text-white hover:bg-teal-800">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Template Baru
          </Button>
        ) : null}
      </div>

      {templates === null ? (
        <LoadingRow label="Memuat template…" />
      ) : templates.length === 0 ? (
        <EmptyState
          title="Belum ada template"
          description={canManage ? "Buat template pertama Anda untuk mempercepat pembuatan kontrak." : "Template akan ditambahkan oleh tim Legal/Admin."}
          action={canManage ? (
            <Button onClick={() => setCreateOpen(true)} className="rounded-xl bg-teal-700 text-white hover:bg-teal-800">
              Buat Template
            </Button>
          ) : undefined}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <li key={t.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <CategoryBadge category={t.category} />
                <span className="text-xs text-slate-400">{formatDate(t.updatedAt)}</span>
              </div>
              <h2 className="mt-3 line-clamp-2 text-base font-bold leading-snug text-slate-900">{t.name}</h2>
              <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-500">
                {t.description ?? "Template kontrak siap pakai."}
              </p>
              <p className="mt-3 text-xs font-semibold text-teal-700">
                {extractPlaceholders(t.content).length} variabel isi-otomatis
              </p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewing(t)} className="h-9 flex-1 rounded-xl text-xs font-semibold">
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  Pratinjau
                </Button>
                <Button size="sm" onClick={() => openUse(t)} className="h-9 flex-1 rounded-xl bg-teal-700 text-xs font-bold text-white hover:bg-teal-800">
                  <FilePlus2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Gunakan
                </Button>
                {canManage ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmDelete(t)}
                    className="h-9 rounded-xl border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50"
                    aria-label={`Hapus template ${t.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Preview dialog */}
      <Dialog open={Boolean(viewing)} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent aria-describedby={undefined} className="max-h-[80vh] max-w-2xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">{viewing?.name}</DialogTitle>
          </DialogHeader>
          <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
            {viewing?.content}
          </pre>
        </DialogContent>
      </Dialog>

      {/* Use template dialog: fill placeholders */}
      <Dialog open={Boolean(using)} onOpenChange={(o) => !o && setUsing(null)}>
        <DialogContent aria-describedby={undefined} className="max-h-[80vh] max-w-2xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Gunakan: {using?.name}</DialogTitle>
          </DialogHeader>
          {placeholders.length > 0 ? (
            <>
              <p className="text-sm leading-relaxed text-slate-500">
                Isi variabel berikut — teks akan otomatis dimasukkan ke kontrak. Variabel yang dikosongkan
                tetap berbentuk <code className="rounded bg-slate-100 px-1 text-xs">{"{{nama}}"}</code> dan bisa diisi nanti.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {placeholders.map((p) => (
                  <div key={p}>
                    <Label htmlFor={`ph-${p}`} className="text-xs font-semibold capitalize text-slate-600">
                      {p.replaceAll("_", " ")}
                    </Label>
                    <Input
                      id={`ph-${p}`}
                      value={placeholderValues[p] ?? ""}
                      onChange={(e) => setPlaceholderValues((prev) => ({ ...prev, [p]: e.target.value }))}
                      className="mt-1 h-10 rounded-xl"
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">Template ini tidak memiliki variabel — bisa langsung digunakan.</p>
          )}
          <Button onClick={useTemplate} className="h-11 w-full rounded-xl bg-teal-700 text-sm font-bold text-white hover:bg-teal-800">
            <ArrowLeft className="h-4 w-4 rotate-180" aria-hidden="true" />
            Lanjut ke Formulir Kontrak
          </Button>
        </DialogContent>
      </Dialog>

      {/* Create template dialog */}
      <CreateTemplateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          load();
          bumpRefresh();
        }}
      />

      {/* Delete confirm */}
      <Dialog open={Boolean(confirmDelete)} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent aria-describedby={undefined} className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Hapus template “{confirmDelete?.name}”?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)} className="rounded-xl">Batal</Button>
            <Button
              onClick={async () => {
                if (!confirmDelete) return;
                setBusy(true);
                try {
                  await fetch(`/api/templates?id=${confirmDelete.id}`, { method: "DELETE" });
                  toast({ title: "Template dihapus" });
                  setConfirmDelete(null);
                  load();
                } catch {
                  toast({ title: "Gagal menghapus", variant: "destructive" });
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
              className="rounded-xl bg-red-600 text-white hover:bg-red-700"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateTemplateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ name: "", category: "other", description: "", content: "" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name.trim() || form.content.trim().length < 20) {
      toast({ title: "Nama dan isi template (min. 20 karakter) wajib diisi", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { ok: boolean };
      if (!data.ok) throw new Error();
      toast({ title: "Template tersimpan" });
      onOpenChange(false);
      setForm({ name: "", category: "other", description: "", content: "" });
      onCreated();
    } catch {
      toast({ title: "Gagal menyimpan template", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Template Kontrak Baru</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="tpl-name" className="text-xs font-bold">Nama Template *</Label>
            <Input id="tpl-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 h-11 rounded-xl" placeholder="mis. PKWT — Perjanjian Kerja Waktu Tertentu" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-bold">Kategori</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1.5 h-11 rounded-xl" aria-label="Kategori template">
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
              <Label htmlFor="tpl-desc" className="text-xs font-bold">Deskripsi</Label>
              <Input id="tpl-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5 h-11 rounded-xl" />
            </div>
          </div>
          <div>
            <Label htmlFor="tpl-content" className="text-xs font-bold">Isi Template *</Label>
            <p className="mt-0.5 text-xs text-slate-400">
              Gunakan variabel <code className="rounded bg-slate-100 px-1">{"{{nama_variabel}}"}</code> untuk bagian yang diisi otomatis.
            </p>
            <Textarea id="tpl-content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="mt-1.5 min-h-64 rounded-xl font-mono text-xs" placeholder={"PERJANJIAN KERJA\n\nAntara {{nama_perusahaan}} dan {{nama_pekerja}}…"} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 rounded-xl">Batal</Button>
            <Button onClick={() => void save()} disabled={saving} className="h-11 rounded-xl bg-teal-700 font-bold text-white hover:bg-teal-800">
              {saving ? "Menyimpan…" : "Simpan Template"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

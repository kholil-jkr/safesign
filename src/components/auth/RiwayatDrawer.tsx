"use client";

// SafeSign — drawer Riwayat Kontrak (log analisis milik user).
// Seperti log chat AI: daftar analisis, buka ulang, hapus.
// Membuka item → kirim CustomEvent "safesign:open-history" yang didengar AnalyzerApp.
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, EyeOff, History, Loader2, ShieldCheck, Trash2, X } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import type { AnalysisResult } from "@/lib/safesign/types";

export type RiwayatItem = {
  id: string;
  title: string;
  language: string;
  sourceType: string | null;
  riskLevel: string | null;
  incognito: boolean;
  createdAt: string;
  summary: string;
  resultJson: string;
};

const RISK_STYLE: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};
const RISK_LABEL: Record<string, string> = { low: "Risiko Rendah", medium: "Risiko Sedang", high: "Risiko Tinggi" };

export function RiwayatDrawer() {
  const { user, riwayatOpen, closeRiwayat } = useAuth();
  const [items, setItems] = useState<RiwayatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analysis-logs", { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; items?: RiwayatItem[] };
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (riwayatOpen && user) void load();
  }, [riwayatOpen, user, load]);

  // tutup dengan tombol Esc
  useEffect(() => {
    if (!riwayatOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRiwayat();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [riwayatOpen, closeRiwayat]);

  if (!riwayatOpen) return null;

  const handleOpen = (item: RiwayatItem) => {
    closeRiwayat();
    // AnalyzerApp yang mengambil detail lengkap (termasuk teks kontrak untuk chat)
    window.dispatchEvent(
      new CustomEvent("safesign:open-history", {
        detail: { id: item.id },
      })
    );
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await fetch(`/api/analysis-logs/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end bg-slate-900/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Riwayat Kontrak"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeRiwayat();
      }}
    >
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700">
              <History className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Riwayat Kontrak</h2>
              <p className="text-xs text-slate-500">
                {items.length > 0 ? `${items.length} analisis tersimpan` : "Analisis tersimpan di sini"}
              </p>
            </div>
          </div>
          <button
            onClick={closeRiwayat}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Tutup riwayat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-32 items-center justify-center gap-2 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              <span className="text-sm">Memuat…</span>
            </div>
          ) : items.length === 0 ? (
            <div className="mt-10 text-center">
              <ShieldCheck className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-slate-700">Belum ada riwayat</p>
              <p className="mx-auto mt-1 max-w-64 text-xs leading-relaxed text-slate-500">
                Setiap kontrak yang Anda analisis akan otomatis tersimpan di sini (kecuali
                saat Mode Penyamaran aktif).
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={`rounded-2xl border p-3.5 transition-colors ${
                    openId === item.id ? "border-teal-300 bg-teal-50/60" : "border-slate-200 bg-white hover:border-teal-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      onClick={() => {
                        setOpenId(item.id);
                        handleOpen(item);
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm font-bold text-slate-900">{item.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {item.summary || "—"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {item.riskLevel ? (
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${RISK_STYLE[item.riskLevel] ?? "bg-slate-100 text-slate-600"}`}>
                            {RISK_LABEL[item.riskLevel] ?? item.riskLevel}
                          </span>
                        ) : null}
                        {item.incognito ? (
                          <span className="flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-white">
                            <EyeOff className="h-3 w-3" aria-hidden="true" />
                            Penyamaran — dihapus saat keluar
                          </span>
                        ) : null}
                        <span className="text-[11px] text-slate-400">
                          {new Date(item.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => void handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Hapus riwayat: ${item.title}`}
                    >
                      {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
          <p className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-500">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden="true" />
            Riwayat bersifat pribadi dan hanya Anda yang bisa melihatnya. Menghapus riwayat
            bersifat permanen.
          </p>
        </div>
      </div>
    </div>
  );
}

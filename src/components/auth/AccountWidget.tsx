"use client";

// SafeSign — widget akun melayang (kanan-bawah), tersedia di semua modul.
// Tamu: tombol "Masuk". Login: menu akun (penyamaran, riwayat, kotak masuk,
// modul organisasi khusus role, keluar).
import { useEffect, useRef, useState } from "react";
import {
  EyeOff,
  History,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/auth-store";

function isManageRole(role: string): boolean {
  return role === "admin" || role === "legal" || role === "manager" || role === "staff";
}

/** Pindah modul global (didengarkan page.tsx). */
export function navigateModule(module: "analyzer" | "manage" | "advocacy", view?: string) {
  window.dispatchEvent(new CustomEvent("safesign:navigate", { detail: { module, view } }));
}

export function AccountWidget() {
  const { user, ready, openDialog, logout, setIncognito, openRiwayat } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  if (!ready) return null;

  if (!user) {
    return (
      <button
        onClick={openDialog}
        className="fixed bottom-5 right-5 z-50 flex h-12 items-center gap-2 rounded-full bg-teal-700 px-5 text-sm font-bold text-white shadow-lg shadow-teal-900/20 transition-transform hover:scale-105 hover:bg-teal-800"
        aria-label="Masuk atau daftar akun SafeSign"
      >
        <LogIn className="h-4 w-4" aria-hidden="true" />
        Masuk
      </button>
    );
  }

  const initial = (user.name || user.email).charAt(0).toUpperCase();

  return (
    <div ref={menuRef} className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {menuOpen ? (
        <div className="w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <p className="truncate text-sm font-bold text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
            {user.provider === "google" ? (
              <p className="mt-0.5 text-[11px] font-medium text-teal-700">Akun Google</p>
            ) : null}
          </div>

          <div className="p-1.5">
            {/* Mode Penyamaran */}
            <button
              onClick={() => {
                void setIncognito(!user.incognito);
              }}
              className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
              aria-pressed={user.incognito}
            >
              <span className="flex items-center gap-2.5">
                <EyeOff className={`h-4 w-4 ${user.incognito ? "text-teal-700" : "text-slate-400"}`} aria-hidden="true" />
                Mode Penyamaran
              </span>
              <span
                className={`relative h-5 w-9 rounded-full transition-colors ${user.incognito ? "bg-teal-600" : "bg-slate-300"}`}
                aria-hidden="true"
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${user.incognito ? "left-4.5" : "left-0.5"}`}
                />
              </span>
            </button>
            {user.incognito ? (
              <p className="px-3 pb-1.5 text-[11px] leading-relaxed text-teal-700">
                Analisis tidak disimpan. Saat keluar, semua jejak sesi penyamaran dihapus.
              </p>
            ) : null}

            <button
              onClick={() => {
                setMenuOpen(false);
                openRiwayat();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <History className="h-4 w-4 text-slate-400" aria-hidden="true" />
              Riwayat Kontrak
            </button>

            <button
              onClick={() => {
                setMenuOpen(false);
                navigateModule("advocacy", "inbox");
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <Inbox className="h-4 w-4 text-slate-400" aria-hidden="true" />
              Kotak Masuk Email
            </button>

            <button
              onClick={() => {
                setMenuOpen(false);
                setPwOpen(true);
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <KeyRound className="h-4 w-4 text-slate-400" aria-hidden="true" />
              Ganti Password
            </button>

            {isManageRole(user.role) ? (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigateModule("manage");
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <LayoutDashboard className="h-4 w-4 text-slate-400" aria-hidden="true" />
                Modul Organisasi
              </button>
            ) : null}

            <div className="my-1 h-px bg-slate-100" />

            <button
              onClick={() => {
                setMenuOpen(false);
                void logout();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Keluar
            </button>
          </div>
        </div>
      ) : null}

      {pwOpen ? <ChangePasswordDialog onClose={() => setPwOpen(false)} /> : null}

      <button
        onClick={() => setMenuOpen((v) => !v)}
        className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-extrabold text-white shadow-lg transition-transform hover:scale-105 ${
          user.incognito ? "bg-slate-700 shadow-slate-900/30" : "bg-teal-700 shadow-teal-900/20 hover:bg-teal-800"
        }`}
        aria-label={`Menu akun: ${user.name}`}
        aria-expanded={menuOpen}
      >
        {user.incognito ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : initial || <User className="h-5 w-5" />}
      </button>
    </div>
  );
}

/** Dialog ganti password (inline di widget akun). */
function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        setDone(true);
      } else if (data.error === "WRONG_PASSWORD") {
        setError("Password lama salah.");
      } else if (data.error === "INVALID_INPUT") {
        setError("Password baru minimal 8 karakter.");
      } else if (data.error === "RATE_LIMITED") {
        setError("Terlalu sering. Coba lagi nanti.");
      } else {
        setError("Gagal mengganti password. Coba lagi.");
      }
    } catch {
      setError("Koneksi bermasalah.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Ganti password"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        {done ? (
          <div className="text-center">
            <p className="text-lg font-extrabold text-slate-900">Password berhasil diganti ✓</p>
            <p className="mt-1.5 text-sm text-slate-500">Gunakan password baru saat masuk berikutnya.</p>
            <button
              onClick={onClose}
              className="mt-5 h-11 w-full rounded-xl bg-teal-700 text-sm font-bold text-white hover:bg-teal-800"
            >
              Selesai
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h3 className="text-lg font-extrabold text-slate-900">Ganti Password</h3>
            <p className="mt-1 text-xs text-slate-500">Password baru minimal 8 karakter.</p>

            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Password lama"
              autoComplete="current-password"
              className="mt-4 h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/40"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Password baru (min. 8 karakter)"
              autoComplete="new-password"
              required
              minLength={8}
              className="mt-2.5 h-11 w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/40"
            />

            {error ? (
              <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </p>
            ) : null}

            <div className="mt-4 flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="h-11 flex-1 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={busy || newPassword.length < 8}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-700 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                Simpan
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

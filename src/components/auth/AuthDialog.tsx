"use client";

// SafeSign — dialog Masuk / Daftar (email+password, Google bila aktif).
// Bahasa Indonesia: dialog ini bagian dari "akun", bukan analisis multi-bahasa.
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, LogIn, Mail, ShieldCheck, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-store";

export function AuthDialog() {
  const { dialogOpen, closeDialog, login, register, googleEnabled } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dialogOpen) {
      // reset saat ditutup
      setError(null);
      setBusy(false);
      setPassword("");
    }
  }, [dialogOpen]);

  if (!dialogOpen) return null;

  const errorText =
    error === "WRONG_CREDENTIALS"
      ? "Email atau password salah."
      : error === "EMAIL_TAKEN"
        ? "Email ini sudah terdaftar. Silakan masuk."
        : error === "INVALID_INPUT"
          ? "Periksa kembali isian Anda (password minimal 8 karakter, email valid)."
          : error === "RATE_LIMITED"
            ? "Terlalu banyak percobaan. Coba lagi dalam beberapa menit."
            : error === "ACCOUNT_LOCKED"
              ? "Akun sementara terkunci karena terlalu banyak percobaan gagal. Tunggu ±15 menit, lalu coba lagi."
              : error === "JARINGAN"
                ? "Koneksi bermasalah. Coba lagi."
                : error
                  ? "Terjadi kesalahan. Coba lagi."
                  : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const r =
      mode === "login"
        ? await login(email.trim(), password)
        : await register(name.trim(), email.trim(), password);
    if (!r.ok) setError(r.error ?? "GAGAL");
    setBusy(false);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "login" ? "Masuk ke SafeSign" : "Daftar akun SafeSign"}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeDialog();
      }}
    >
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700">
              <ShieldCheck className="h-6 w-6 text-white" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {mode === "login" ? "Masuk ke SafeSign" : "Buat akun SafeSign"}
              </h2>
              <p className="text-xs text-slate-500">
                {mode === "login"
                  ? "Simpan riwayat kontrak & kelola kasus advokasi"
                  : "Gratis — riwayat analisis tersimpan aman"}
              </p>
            </div>
          </div>
          <button
            onClick={closeDialog}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === "register" ? (
            <div className="space-y-1.5">
              <Label htmlFor="auth-name">Nama</Label>
              <Input
                id="auth-name"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 80))}
                placeholder="Nama Anda"
                autoComplete="name"
                required
                minLength={2}
                className="h-11 rounded-xl"
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="auth-email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.slice(0, 200))}
                placeholder="nama@email.com"
                autoComplete="email"
                required
                className="h-11 rounded-xl pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="auth-password">Password</Label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPw ? "Sembunyikan password" : "Lihat password"}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <Input
                id="auth-password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value.slice(0, 200))}
                placeholder={mode === "register" ? "Minimal 8 karakter" : "Password Anda"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={mode === "register" ? 8 : 1}
                className="h-11 rounded-xl pr-10"
              />
            </div>
          </div>

          {errorText ? (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {errorText}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-xl bg-teal-700 text-base font-bold text-white hover:bg-teal-800"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : mode === "login" ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            {busy ? "Memproses…" : mode === "login" ? "Masuk" : "Daftar"}
          </Button>
        </form>

        {googleEnabled ? (
          <>
            <div className="my-4 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">atau</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <a
              href="/api/auth/google/start"
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white text-base font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.6-.2-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.2-2.1 3.7-5.1 3.7-8.9z" />
                <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-6-2.1-7-5.1L1 17.1C3 21.1 7.2 24 12 24z" />
                <path fill="#FBBC05" d="M5 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L1 6.9C.4 8.5 0 10.2 0 12s.4 3.5 1 5.1l4-2.8z" />
                <path fill="#EA4335" d="M12 4.7c1.8 0 3.3.6 4.6 1.8L20 3.1C18 1.2 15.2 0 12 0 7.2 0 3 2.9 1 6.9l4 2.8C6 6.8 8.8 4.7 12 4.7z" />
              </svg>
              Lanjut dengan Google
            </a>
          </>
        ) : null}

        <p className="mt-5 text-center text-sm text-slate-600">
          {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
            }}
            className="font-bold text-teal-700 underline underline-offset-2 hover:text-teal-800"
          >
            {mode === "login" ? "Daftar gratis" : "Masuk"}
          </button>
        </p>

        <p className="mt-3 text-center text-xs leading-relaxed text-slate-400">
          Tanpa akun pun Anda tetap bisa memakai Analyzer secara anonim — hasil analisis
          tidak akan disimpan.
        </p>
      </div>
    </div>
  );
}

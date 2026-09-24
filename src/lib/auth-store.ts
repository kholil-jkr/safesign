// SafeSign — state autentikasi sisi klien (zustand).
// Login OPSIONAL: Analyzer tetap bisa dipakai anonim.
"use client";

import { create } from "zustand";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string; // admin | legal | manager | staff | user
  provider: string; // credentials | google
  incognito: boolean;
  image: string | null;
};

interface AuthState {
  user: AuthUser | null;
  ready: boolean; // selesai cek sesi awal
  googleEnabled: boolean;
  smtpEnabled: boolean;
  dialogOpen: boolean; // dialog login/daftar
  riwayatOpen: boolean; // drawer riwayat kontrak
  fetchMe: () => Promise<void>;
  openDialog: () => void;
  closeDialog: () => void;
  openRiwayat: () => void;
  closeRiwayat: () => void;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  setIncognito: (enabled: boolean) => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  ready: false,
  googleEnabled: false,
  smtpEnabled: false,
  dialogOpen: false,
  riwayatOpen: false,

  fetchMe: async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await res.json()) as {
        ok: boolean;
        user: AuthUser | null;
        googleEnabled?: boolean;
        smtpEnabled?: boolean;
      };
      set({
        user: data.user ?? null,
        googleEnabled: data.googleEnabled ?? false,
        smtpEnabled: data.smtpEnabled ?? false,
        ready: true,
      });
    } catch {
      set({ user: null, ready: true });
    }
  },

  openDialog: () => set({ dialogOpen: true }),
  closeDialog: () => set({ dialogOpen: false }),
  openRiwayat: () => set({ riwayatOpen: true }),
  closeRiwayat: () => set({ riwayatOpen: false }),

  login: async (email, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { ok: boolean; user?: AuthUser; error?: string };
      if (!data.ok || !data.user) return { ok: false, error: data.error ?? "GAGAL" };
      set({ user: data.user, dialogOpen: false });
      return { ok: true };
    } catch {
      return { ok: false, error: "JARINGAN" };
    }
  },

  register: async (name, email, password) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await res.json()) as { ok: boolean; user?: AuthUser; error?: string };
      if (!data.ok || !data.user) return { ok: false, error: data.error ?? "GAGAL" };
      set({ user: data.user, dialogOpen: false });
      return { ok: true };
    } catch {
      return { ok: false, error: "JARINGAN" };
    }
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // abaikan — cookie lokal tetap dibersihkan saat reload
    }
    set({ user: null, riwayatOpen: false });
    // reload untuk memastikan semua state modul kembali ke mode anonim
    if (typeof window !== "undefined") window.location.reload();
  },

  setIncognito: async (enabled) => {
    try {
      const res = await fetch("/api/auth/incognito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const data = (await res.json()) as { ok: boolean };
      if (!data.ok) return;
      const u = get().user;
      if (u) set({ user: { ...u, incognito: enabled } });
    } catch {
      // silent
    }
  },
}));

/** Simpan hasil analisis ke Riwayat Kontrak (bila login & tidak penyamaran). */
export async function saveAnalysisToLog(input: {
  title: string;
  language: string;
  sourceType?: string;
  inputText?: string;
  resultJson: string;
  riskLevel?: string | null;
}): Promise<{ ok: boolean; saved?: boolean; incognito?: boolean }> {
  try {
    const res = await fetch("/api/analysis-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await res.json()) as { ok: boolean; log?: unknown; error?: string };
    if (data.ok) return { ok: true, saved: true };
    if (data.error === "LOGIN_REQUIRED") return { ok: true, saved: false };
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

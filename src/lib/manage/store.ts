// SafeSign Manajemen — client state (zustand) + typed fetch helpers
"use client";

import { create } from "zustand";
import { useEffect } from "react";
import type {
  ContractDTO,
  ContractDetailDTO,
  DashboardStats,
  NotificationItem,
  Role,
  TemplateDTO,
  UserDTO,
} from "./types";
import { DEFAULT_USERS } from "./types";

export type ManageView =
  | "dashboard"
  | "contracts"
  | "new"
  | "templates"
  | "reports"
  | "team";

interface ManageState {
  view: ManageView;
  selectedContractId: string | null;
  currentUser: UserDTO;
  users: UserDTO[];
  notifications: NotificationItem[];
  notifOpen: boolean;
  refreshKey: number; // bump to refetch lists
  // draft carried from analyzer / template into "new" view
  draftText: string;
  draftAnalysisJson: string | null;
  draftSource: string | null;
  setView: (v: ManageView) => void;
  openContract: (id: string) => void;
  closeContract: () => void;
  setCurrentUser: (u: UserDTO) => void;
  loadUsers: () => Promise<void>;
  setNotifOpen: (open: boolean) => void;
  refreshNotifications: () => Promise<void>;
  bumpRefresh: () => void;
  startDraft: (opts: { text: string; analysisJson?: string | null; source?: string | null }) => void;
  clearDraft: () => void;
}

const USER_STORAGE_KEY = "safesign.manage.user";

export const useManage = create<ManageState>((set, get) => ({
  view: "dashboard",
  selectedContractId: null,
  currentUser: DEFAULT_USERS[0],
  users: DEFAULT_USERS,
  notifications: [],
  notifOpen: false,
  refreshKey: 0,
  draftText: "",
  draftAnalysisJson: null,
  draftSource: null,
  setView: (v) => set({ view: v, selectedContractId: null }),
  openContract: (id) => set({ selectedContractId: id }),
  closeContract: () => set({ selectedContractId: null }),
  setCurrentUser: (u) => {
    set({ currentUser: u });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
    }
  },
  loadUsers: async () => {
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; users?: UserDTO[] };
      if (!data.ok || !data.users || data.users.length === 0) return;
      const users = data.users;
      set((state) => {
        // keep the current role selection, but bind to the real DB user
        const match = users.find((u) => u.email === state.currentUser.email) ?? users[0];
        return { users, currentUser: match };
      });
    } catch {
      // silent — keep defaults
    }
  },
  setNotifOpen: (open) => set({ notifOpen: open }),
  refreshNotifications: async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; items?: NotificationItem[] };
      if (data.ok && data.items) set({ notifications: data.items });
    } catch {
      // silent — notification refresh is best-effort
    }
  },
  bumpRefresh: () => {
    set({ refreshKey: get().refreshKey + 1 });
    void get().refreshNotifications();
  },
  startDraft: ({ text, analysisJson, source }) =>
    set({ draftText: text, draftAnalysisJson: analysisJson ?? null, draftSource: source ?? null, view: "new", selectedContractId: null }),
  clearDraft: () => set({ draftText: "", draftAnalysisJson: null, draftSource: null }),
}));

/** Restore persisted simulated user on mount (client only). */
export function useRestoreUser() {
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(USER_STORAGE_KEY);
      if (raw) {
        const u = JSON.parse(raw) as UserDTO;
        if (u && DEFAULT_USERS.some((d) => d.id === u.id)) {
          useManage.setState({ currentUser: u });
        }
      }
    } catch {
      // ignore
    }
  }, []);
}

/* ---------- typed fetch helpers ---------- */

export async function fetchContracts(params: {
  q?: string;
  category?: string;
  status?: string;
  risk?: string;
  time?: string;
  sort?: string;
  dir?: string;
}): Promise<ContractDTO[]> {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) sp.set(k, v);
  });
  const res = await fetch(`/api/contracts?${sp.toString()}`, { cache: "no-store" });
  const data = (await res.json()) as { ok: boolean; contracts?: ContractDTO[] };
  if (!data.ok || !data.contracts) throw new Error("GAGAL_MEMUAT");
  return data.contracts;
}

export async function fetchContractDetail(id: string): Promise<ContractDetailDTO> {
  const res = await fetch(`/api/contracts/${id}`, { cache: "no-store" });
  const data = (await res.json()) as { ok: boolean; contract?: ContractDetailDTO };
  if (!data.ok || !data.contract) throw new Error("GAGAL_MEMUAT");
  return data.contract;
}

export async function fetchDashboard(): Promise<DashboardStats> {
  const res = await fetch("/api/dashboard", { cache: "no-store" });
  const data = (await res.json()) as { ok: boolean; stats?: DashboardStats };
  if (!data.ok || !data.stats) throw new Error("GAGAL_MEMUAT");
  return data.stats;
}

export async function fetchTemplates(): Promise<TemplateDTO[]> {
  const res = await fetch("/api/templates", { cache: "no-store" });
  const data = (await res.json()) as { ok: boolean; templates?: TemplateDTO[] };
  if (!data.ok || !data.templates) throw new Error("GAGAL_MEMUAT");
  return data.templates;
}

export function roleOf(u: UserDTO | null): Role {
  return (u?.role ?? "staff") as Role;
}

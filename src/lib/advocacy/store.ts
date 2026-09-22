// SafeSign Advokasi — client state (zustand) + typed fetch helpers
"use client";

import { create } from "zustand";
import type {
  AdvocacyCaseDTO,
  EmailDraft,
  InstitutionDTO,
  MatchedInstitution,
} from "./types";

export type AdvocacyView = "cases" | "new" | "institutions" | "rights" | "sos";

interface AdvocacyState {
  view: AdvocacyView;
  selectedCaseId: string | null;
  prefillDestination: string | null;
  refreshKey: number;
  setView: (v: AdvocacyView) => void;
  openCase: (id: string) => void;
  closeCase: () => void;
  startNewCase: (destination?: string | null) => void;
  clearPrefill: () => void;
  bumpRefresh: () => void;
}

export const useAdvocacy = create<AdvocacyState>((set, get) => ({
  view: "cases",
  selectedCaseId: null,
  prefillDestination: null,
  refreshKey: 0,
  setView: (v) => set({ view: v, selectedCaseId: null }),
  openCase: (id) => set({ selectedCaseId: id, view: "cases" }),
  closeCase: () => set({ selectedCaseId: null }),
  startNewCase: (destination) =>
    set({ view: "new", selectedCaseId: null, prefillDestination: destination ?? null }),
  clearPrefill: () => set({ prefillDestination: null }),
  bumpRefresh: () => set({ refreshKey: get().refreshKey + 1 }),
}));

/* ---------- typed fetch helpers ---------- */

export async function fetchCases(status?: string): Promise<AdvocacyCaseDTO[]> {
  const sp = new URLSearchParams();
  if (status) sp.set("status", status);
  const res = await fetch(`/api/advocacy/cases?${sp.toString()}`, { cache: "no-store" });
  const data = (await res.json()) as { ok: boolean; cases?: AdvocacyCaseDTO[] };
  if (!data.ok || !data.cases) throw new Error("GAGAL_MEMUAT");
  return data.cases;
}

export async function fetchCaseDetail(id: string): Promise<AdvocacyCaseDTO> {
  const res = await fetch(`/api/advocacy/cases/${id}`, { cache: "no-store" });
  const data = (await res.json()) as { ok: boolean; case?: AdvocacyCaseDTO };
  if (!data.ok || !data.case) throw new Error("GAGAL_MEMUAT");
  return data.case;
}

export async function fetchInstitutions(params: {
  q?: string;
  type?: string;
  origin?: string;
  destination?: string;
  category?: string;
}): Promise<InstitutionDTO[]> {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) sp.set(k, v);
  });
  const res = await fetch(`/api/advocacy/institutions?${sp.toString()}`, { cache: "no-store" });
  const data = (await res.json()) as { ok: boolean; institutions?: InstitutionDTO[] };
  if (!data.ok || !data.institutions) throw new Error("GAGAL_MEMUAT");
  return data.institutions;
}

export async function matchInstitutions(input: {
  originCountry: string;
  destinationCountry: string | null;
  category: string;
}): Promise<MatchedInstitution[]> {
  const res = await fetch("/api/advocacy/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { ok: boolean; matches?: MatchedInstitution[] };
  if (!data.ok || !data.matches) throw new Error("GAGAL_MEMUAT");
  return data.matches;
}

export interface DraftApiResponse {
  ok: boolean;
  draft: EmailDraft;
  institution: { id: string; name: string; shortName: string | null; language: string; email: string | null; website: string | null };
}

export async function generateDraft(input: {
  category: string;
  priority: string;
  chronology: string;
  originCountry: string;
  destinationCountry: string | null;
  anonymous: boolean;
  institutionId: string;
  contractId: string | null;
  attachments: string[];
  workerName: string | null;
}): Promise<DraftApiResponse> {
  const res = await fetch("/api/advocacy/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as DraftApiResponse & { ok: boolean };
  if (!data.ok) {
    const err = data as unknown as { error?: string };
    throw new Error(err.error ?? "AI_GAGAL");
  }
  return data;
}

export async function generateFollowUp(caseId: string): Promise<{ draft: EmailDraft; institution: { name: string; language: string } }> {
  const res = await fetch("/api/advocacy/followup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caseId }),
  });
  const data = (await res.json()) as { ok: boolean; draft?: EmailDraft; institution?: { name: string; language: string }; error?: string };
  if (!data.ok || !data.draft || !data.institution) throw new Error(data.error ?? "AI_GAGAL");
  return { draft: data.draft, institution: data.institution };
}

export interface SendResult {
  ok: boolean;
  mode: "smtp" | "manual";
  mailto?: string;
  noEmail?: boolean;
  website?: string | null;
  case?: AdvocacyCaseDTO;
}

export async function sendCaseEmail(
  caseId: string,
  by: string
): Promise<SendResult> {
  const res = await fetch(`/api/advocacy/cases/${caseId}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirm: true, by }),
  });
  const data = (await res.json()) as SendResult;
  if (!data.ok) throw new Error("KIRIM_GAGAL");
  return data;
}

export async function sendFollowUpEmail(
  caseId: string,
  draft: EmailDraft,
  by: string
): Promise<SendResult> {
  const res = await fetch(`/api/advocacy/cases/${caseId}/followup-send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirm: true, by, subject: draft.subject, body: draft.body, bodyUser: draft.bodyUser, advice: draft.advice }),
  });
  const data = (await res.json()) as SendResult;
  if (!data.ok) throw new Error("KIRIM_GAGAL");
  return data;
}

export async function updateCase(
  caseId: string,
  payload: { subject?: string; body?: string; status?: string; note?: string; by?: string }
): Promise<AdvocacyCaseDTO> {
  const res = await fetch(`/api/advocacy/cases/${caseId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { ok: boolean; case?: AdvocacyCaseDTO; error?: string };
  if (!data.ok || !data.case) throw new Error(data.error ?? "GAGAL");
  return data.case;
}

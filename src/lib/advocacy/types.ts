// SafeSign Advokasi — shared types, labels & helpers (client + server safe)

export type CaseCategory =
  | "SALARY"
  | "ABUSE"
  | "TRAFFICKING"
  | "CONTRACT"
  | "REPATRIATION"
  | "PLACEMENT"
  | "DOCUMENT"
  | "WELFARE";

export const CATEGORY_META: Record<CaseCategory, { label: string; desc: string; defaultPriority: string; chip: string }> = {
  SALARY: {
    label: "Gaji / Upah",
    desc: "Gaji tidak dibayar, ditunda, dipotong ilegal, atau di bawah minimum",
    defaultPriority: "high",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
  },
  ABUSE: {
    label: "Kekerasan / Pelecehan",
    desc: "Kekerasan fisik/verbal, pelecehan seksual, ancaman, perundungan",
    defaultPriority: "urgent",
    chip: "bg-rose-50 text-rose-700 border-rose-200",
  },
  TRAFFICKING: {
    label: "Perdagangan Orang",
    desc: "Dijanjikan pekerjaan lain, dipaksa kerja, utang yang diikat, dokumen dikendalikan",
    defaultPriority: "urgent",
    chip: "bg-red-50 text-red-700 border-red-200",
  },
  CONTRACT: {
    label: "Pelanggaran Kontrak",
    desc: "Kontrak diganti, tugas berbeda dari perjanjian, jam kerja melebihi ketentuan",
    defaultPriority: "high",
    chip: "bg-teal-50 text-teal-700 border-teal-200",
  },
  REPATRIATION: {
    label: "Pemulangan",
    desc: "Ingin dipulangkan, ditahan untuk pulang, tiket tidak diberikan",
    defaultPriority: "high",
    chip: "bg-orange-50 text-orange-700 border-orange-200",
  },
  PLACEMENT: {
    label: "Agen / Penempatan",
    desc: "Biaya ilegal, agen tidak resmi, penipuan penempatan, calon tidak diberangkatkan",
    defaultPriority: "medium",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  DOCUMENT: {
    label: "Dokumen / Paspor",
    desc: "Paspor atau dokumen ditahan, izin kerja bermasalah, dokumen dipalsukan",
    defaultPriority: "high",
    chip: "bg-slate-100 text-slate-700 border-slate-300",
  },
  WELFARE: {
    label: "Kesejahteraan",
    desc: "Akses kesehatan, tempat tinggal tidak layak, makanan tidak cukup, kehilangan kontak",
    defaultPriority: "medium",
    chip: "bg-lime-50 text-lime-700 border-lime-200",
  },
};

export const CATEGORY_OPTIONS = (Object.keys(CATEGORY_META) as CaseCategory[]).map((v) => ({
  value: v,
  label: CATEGORY_META[v].label,
}));

export type CasePriority = "low" | "medium" | "high" | "urgent";

export const PRIORITY_META: Record<string, { label: string; chip: string }> = {
  low: { label: "Rendah", chip: "bg-slate-100 text-slate-600 border-slate-300" },
  medium: { label: "Sedang", chip: "bg-amber-50 text-amber-700 border-amber-200" },
  high: { label: "Tinggi", chip: "bg-orange-50 text-orange-700 border-orange-200" },
  urgent: { label: "Sangat Mendesak", chip: "bg-red-50 text-red-700 border-red-200" },
};

export type CaseStatus = "draft" | "sent" | "followed_up" | "in_progress" | "resolved" | "closed";

export const CASE_STATUS_META: Record<string, { label: string; chip: string }> = {
  draft: { label: "Draft", chip: "bg-slate-100 text-slate-700 border-slate-300" },
  sent: { label: "Terkirim", chip: "bg-teal-50 text-teal-700 border-teal-200" },
  followed_up: { label: "Tindak Lanjut Terkirim", chip: "bg-amber-50 text-amber-700 border-amber-200" },
  in_progress: { label: "Sedang Ditangani", chip: "bg-orange-50 text-orange-700 border-orange-200" },
  resolved: { label: "Selesai", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  closed: { label: "Ditutup", chip: "bg-slate-800 text-white border-slate-800" },
};

export const EVENT_META: Record<string, { label: string }> = {
  CREATED: { label: "Kasus dibuat" },
  DRAFT_CREATED: { label: "Draf email AI disusun" },
  DRAFT_UPDATED: { label: "Draf email disunting" },
  APPROVED: { label: "Izin pengiriman diberikan" },
  SENT: { label: "Email terkirim" },
  FOLLOWUP_DRAFTED: { label: "Draf tindak lanjut disusun" },
  FOLLOWUP_SENT: { label: "Tindak lanjut terkirim" },
  STATUS_CHANGED: { label: "Status kasus berubah" },
  NOTE: { label: "Catatan" },
};

export const INST_TYPE_META: Record<string, { label: string; chip: string }> = {
  government: { label: "Pemerintah", chip: "bg-teal-50 text-teal-700 border-teal-200" },
  embassy: { label: "Kedutaan / Konsulat", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  international: { label: "Internasional", chip: "bg-amber-50 text-amber-700 border-amber-200" },
  ngo: { label: "LSM", chip: "bg-rose-50 text-rose-700 border-rose-200" },
};

export const ORIGIN_COUNTRIES = [
  "Indonesia",
  "Filipina",
  "Nepal",
  "Bangladesh",
  "Sri Lanka",
  "India",
  "Pakistan",
  "Etiopia",
  "Lainnya",
];

/* ---------- DTOs ---------- */

export interface InstitutionDTO {
  id: string;
  name: string;
  shortName: string | null;
  type: string;
  originCountry: string;
  destinationCountry: string | null;
  categories: string[];
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  description: string;
  jurisdiction: string;
  priority: number;
  responseTime: string | null;
  language: string;
}

export interface MatchedInstitution extends InstitutionDTO {
  score: number;
  reasons: string[];
}

export interface TimelineEntry {
  at: string;
  event: string;
  note?: string;
  by?: string;
}

export interface AttachmentItem {
  name: string;
  kind: string; // contract | evidence
}

export interface CaseEmailDTO {
  id: string;
  type: string; // initial | followup
  subject: string;
  body: string;
  bodyUser: string | null;
  advice: string | null;
  attachments: string[];
  status: string; // draft | sent
  sentAt: string | null;
  createdAt: string;
}

export interface AdvocacyCaseDTO {
  id: string;
  caseNumber: string;
  title: string;
  category: CaseCategory;
  priority: string;
  status: CaseStatus;
  originCountry: string;
  destinationCountry: string | null;
  chronology: string | null;
  anonymous: boolean;
  contractId: string | null;
  institution: Pick<InstitutionDTO, "id" | "name" | "shortName" | "type" | "email" | "website" | "language" | "responseTime">;
  timeline: TimelineEntry[];
  attachments: AttachmentItem[];
  createdByEmail: string;
  createdByName: string;
  sentAt: string | null;
  followUpDue: string | null;
  createdAt: string;
  updatedAt: string;
  emailCount: number;
  lastEmailSubject: string | null;
  followUpOverdueDays: number; // >0 berarti terlambat & perlu tindak lanjut
  emails?: CaseEmailDTO[]; // terisi pada detail kasus
}

export interface EmailDraft {
  subject: string;
  body: string;
  bodyUser: string | null;
  advice: string | null;
  attachments: string[];
}

export interface CreateCaseInput {
  title: string;
  category: CaseCategory;
  priority: string;
  originCountry: string;
  destinationCountry: string | null;
  chronology: string;
  anonymous: boolean;
  contractId: string | null;
  institutionId: string;
  attachments: AttachmentItem[];
  draft: EmailDraft;
  createdByEmail: string;
  createdByName: string;
}

/* ---------- helpers ---------- */

export function daysOverdue(followUpDue: string | null, status: string): number {
  if (!followUpDue) return 0;
  if (status !== "sent" && status !== "followed_up") return 0;
  const due = new Date(followUpDue);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - due.getTime()) / 86_400_000));
}

export function mailtoUrl(to: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

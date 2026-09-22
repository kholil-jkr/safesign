// SafeSign Manajemen — shared types & helpers (client + server safe)

export type WorkflowStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "terminated";

export type TimeStatus = "upcoming" | "active" | "expiring_soon" | "critical" | "expired" | "no_date";

export type Category =
  | "employment"
  | "vendor"
  | "lease"
  | "nda"
  | "service"
  | "other";

export type Role = "admin" | "legal" | "manager" | "staff";

export type RiskLevel = "low" | "medium" | "high";

export interface ContractDTO {
  id: string;
  title: string;
  contractNo: string | null;
  partyA: string | null;
  partyB: string | null;
  startDate: string | null;
  endDate: string | null;
  value: number | null;
  currency: string;
  category: string;
  tags: string;
  status: string;
  riskLevel: string | null;
  analysisJson: string | null;
  contentText: string | null;
  sourceType: string | null;
  fileName: string | null;
  autoRenew: boolean;
  notes: string | null;
  reminders: number[];
  acked: string[];
  createdById: string | null;
  createdBy: { id: string; name: string; role: string } | null;
  createdAt: string;
  updatedAt: string;
  approvalCount?: number;
  signedCount?: number;
  versionCount?: number;
}

export interface ApprovalDTO {
  id: string;
  contractId: string;
  step: number;
  approverRole: string;
  approverName: string | null;
  status: string;
  note: string | null;
  createdAt: string;
  decidedAt: string | null;
}

export interface SignatureDTO {
  id: string;
  contractId: string;
  signerName: string;
  signerRole: string;
  signatureData: string;
  typedName: string | null;
  signedAt: string;
}

export interface VersionDTO {
  id: string;
  contractId: string;
  version: number;
  title: string;
  contentText: string | null;
  snapshotJson: string | null;
  changeNote: string | null;
  editedBy: string | null;
  createdAt: string;
}

export interface TemplateDTO {
  id: string;
  name: string;
  category: string;
  description: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface ContractDetailDTO extends ContractDTO {
  approvals: ApprovalDTO[];
  signatures: SignatureDTO[];
  versions: VersionDTO[];
}

export interface ExtractedFields {
  title?: string;
  contractNo?: string;
  partyA?: string;
  partyB?: string;
  startDate?: string; // yyyy-mm-dd
  endDate?: string;
  value?: number | null;
  currency?: string;
  category?: Category;
  autoRenew?: boolean;
  tags?: string[];
  keyClauses?: { clause: string; summary: string }[];
}

export interface DashboardStats {
  total: number;
  byStatus: { status: string; count: number; label?: string }[];
  byCategory: { category: string; count: number; label?: string }[];
  byRisk: { risk: string; count: number }[];
  monthlyRenewals: { month: string; count: number; value: number }[];
  totalValueByCurrency: { currency: string; total: number }[];
  expiringSoon: (ContractDTO & { daysLeft: number })[];
  recent: ContractDTO[];
  pendingApprovals: (ContractDTO & { pendingStep: number; pendingRole: string })[];
  counts: { active: number; expiring30: number; expired: number; drafts: number; pending: number; signed: number };
}

export interface NotificationItem {
  contractId: string;
  title: string;
  daysLeft: number;
  threshold: number;
  endDate: string | null;
  key: string;
  autoRenew: boolean;
}

/* ---------- labels & helpers ---------- */

export const CATEGORY_LABELS: Record<string, string> = {
  employment: "Ketenagakerjaan",
  vendor: "Vendor/Pengadaan",
  lease: "Sewa",
  nda: "Kerahasiaan",
  service: "Jasa/Layanan",
  other: "Lainnya",
};

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Menunggu Approval",
  approved: "Disetujui",
  rejected: "Ditolak",
  terminated: "Dihentikan",
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  legal: "Legal",
  manager: "Manager",
  staff: "Staf",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "Akses penuh: hapus kontrak, kelola pengguna, template, approval, dan semua data.",
  legal: "Review & approval tahap legal, kelola template kontrak, akses semua kontrak.",
  manager: "Approval tahap pertama, buat & kelola kontrak, lihat semua laporan.",
  staff: "Unggah & buat draft kontrak, lihat semua kontrak, ajukan approval (tidak bisa approve/hapus).",
};

export const REMINDER_OPTIONS = [90, 60, 30, 7];

export const DEFAULT_USERS: UserDTO[] = [
  { id: "u-admin", name: "Budi Santoso", email: "budi@safesign.id", role: "admin" },
  { id: "u-legal", name: "Sari Wulandari", email: "sari@safesign.id", role: "legal" },
  { id: "u-manager", name: "Agus Pratama", email: "agus@safesign.id", role: "manager" },
  { id: "u-staff", name: "Rina Melati", email: "rina@safesign.id", role: "staff" },
];

export function daysLeft(endDate: string | Date | null): number | null {
  if (!endDate) return null;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  const now = new Date();
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((startOfEnd.getTime() - startOfNow.getTime()) / 86_400_000);
}

export function timeStatus(c: { endDate: string | null; startDate: string | null }): TimeStatus {
  if (!c.endDate) return "no_date";
  const dl = daysLeft(c.endDate);
  if (dl === null) return "no_date";
  if (dl < 0) return "expired";
  const started = !c.startDate || new Date(c.startDate) <= new Date();
  if (dl <= 7) return "critical";
  if (dl <= 30) return "expiring_soon";
  return started ? "active" : "upcoming";
}

export const TIME_STATUS_META: Record<TimeStatus, { label: string; className: string; dot: string }> = {
  active: { label: "Aktif", className: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  upcoming: { label: "Akan Mulai", className: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  expiring_soon: { label: "Segera Berakhir", className: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  critical: { label: "Kritis", className: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  expired: { label: "Kedaluwarsa", className: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  no_date: { label: "Tanpa Tanggal", className: "bg-slate-100 text-slate-500 border-slate-200", dot: "bg-slate-300" },
};

export const STATUS_META: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-700 border-slate-300" },
  pending_approval: { label: "Menunggu Approval", className: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "Disetujui", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Ditolak", className: "bg-red-50 text-red-700 border-red-200" },
  terminated: { label: "Dihentikan", className: "bg-slate-800 text-white border-slate-800" },
};

export const RISK_META: Record<string, { label: string; className: string }> = {
  low: { label: "Risiko Rendah", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  medium: { label: "Risiko Sedang", className: "bg-amber-50 text-amber-700 border-amber-200" },
  high: { label: "Risiko Tinggi", className: "bg-red-50 text-red-700 border-red-200" },
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }));
export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }));

/* ---------- formatters ---------- */

export function formatCurrency(value: number | null | undefined, currency = "IDR"): string {
  if (value === null || value === undefined) return "—";
  if (currency === "IDR") {
    if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
    return `Rp ${value.toLocaleString("id-ID")}`;
  }
  return `${currency} ${value.toLocaleString("en-US")}`;
}

export function formatFullCurrency(value: number | null | undefined, currency = "IDR"): string {
  if (value === null || value === undefined) return "—";
  const symbol = currency === "IDR" ? "Rp" : currency;
  return `${symbol} ${value.toLocaleString("id-ID")}`;
}

export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function daysLeftLabel(dl: number | null): string {
  if (dl === null) return "—";
  if (dl < 0) return `Lewat ${Math.abs(dl)} hari`;
  if (dl === 0) return "Berakhir hari ini";
  return `H-${dl}`;
}

export function parseTags(tags: string): string[] {
  return tags.split(",").map((t) => t.trim()).filter(Boolean);
}

export function canApproveStep(role: Role, stepRole: string): boolean {
  if (role === "admin") return true;
  return role === stepRole;
}

export function canDelete(role: Role): boolean {
  return role === "admin";
}

export function canManageTemplates(role: Role): boolean {
  return role === "admin" || role === "legal";
}

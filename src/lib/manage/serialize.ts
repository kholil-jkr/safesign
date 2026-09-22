// SafeSign Manajemen — server-side helpers: Prisma → DTO serialization
import type {
  Contract,
  ContractVersion,
  Approval,
  Signature,
  Template,
  User,
} from "@prisma/client";
import type {
  ContractDTO,
  ContractDetailDTO,
  VersionDTO,
  ApprovalDTO,
  SignatureDTO,
  TemplateDTO,
  UserDTO,
} from "./types";

type ContractWithUser = Contract & { createdBy?: User | null };
type ContractWithCounts = ContractWithUser & {
  _count?: { approvals?: number; signatures?: number; versions?: number };
};

export function serializeUser(u: User | null | undefined): UserDTO | null {
  if (!u) return null;
  return { id: u.id, name: u.name, email: u.email, role: u.role as UserDTO["role"] };
}

export function serializeContract(c: ContractWithCounts): ContractDTO {
  return {
    id: c.id,
    title: c.title,
    contractNo: c.contractNo,
    partyA: c.partyA,
    partyB: c.partyB,
    startDate: c.startDate ? c.startDate.toISOString() : null,
    endDate: c.endDate ? c.endDate.toISOString() : null,
    value: c.value,
    currency: c.currency,
    category: c.category,
    tags: c.tags,
    status: c.status,
    riskLevel: c.riskLevel,
    analysisJson: c.analysisJson,
    contentText: c.contentText,
    sourceType: c.sourceType,
    fileName: c.fileName,
    autoRenew: c.autoRenew,
    notes: c.notes,
    reminders: safeParse<number[]>(c.remindersJson, [90, 60, 30, 7]),
    acked: safeParse<string[]>(c.ackedJson, []),
    createdById: c.createdById,
    createdBy: c.createdBy ? { id: c.createdBy.id, name: c.createdBy.name, role: c.createdBy.role } : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    approvalCount: c._count?.approvals ?? undefined,
    signedCount: c._count?.signatures ?? undefined,
    versionCount: c._count?.versions ?? undefined,
  };
}

export function serializeVersion(v: ContractVersion): VersionDTO {
  return {
    id: v.id,
    contractId: v.contractId,
    version: v.version,
    title: v.title,
    contentText: v.contentText,
    snapshotJson: v.snapshotJson,
    changeNote: v.changeNote,
    editedBy: v.editedBy,
    createdAt: v.createdAt.toISOString(),
  };
}

export function serializeApproval(a: Approval): ApprovalDTO {
  return {
    id: a.id,
    contractId: a.contractId,
    step: a.step,
    approverRole: a.approverRole,
    approverName: a.approverName,
    status: a.status,
    note: a.note,
    createdAt: a.createdAt.toISOString(),
    decidedAt: a.decidedAt ? a.decidedAt.toISOString() : null,
  };
}

export function serializeSignature(s: Signature): SignatureDTO {
  return {
    id: s.id,
    contractId: s.contractId,
    signerName: s.signerName,
    signerRole: s.signerRole,
    signatureData: s.signatureData,
    typedName: s.typedName,
    signedAt: s.signedAt.toISOString(),
  };
}

export function serializeTemplate(t: Template): TemplateDTO {
  return {
    id: t.id,
    name: t.name,
    category: t.category,
    description: t.description,
    content: t.content,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export function serializeDetail(
  c: Contract & {
    createdBy?: User | null;
    approvals?: Approval[];
    signatures?: Signature[];
    versions?: ContractVersion[];
  }
): ContractDetailDTO {
  return {
    ...serializeContract(c),
    approvals: (c.approvals ?? []).map(serializeApproval).sort((a, b) => a.step - b.step),
    signatures: (c.signatures ?? []).map(serializeSignature).sort((a, b) => b.signedAt.localeCompare(a.signedAt)),
    versions: (c.versions ?? []).map(serializeVersion).sort((a, b) => b.version - a.version),
  };
}

export function safeParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

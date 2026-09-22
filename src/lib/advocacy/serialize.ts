// SafeSign Advokasi — Prisma → DTO serializers (server-side)
import type { Prisma } from "@prisma/client";
import {
  daysOverdue,
  type AdvocacyCaseDTO,
  type CaseCategory,
  type CaseStatus,
  type InstitutionDTO,
  type AttachmentItem,
  type TimelineEntry,
} from "./types";

type InstitutionRow = Prisma.InstitutionGetPayload<Record<string, never>>;
type CaseRow = Prisma.AdvocacyCaseGetPayload<{ include: { institution: true; emails: true } }>;

export function serializeInstitution(i: InstitutionRow): InstitutionDTO {
  return {
    id: i.id,
    name: i.name,
    shortName: i.shortName,
    type: i.type,
    originCountry: i.originCountry,
    destinationCountry: i.destinationCountry,
    categories: i.categories.split(",").map((s) => s.trim()).filter(Boolean),
    email: i.email,
    phone: i.phone,
    website: i.website,
    address: i.address,
    description: i.description,
    jurisdiction: i.jurisdiction,
    priority: i.priority,
    responseTime: i.responseTime,
    language: i.language,
  };
}

export function serializeCase(c: CaseRow): AdvocacyCaseDTO {
  let timeline: TimelineEntry[] = [];
  try {
    timeline = JSON.parse(c.timelineJson) as TimelineEntry[];
  } catch {
    timeline = [];
  }
  let attachments: AttachmentItem[] = [];
  try {
    attachments = JSON.parse(c.attachmentsJson) as AttachmentItem[];
  } catch {
    attachments = [];
  }
  const emails = [...c.emails].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const last = emails[emails.length - 1];
  return {
    id: c.id,
    caseNumber: c.caseNumber,
    title: c.title,
    category: c.category as CaseCategory,
    priority: c.priority,
    status: c.status as CaseStatus,
    originCountry: c.originCountry,
    destinationCountry: c.destinationCountry,
    chronology: c.chronology,
    anonymous: c.anonymous,
    contractId: c.contractId,
    institution: {
      id: c.institution.id,
      name: c.institution.name,
      shortName: c.institution.shortName,
      type: c.institution.type,
      email: c.institution.email,
      website: c.institution.website,
      language: c.institution.language,
      responseTime: c.institution.responseTime,
    },
    timeline,
    attachments,
    createdByEmail: c.createdByEmail,
    createdByName: c.createdByName,
    sentAt: c.sentAt?.toISOString() ?? null,
    followUpDue: c.followUpDue?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    emailCount: c.emails.length,
    lastEmailSubject: last?.subject ?? null,
    followUpOverdueDays: daysOverdue(c.followUpDue?.toISOString() ?? null, c.status),
    emails: emails.map((e) => ({
      id: e.id,
      type: e.type,
      subject: e.subject,
      body: e.body,
      bodyUser: e.bodyUser,
      advice: e.advice,
      attachments: safeParseJsonArray<string>(e.attachmentsJson),
      status: e.status,
      sentAt: e.sentAt?.toISOString() ?? null,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}

export function safeParseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

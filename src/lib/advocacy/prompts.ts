// SafeSign Advokasi — AI prompt builders (server-side only).
// Menghasilkan draf email advokasi formal + terjemahan bagi pengguna,
// atau draf tindak lanjut (follow-up) untuk kasus yang belum dijawab.
import type { ChatCompletionMessage } from "@/lib/safesign/cloudflare-ai";

export interface DraftPromptInput {
  category: string;
  categoryLabel: string;
  priority: string;
  chronology: string; // cerita pengguna, bahasa apa pun
  originCountry: string;
  destinationCountry: string | null;
  anonymous: boolean;
  userLanguage: string; // "Indonesian"
  workerName: string | null;
  institution: {
    name: string;
    language: string;
    type: string; // government | embassy | international | ngo
    jurisdiction: string;
  };
  contract: {
    contractNo: string | null;
    partyA: string | null; // perusahaan/P3MI
    partyB: string | null; // nama pekerja
    startDate: string | null;
    endDate: string | null;
    value: number | null;
    currency: string;
    riskLevel: string | null;
    redFlagCount: number;
  } | null;
  attachments: string[]; // daftar nama lampiran
}

const PRIORITY_TONE: Record<string, string> = {
  low: "polite routine inquiry",
  medium: "formal complaint requesting action",
  high: "urgent formal complaint",
  urgent: "most urgent complaint requiring immediate protective intervention",
};

export function buildDraftMessages(input: DraftPromptInput): ChatCompletionMessage[] {
  const sameLanguage =
    input.institution.language.toLowerCase().startsWith("indones") ||
    input.institution.language.toLowerCase().startsWith("bahasa");
  const tone = PRIORITY_TONE[input.priority] ?? "formal complaint";

  const system = `You are a senior caseworker at a migrant-worker advocacy organization with 15 years of experience drafting formal complaint and assistance emails that get real responses from governments, embassies, and international bodies.
You write clear, factual, professional emails. Never invent facts. Never exaggerate. When the worker's account is unclear, describe it as the worker reported it.

OUTPUT FORMAT — reply with ONLY one JSON object, no markdown fences, no commentary:
{"subject": string, "body": string, "bodyUser": string | null, "advice": string, "attachments": string[]}
Use \\n for line breaks inside strings.`;

  const user = `Compose a ${tone} email (a ${input.categoryLabel} case).

TARGET INSTITUTION: ${input.institution.name} (${input.institution.type}).
Its mandate: ${input.institution.jurisdiction}
EMAIL LANGUAGE: write "body" in ${input.institution.language}.

WORKER SITUATION:
- Origin country: ${input.originCountry}
- Destination country (work location): ${input.destinationCountry ?? "not specified"}
- Anonymous report: ${input.anonymous ? "YES — hide the worker's identity; do NOT include the worker's name anywhere; describe the sender as a migrant worker wishing to remain anonymous and add an explicit confidentiality request. Keep employer/agency names (needed for action)." : "NO — use the worker's name provided below."}
- Worker name (use only if not anonymous): ${input.workerName ?? "not provided — describe generically"}
${input.contract ? `- Employment contract on file: contract number ${input.contract.contractNo ?? "n/a"}; employer/agency ${input.contract.partyA ?? "n/a"}; worker ${input.contract.partyB ?? "n/a"}; period ${input.contract.startDate ?? "?"} to ${input.contract.endDate ?? "?"}; salary ${input.contract.value ?? "?"} ${input.contract.currency}; AI red-flag analysis found ${input.contract.redFlagCount} concerning clause(s)${input.contract.riskLevel ? ` (overall risk: ${input.contract.riskLevel})` : ""}.` : "- No linked contract document."}

CHRONOLOGY AS TOLD BY THE WORKER (in their own words, may be in ${input.userLanguage} or another language — translate faithfully into the email language, keep ALL names, dates, amounts and places; do not add or assume facts):
"""
${input.chronology}
"""

AVAILABLE ATTACHMENTS (list exactly these in the email's attachment list, translated appropriately):
${input.attachments.map((a, i) => `${i + 1}. ${a}`).join("\n") || "(none — omit the attachment list)"}

REQUIREMENTS FOR "body":
1. Formal letter structure: addressee line ("To the Attention of ..." or local equivalent), salutation, introduction (who the worker is: nationality, role, destination), purpose of writing, background with contract facts when available, the incident chronology translated faithfully, then a numbered list of 2-4 SPECIFIC, actionable requests appropriate for this institution type (e.g. for a labour ministry: investigation of wage arrears; for an embassy: consular intervention & repatriation; for ILO: guidance on international referral mechanisms), then the attachment list, then closing and signature.
2. Tone: factual, respectful, firm. No emotional language, no threats, no accusations beyond what the worker reported.
3. For international bodies ONLY, you may add ONE brief sentence citing relevant international labour standards.
4. Keep it under 450 words.
5. If anonymous: sign as a representative account on behalf of an anonymous worker.

REQUIREMENTS FOR "subject": a concise, specific subject line in the email language (max 12 words) mentioning the issue type and location.

REQUIREMENTS FOR "bodyUser": ${
    sameLanguage
      ? "The email language equals the user's language — set bodyUser to null."
      : `A faithful, complete translation of "body" into ${input.userLanguage}, so the worker understands EXACTLY what will be sent on their behalf. Same structure, same content.`
  }

REQUIREMENTS FOR "advice": 1-3 short sentences in ${input.userLanguage} telling the worker what to expect next (typical response time, what evidence to prepare, what to do if there is no reply).

REQUIREMENTS FOR "attachments": array of the attachment names in the email language (same items, translated if needed).`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export interface FollowUpPromptInput {
  institutionName: string;
  institutionLanguage: string;
  originalSubject: string;
  sentAt: string; // ISO
  followUpNumber: number; // 1 = first follow-up
  daysSinceSent: number;
  caseNumber: string;
  categoryLabel: string;
  chronologyBrief: string;
  userLanguage: string;
  workerName: string | null;
  anonymous: boolean;
}

export function buildFollowUpMessages(input: FollowUpPromptInput): ChatCompletionMessage[] {
  const sameLanguage =
    input.institutionLanguage.toLowerCase().startsWith("indones") ||
    input.institutionLanguage.toLowerCase().startsWith("bahasa");

  const system = `You are a senior caseworker at a migrant-worker advocacy organization. Write a polite but firm follow-up email referencing an earlier complaint that received no response.
OUTPUT FORMAT — reply with ONLY one JSON object, no markdown fences:
{"subject": string, "body": string, "bodyUser": string | null, "advice": string, "attachments": string[]}
Use \\n for line breaks.`;

  const user = `Follow-up #${input.followUpNumber} (case ${input.caseNumber}).

TARGET INSTITUTION: ${input.institutionName}
EMAIL LANGUAGE for "body": ${input.institutionLanguage}
ORIGINAL EMAIL: sent on ${input.sentAt} (${input.daysSinceSent} days ago) with subject "${input.originalSubject}" — about a ${input.categoryLabel} case.
Worker: ${input.anonymous ? "anonymous reporter (keep identity hidden, keep confidentiality request)" : input.workerName ?? "name not provided"}
Brief case recap: ${input.chronologyBrief}

Write a short (under 220 words) follow-up:
1. "subject" starts with "RE:" or local equivalent + the original subject (may shorten).
2. "body": reference the earlier email and its date, restate the core issue in 2-3 sentences, politely request a status update and a response within a specific timeframe (e.g. 10 working days), and mention that the worker remains in a vulnerable situation (only if consistent with the category). Close with the same sender identity style as the original (anonymous or named).
3. "attachments": empty array [].
4. "advice": 1-2 sentences in ${input.userLanguage} for the worker — e.g. consider also contacting a parallel institution if still no reply.
5. ${
    sameLanguage
      ? 'bodyUser: null (same language as the worker).'
      : `"bodyUser": full translation into ${input.userLanguage}.`
  }`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

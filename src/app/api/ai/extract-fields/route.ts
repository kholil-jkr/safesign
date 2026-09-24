// SafeSign Manajemen — AI structured field extraction from contract text
// Reuses the server-side Cloudflare Workers AI client (key never exposed).
import { NextRequest, NextResponse } from "next/server";
import { cfChatCompletion, extractJson } from "@/lib/safesign/cloudflare-ai";
import type { ExtractedFields } from "@/lib/manage/types";
import { getSessionUser, isManageRole } from "@/lib/auth";


export const dynamic = "force-dynamic";
export const maxDuration = 120;

const PROMPT = `You are a contract data extraction engine. From the contract text below, extract structured metadata and return ONLY a valid JSON object (no markdown fences, no commentary) with EXACTLY these keys:

{
  "title": "short descriptive title of the contract (max 120 chars, same language as the contract; e.g. 'PKWT — Penempatan Pekerja Arab Saudi')",
  "contractNo": "contract/agreement number as written, or empty string",
  "partyA": "name of the first party (employer/company/agency), or empty string",
  "partyB": "name of the second party (employee/vendor/tenant), or empty string",
  "startDate": "YYYY-MM-DD or empty string (contract start / signing effective date)",
  "endDate": "YYYY-MM-DD or empty string (contract end / expiry date; if only a duration is given, compute the end date from start + duration)",
  "value": total contract value as a NUMBER in the contract currency (no thousand separators, no currency symbol), or null if not stated,
  "currency": "ISO currency code among IDR, USD, SAR, MYR, HKD, JPY, TWD, SGD, AED, QAR, KWD, EUR; default "IDR" if amounts use Rp/Rupiah",
  "category": "one of: employment (perjanjian kerja/penempatan), vendor (pengadaan barang/jasa berulang), lease (sewa menyewa), nda (kerahasiaan), service (jasa profesional), other",
  "autoRenew": true if the contract renews automatically (perpanjangan otomatis/auto-renew), else false,
  "tags": ["3-6 short lowercase keyword tags in Indonesian, e.g. pekerja migran, sewa, vendor"],
  "keyClauses": [
    {"clause": "clause/pasal reference (e.g. 'Pasal 4')", "summary": "one-sentence summary of what it says, in Indonesian"}
  ]
}

Rules:
- keyClauses: include 3-6 of the most important clauses (upah/gaji, jam kerja, denda/sanksi, terminasi, kerahasiaan, perpanjangan, penyelesaian sengketa).
- Dates: prefer explicit dates. Compute from duration if needed (assume start date is today when only a duration is given).
- If a field is not found, use "" or null per the schema — never invent data.
- Numbers: plain digits only (42000000, not "42.000.000").
- Respond in the JSON structure above only.`;

export async function POST(req: NextRequest) {
    const authUser = await getSessionUser();
    if (!authUser || !isManageRole(authUser.role)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

  try {
    const body = (await req.json()) as { text?: string };
    const text = (body.text ?? "").trim();
    if (text.length < 30) {
      return NextResponse.json({ ok: false, error: "TEXT_TOO_SHORT" }, { status: 400 });
    }
    const clipped = text.slice(0, 18_000);

    let fields: ExtractedFields | null = null;
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 2 && !fields; attempt++) {
      try {
        const raw = await cfChatCompletion(
          [
            { role: "system", content: PROMPT },
            { role: "user", content: `CONTRACT TEXT:\n\n${clipped}` },
          ],
          { maxTokens: 1600, temperature: 0 }
        );
        fields = extractJson<ExtractedFields>(raw);
      } catch (err) {
        lastErr = err;
      }
    }

    if (!fields) {
      console.error("[extract-fields] no JSON parsed", lastErr);
      return NextResponse.json({ ok: false, error: "EXTRACTION_FAILED" }, { status: 502 });
    }

    // sanitize & normalize
    const dateOk = (s?: string) => (typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined);
    const clean: ExtractedFields = {
      title: typeof fields.title === "string" ? fields.title.slice(0, 200) : undefined,
      contractNo: typeof fields.contractNo === "string" ? fields.contractNo.slice(0, 100) : undefined,
      partyA: typeof fields.partyA === "string" ? fields.partyA.slice(0, 150) : undefined,
      partyB: typeof fields.partyB === "string" ? fields.partyB.slice(0, 150) : undefined,
      startDate: dateOk(fields.startDate),
      endDate: dateOk(fields.endDate),
      value: typeof fields.value === "number" && !isNaN(fields.value) && fields.value >= 0 ? fields.value : null,
      currency: typeof fields.currency === "string" ? fields.currency.toUpperCase().slice(0, 3) : undefined,
      category: ["employment", "vendor", "lease", "nda", "service", "other"].includes(String(fields.category))
        ? (fields.category as ExtractedFields["category"])
        : undefined,
      autoRenew: fields.autoRenew === true,
      tags: Array.isArray(fields.tags)
        ? fields.tags.filter((t) => typeof t === "string").slice(0, 6).map((t) => t.toLowerCase().slice(0, 30))
        : undefined,
      keyClauses: Array.isArray(fields.keyClauses)
        ? fields.keyClauses
            .filter((k) => k && typeof k.clause === "string" && typeof k.summary === "string")
            .slice(0, 8)
            .map((k) => ({ clause: k.clause.slice(0, 60), summary: k.summary.slice(0, 200) }))
        : undefined,
    };

    return NextResponse.json({ ok: true, fields: clean });
  } catch (err) {
    console.error("[extract-fields]", err);
    return NextResponse.json({ ok: false, error: "GENERIC" }, { status: 500 });
  }
}

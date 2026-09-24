// SafeSign Manajemen — contracts list & create API
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeContract } from "@/lib/manage/serialize";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES = ["employment", "vendor", "lease", "nda", "service", "other"];
const VALID_STATUSES = ["draft", "pending_approval", "approved", "rejected", "terminated"];

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const q = (sp.get("q") ?? "").trim(); // keep original case; DB search is case-insensitive
    const category = sp.get("category") ?? "";
    const status = sp.get("status") ?? "";
    const risk = sp.get("risk") ?? "";
    const time = sp.get("time") ?? ""; // active | expiring | expired
    const sort = sp.get("sort") ?? "updated";
    const dir = sp.get("dir") === "asc" ? "asc" : "desc";

    const where: Prisma.ContractWhereInput = {};
    const AND: Prisma.ContractWhereInput[] = [];
    if (q) {
      AND.push({
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { contractNo: { contains: q, mode: "insensitive" } },
          { partyA: { contains: q, mode: "insensitive" } },
          { partyB: { contains: q, mode: "insensitive" } },
          { tags: { contains: q, mode: "insensitive" } },
          { notes: { contains: q, mode: "insensitive" } },
        ],
      });
    }
    if (category && VALID_CATEGORIES.includes(category)) AND.push({ category });
    if (status && VALID_STATUSES.includes(status)) AND.push({ status });
    if (risk && ["low", "medium", "high"].includes(risk)) AND.push({ riskLevel: risk });

    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86_400_000);
    if (time === "expired") AND.push({ endDate: { lt: now } });
    if (time === "expiring") AND.push({ endDate: { gte: now, lte: in30 } });
    if (time === "active") {
      AND.push({ endDate: { gte: now } });
      AND.push({ OR: [{ startDate: null }, { startDate: { lte: now } }] });
    }
    if (AND.length > 0) where.AND = AND;

    const orderBy: Prisma.ContractOrderByWithRelationInput =
      sort === "endDate" ? { endDate: dir }
      : sort === "value" ? { value: dir }
      : sort === "title" ? { title: dir }
      : sort === "created" ? { createdAt: dir }
      : { updatedAt: dir };

    const contracts = await db.contract.findMany({
      where,
      orderBy,
      include: {
        createdBy: true,
        _count: { select: { approvals: true, signatures: true, versions: true } },
      },
    });

    return NextResponse.json({ ok: true, contracts: contracts.map(serializeContract) });
  } catch (err) {
    console.error("[contracts GET]", err);
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
}

function toDateOrNull(s: unknown): Date | null {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(s)) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const title = String(body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ ok: false, error: "TITLE_REQUIRED" }, { status: 400 });
    }
    const category = VALID_CATEGORIES.includes(String(body.category)) ? String(body.category) : "other";
    const value = typeof body.value === "number" && !isNaN(body.value) ? body.value : null;
    const currency = typeof body.currency === "string" && body.currency ? body.currency.slice(0, 8) : "IDR";
    const status = body.submit === true ? "pending_approval" : "draft";

    // Resolve the creator by email (robust against client-side id drift)
    let createdById: string | null = null;
    if (typeof body.createdByEmail === "string" && body.createdByEmail.includes("@")) {
      const creator = await db.user.findUnique({
        where: { email: body.createdByEmail.slice(0, 200) },
      });
      createdById = creator?.id ?? null;
    }

    const contract = await db.contract.create({
      data: {
        title: title.slice(0, 300),
        contractNo: body.contractNo ? String(body.contractNo).slice(0, 100) : null,
        partyA: body.partyA ? String(body.partyA).slice(0, 200) : null,
        partyB: body.partyB ? String(body.partyB).slice(0, 200) : null,
        startDate: toDateOrNull(body.startDate),
        endDate: toDateOrNull(body.endDate),
        value,
        currency,
        category,
        tags: body.tags ? String(body.tags).slice(0, 300) : "",
        status,
        riskLevel: ["low", "medium", "high"].includes(String(body.riskLevel)) ? String(body.riskLevel) : null,
        analysisJson: typeof body.analysisJson === "string" ? body.analysisJson : null,
        contentText: typeof body.contentText === "string" ? body.contentText.slice(0, 200_000) : null,
        sourceType: body.sourceType ? String(body.sourceType).slice(0, 30) : "manual",
        fileName: body.fileName ? String(body.fileName).slice(0, 200) : null,
        autoRenew: body.autoRenew === true,
        notes: body.notes ? String(body.notes).slice(0, 2000) : null,
        remindersJson: JSON.stringify(Array.isArray(body.reminders) ? (body.reminders as number[]) : [90, 60, 30, 7]),
        createdById,
      },
    });

    await db.contractVersion.create({
      data: {
        contractId: contract.id,
        version: 1,
        title: contract.title,
        contentText: contract.contentText,
        snapshotJson: JSON.stringify({ status: contract.status, value: contract.value, endDate: contract.endDate }),
        changeNote: body.submit === true ? "Kontrak dibuat & diajukan untuk approval" : "Kontrak dibuat",
        editedBy: typeof body.editedBy === "string" ? body.editedBy : null,
      },
    });

    if (status === "pending_approval") {
      await db.approval.createMany({
        data: [
          { contractId: contract.id, step: 1, approverRole: "manager" },
          { contractId: contract.id, step: 2, approverRole: "legal" },
        ],
      });
    }

    return NextResponse.json({ ok: true, id: contract.id });
  } catch (err) {
    console.error("[contracts POST]", err);
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
}

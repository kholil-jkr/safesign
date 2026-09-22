// SafeSign Manajemen — contract detail / update / delete
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeDetail } from "@/lib/manage/serialize";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES = ["employment", "vendor", "lease", "nda", "service", "other"];

function toDateOrNull(s: unknown): Date | null {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(s)) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contract = await db.contract.findUnique({
      where: { id },
      include: {
        createdBy: true,
        approvals: true,
        signatures: true,
        versions: { orderBy: { version: "desc" } },
      },
    });
    if (!contract) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ ok: true, contract: serializeDetail(contract) });
  } catch (err) {
    console.error("[contract GET]", err);
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const existing = await db.contract.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim().slice(0, 300);
    if ("contractNo" in body) data.contractNo = body.contractNo ? String(body.contractNo).slice(0, 100) : null;
    if ("partyA" in body) data.partyA = body.partyA ? String(body.partyA).slice(0, 200) : null;
    if ("partyB" in body) data.partyB = body.partyB ? String(body.partyB).slice(0, 200) : null;
    if ("startDate" in body) data.startDate = toDateOrNull(body.startDate);
    if ("endDate" in body) data.endDate = toDateOrNull(body.endDate);
    if ("value" in body) data.value = typeof body.value === "number" && !isNaN(body.value) ? body.value : null;
    if ("currency" in body) data.currency = body.currency ? String(body.currency).slice(0, 8) : "IDR";
    if ("category" in body && VALID_CATEGORIES.includes(String(body.category))) data.category = String(body.category);
    if ("tags" in body) data.tags = body.tags ? String(body.tags).slice(0, 300) : "";
    if ("autoRenew" in body) data.autoRenew = body.autoRenew === true;
    if ("notes" in body) data.notes = body.notes ? String(body.notes).slice(0, 2000) : null;
    if ("contentText" in body) data.contentText = typeof body.contentText === "string" ? body.contentText.slice(0, 200_000) : null;
    if ("analysisJson" in body) data.analysisJson = typeof body.analysisJson === "string" ? body.analysisJson : null;
    if ("riskLevel" in body) data.riskLevel = ["low", "medium", "high"].includes(String(body.riskLevel)) ? String(body.riskLevel) : null;
    if (Array.isArray(body.reminders)) data.remindersJson = JSON.stringify(body.reminders);

    // Any change to substantive fields → snapshot a new version
    const substantiveKeys = ["title", "contractNo", "partyA", "partyB", "startDate", "endDate", "value", "category", "contentText"];
    const changedSubstantive = substantiveKeys.some((k) => k in data && JSON.stringify(data[k]) !== JSON.stringify((existing as Record<string, unknown>)[k]));

    const contract = await db.contract.update({ where: { id }, data });

    if (changedSubstantive) {
      const last = await db.contractVersion.findFirst({ where: { contractId: id }, orderBy: { version: "desc" } });
      const nextVersion = (last?.version ?? 0) + 1;
      await db.contractVersion.create({
        data: {
          contractId: id,
          version: nextVersion,
          title: contract.title,
          contentText: contract.contentText,
          snapshotJson: JSON.stringify({
            status: contract.status,
            value: contract.value,
            endDate: contract.endDate,
            partyB: contract.partyB,
          }),
          changeNote: body.changeNote ? String(body.changeNote).slice(0, 300) : "Perubahan data kontrak (amandemen)",
          editedBy: body.editedBy ? String(body.editedBy).slice(0, 100) : null,
        },
      });
    }

    return NextResponse.json({ ok: true, id: contract.id });
  } catch (err) {
    console.error("[contract PATCH]", err);
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.contract.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contract DELETE]", err);
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
}

// SafeSign Manajemen — versions: list & restore
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeVersion } from "@/lib/manage/serialize";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const versions = await db.contractVersion.findMany({
      where: { contractId: id },
      orderBy: { version: "desc" },
    });
    return NextResponse.json({ ok: true, versions: versions.map(serializeVersion) });
  } catch (err) {
    console.error("[versions GET]", err);
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as { versionId?: string; actorName?: string };
    if (!body.versionId) return NextResponse.json({ ok: false, error: "VERSION_REQUIRED" }, { status: 400 });

    const target = await db.contractVersion.findFirst({ where: { id: body.versionId, contractId: id } });
    if (!target) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    const contract = await db.contract.findUnique({ where: { id } });
    if (!contract) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    // restore: apply old snapshot fields onto the contract, then record a NEW version
    const snapshot = (() => {
      try {
        return target.snapshotJson ? (JSON.parse(target.snapshotJson) as Record<string, unknown>) : {};
      } catch {
        return {};
      }
    })();

    await db.contract.update({
      where: { id },
      data: {
        title: target.title,
        contentText: target.contentText,
        value: typeof snapshot.value === "number" ? snapshot.value : contract.value,
        endDate: snapshot.endDate ? new Date(String(snapshot.endDate)) : contract.endDate,
      },
    });

    const last = await db.contractVersion.findFirst({ where: { contractId: id }, orderBy: { version: "desc" } });
    await db.contractVersion.create({
      data: {
        contractId: id,
        version: (last?.version ?? 0) + 1,
        title: target.title,
        contentText: target.contentText,
        snapshotJson: target.snapshotJson,
        changeNote: `Restore ke versi #${target.version}`,
        editedBy: (body.actorName ?? "Pengguna").slice(0, 100),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[versions POST]", err);
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
}

// SafeSign Manajemen — workflow actions: submit, approve, reject, terminate, reopen
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface WorkflowBody {
  action: "submit" | "approve" | "reject" | "terminate" | "reopen";
  actorId?: string; // userId of the simulated current user
  actorName?: string;
  note?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as WorkflowBody;
    const contract = await db.contract.findUnique({ where: { id }, include: { approvals: { orderBy: { step: "asc" } } } });
    if (!contract) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    const actorName = (body.actorName ?? "Pengguna").slice(0, 100);
    const note = body.note ? String(body.note).slice(0, 500) : null;

    if (body.action === "submit") {
      if (contract.status !== "draft" && contract.status !== "rejected") {
        return NextResponse.json({ ok: false, error: "INVALID_STATE" }, { status: 400 });
      }
      await db.approval.deleteMany({ where: { contractId: id } });
      await db.approval.createMany({
        data: [
          { contractId: id, step: 1, approverRole: "manager" },
          { contractId: id, step: 2, approverRole: "legal" },
        ],
      });
      await db.contract.update({ where: { id }, data: { status: "pending_approval" } });
      await addVersion(id, contract.title, contract.contentText, `Diajukan untuk approval oleh ${actorName}`, actorName, contract);
      return NextResponse.json({ ok: true, status: "pending_approval" });
    }

    if (body.action === "approve" || body.action === "reject") {
      if (contract.status !== "pending_approval") {
        return NextResponse.json({ ok: false, error: "NOT_PENDING" }, { status: 400 });
      }
      const pendingStep = contract.approvals.find((a) => a.status === "pending");
      if (!pendingStep) return NextResponse.json({ ok: false, error: "NO_PENDING_STEP" }, { status: 400 });

      await db.approval.update({
        where: { id: pendingStep.id },
        data: {
          status: body.action === "approve" ? "approved" : "rejected",
          approverName: actorName,
          note,
          decidedAt: new Date(),
        },
      });

      if (body.action === "reject") {
        await db.contract.update({ where: { id }, data: { status: "rejected" } });
        await addVersion(id, contract.title, contract.contentText, `DITOLAK pada tahap ${pendingStep.approverRole} oleh ${actorName}${note ? `: "${note}"` : ""}`, actorName, contract);
        return NextResponse.json({ ok: true, status: "rejected" });
      }

      const remaining = await db.approval.count({ where: { contractId: id, status: "pending" } });
      if (remaining === 0) {
        await db.contract.update({ where: { id }, data: { status: "approved" } });
        await addVersion(id, contract.title, contract.contentText, `Disetujui penuh (semua tahap) oleh ${actorName}`, actorName, contract);
        return NextResponse.json({ ok: true, status: "approved" });
      }
      return NextResponse.json({ ok: true, status: "pending_approval" });
    }

    if (body.action === "terminate") {
      await db.contract.update({ where: { id }, data: { status: "terminated" } });
      await addVersion(id, contract.title, contract.contentText, `Kontrak dihentikan (terminate) oleh ${actorName}${note ? `: "${note}"` : ""}`, actorName, contract);
      return NextResponse.json({ ok: true, status: "terminated" });
    }

    if (body.action === "reopen") {
      if (contract.status !== "terminated" && contract.status !== "rejected") {
        return NextResponse.json({ ok: false, error: "INVALID_STATE" }, { status: 400 });
      }
      await db.contract.update({ where: { id }, data: { status: "draft" } });
      await addVersion(id, contract.title, contract.contentText, `Dibuka kembali sebagai draft oleh ${actorName}`, actorName, contract);
      return NextResponse.json({ ok: true, status: "draft" });
    }

    return NextResponse.json({ ok: false, error: "UNKNOWN_ACTION" }, { status: 400 });
  } catch (err) {
    console.error("[workflow]", err);
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
}

async function addVersion(
  contractId: string,
  title: string,
  contentText: string | null,
  note: string,
  actorName: string,
  snapshotSource: { status: string; value: number | null; endDate: Date | null }
) {
  const last = await db.contractVersion.findFirst({ where: { contractId }, orderBy: { version: "desc" } });
  await db.contractVersion.create({
    data: {
      contractId,
      version: (last?.version ?? 0) + 1,
      title,
      contentText,
      snapshotJson: JSON.stringify({ status: snapshotSource.status, value: snapshotSource.value, endDate: snapshotSource.endDate }),
      changeNote: note,
      editedBy: actorName,
    },
  });
}

// SafeSign Manajemen — e-signature: add signature to a contract
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as {
      signerName?: string;
      signerRole?: string;
      signatureData?: string;
      typedName?: string;
    };

    const signerName = (body.signerName ?? "").trim();
    if (!signerName) return NextResponse.json({ ok: false, error: "NAME_REQUIRED" }, { status: 400 });

    const dataUrl = body.signatureData ?? "";
    const isPng = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(dataUrl);
    if (!isPng) return NextResponse.json({ ok: false, error: "INVALID_SIGNATURE" }, { status: 400 });
    if (dataUrl.length > 400_000) return NextResponse.json({ ok: false, error: "TOO_LARGE" }, { status: 400 });

    const contract = await db.contract.findUnique({ where: { id } });
    if (!contract) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    const signerRole = ["party_a", "party_b", "witness"].includes(String(body.signerRole))
      ? String(body.signerRole)
      : "party_b";

    await db.signature.create({
      data: {
        contractId: id,
        signerName: signerName.slice(0, 150),
        signerRole,
        signatureData: dataUrl,
        typedName: body.typedName ? String(body.typedName).slice(0, 150) : null,
      },
    });

    // signing is a meaningful event — record in version history
    const last = await db.contractVersion.findFirst({ where: { contractId: id }, orderBy: { version: "desc" } });
    await db.contractVersion.create({
      data: {
        contractId: id,
        version: (last?.version ?? 0) + 1,
        title: contract.title,
        contentText: contract.contentText,
        snapshotJson: JSON.stringify({ status: contract.status, value: contract.value, endDate: contract.endDate }),
        changeNote: `Ditandatangani secara digital oleh ${signerName} (${roleLabel(signerRole)})`,
        editedBy: signerName,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[sign]", err);
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
}

function roleLabel(r: string): string {
  if (r === "party_a") return "Pihak Pertama";
  if (r === "witness") return "Saksi";
  return "Pihak Kedua";
}

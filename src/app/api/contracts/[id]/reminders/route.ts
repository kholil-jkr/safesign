// SafeSign Manajemen — reminder thresholds & acknowledge
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeParse } from "@/lib/manage/serialize";
import { getSessionUser, isManageRole } from "@/lib/auth";


export const dynamic = "force-dynamic";

const VALID_DAYS = [90, 60, 30, 7];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const authUser = await getSessionUser();
    if (!authUser || !isManageRole(authUser.role)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

  try {
    const { id } = await params;
    const body = (await req.json()) as { reminders?: number[]; ackKey?: string; ackAction?: "add" | "clear" };
    const contract = await db.contract.findUnique({ where: { id } });
    if (!contract) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    const data: Record<string, string> = {};

    if (Array.isArray(body.reminders)) {
      const clean = [...new Set(body.reminders.filter((d) => VALID_DAYS.includes(d)))].sort((a, b) => b - a);
      data.remindersJson = JSON.stringify(clean);
    }

    if (typeof body.ackKey === "string" && body.ackKey.length < 100) {
      const acked = safeParse<string[]>(contract.ackedJson, []);
      if (body.ackAction === "clear") {
        data.ackedJson = JSON.stringify([]);
      } else if (!acked.includes(body.ackKey)) {
        data.ackedJson = JSON.stringify([...acked, body.ackKey]);
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ ok: false, error: "NOTHING_TO_UPDATE" }, { status: 400 });
    }

    await db.contract.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reminders]", err);
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
}

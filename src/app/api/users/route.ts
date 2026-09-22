// SafeSign Manajemen — users list (for role switcher / team view)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeUser } from "@/lib/manage/serialize";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json({
      ok: true,
      users: users.map(serializeUser).filter((u) => u !== null),
    });
  } catch (err) {
    console.error("[users GET]", err);
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
}

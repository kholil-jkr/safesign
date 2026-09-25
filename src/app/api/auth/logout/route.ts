// SafeSign — logout.
// Mode Penyamaran aktif → seluruh riwayat sesi penyamaran DIHAPUS PERMANEN
// sebelum sesi ditutup (janji privasi: "setelah keluar, data langsung dibuang").
import { NextResponse } from "next/server";
import { getSessionUser, purgeIncognitoLogs, SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await getSessionUser();
    let purged = 0;
    if (user?.incognito) {
      purged = await purgeIncognitoLogs(user.id);
    }
    const res = NextResponse.json({ ok: true, purged });
    res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    console.error("[auth/logout]", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}

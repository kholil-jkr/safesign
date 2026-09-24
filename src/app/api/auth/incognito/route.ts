// SafeSign — toggle Mode Penyamaran (re-issue token dengan klaim `inc`).
// Aktif → analisis TIDAK disimpan permanen; saat logout semua analisis
// sesi penyamaran dihapus dari server.
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, createSessionToken, sessionCookieOptions, SESSION_COOKIE, purgeIncognitoLogs } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: false, error: "LOGIN_REQUIRED" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as { enabled?: boolean };
    const enabled = body.enabled === true;

    // Matikan penyamaran → bersihkan jejak sesi penyamaran sebelumnya
    let purged = 0;
    if (!enabled && user.incognito) {
      purged = await purgeIncognitoLogs(user.id);
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      provider: user.provider,
      incognito: enabled,
    });
    const res = NextResponse.json({ ok: true, incognito: enabled, purged });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (err) {
    console.error("[auth/incognito]", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}

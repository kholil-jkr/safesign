// SafeSign — mulai login Google (OAuth 2.0 authorization code).
// Hanya aktif bila GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET terpasang.
// Proteksi CSRF: state acak disimpan di cookie httpOnly (double-submit).
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ ok: false, error: "GOOGLE_DISABLED" }, { status: 404 });
  }

  const origin = req.nextUrl.origin;
  const state = randomBytes(24).toString("hex");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", `${origin}/api/auth/google/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");

  const res = NextResponse.redirect(url.toString());
  res.cookies.set("safesign_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}

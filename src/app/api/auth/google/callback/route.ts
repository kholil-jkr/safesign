// SafeSign — callback OAuth Google: tukar code → profil → upsert user → sesi.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE, sweepStaleIncognitoLogs } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const cookieState = req.cookies.get("safesign_oauth_state")?.value;

    if (!code || !state || !cookieState || state !== cookieState) {
      return NextResponse.redirect(new URL("/?auth=state_mismatch", req.nextUrl.origin));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${req.nextUrl.origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return NextResponse.redirect(new URL("/?auth=token_failed", req.nextUrl.origin));
    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) return NextResponse.redirect(new URL("/?auth=token_failed", req.nextUrl.origin));

    const profRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profRes.ok) return NextResponse.redirect(new URL("/?auth=profile_failed", req.nextUrl.origin));
    const prof = (await profRes.json()) as { sub: string; email?: string; email_verified?: boolean; name?: string; picture?: string };
    if (!prof.email || prof.email_verified === false) {
      return NextResponse.redirect(new URL("/?auth=email_unverified", req.nextUrl.origin));
    }

    const email = prof.email.toLowerCase();
    let u = await db.user.findUnique({ where: { email } });
    if (!u) {
      const count = await db.user.count();
      u = await db.user.create({
        data: {
          email,
          name: prof.name ?? email.split("@")[0],
          provider: "google",
          image: prof.picture ?? null,
          role: count === 0 ? "admin" : "user",
          lastLoginAt: new Date(),
        },
      });
    } else {
      await db.user.update({
        where: { id: u.id },
        data: { lastLoginAt: new Date(), provider: "google", image: prof.picture ?? u.image },
      });
    }

    void sweepStaleIncognitoLogs();

    const token = await createSessionToken({ id: u.id, email: u.email, name: u.name, role: u.role, provider: "google" });
    const res = NextResponse.redirect(new URL("/?auth=success", req.nextUrl.origin));
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    res.cookies.set("safesign_oauth_state", "", { httpOnly: true, path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    console.error("[auth/google/callback]", err);
    return NextResponse.redirect(new URL("/?auth=error", req.nextUrl.origin));
  }
}

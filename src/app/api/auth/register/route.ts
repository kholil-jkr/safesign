// SafeSign — registrasi akun (email + password).
// User PERTAMA yang mendaftar otomatis menjadi admin (bootstrap organisasi).
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSessionToken, hashPassword, sessionCookieOptions, SESSION_COOKIE, sweepStaleIncognitoLogs } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const Schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8).max(200),
});

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(`register:${clientIp(req)}`, 5, 15 * 60_000);
    if (!rl.ok) {
      return NextResponse.json({ ok: false, error: "RATE_LIMITED", retryAfter: rl.retryAfter }, { status: 429 });
    }

    const parsed = Schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 });
    }
    const { name, email, password } = parsed.data;

    const exists = await db.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ ok: false, error: "EMAIL_TAKEN" }, { status: 409 });
    }

    // Bootstrap: user pertama = admin (pemilik organisasi), selanjutnya "user"
    const count = await db.user.count();
    const role = count === 0 ? "admin" : "user";

    const u = await db.user.create({
      data: { name, email, passwordHash: await hashPassword(password), role, provider: "credentials", lastLoginAt: new Date() },
    });

    void sweepStaleIncognitoLogs();

    const token = await createSessionToken({ id: u.id, email: u.email, name: u.name, role: u.role, provider: u.provider });
    const res = NextResponse.json({
      ok: true,
      user: { id: u.id, name: u.name, email: u.email, role: u.role, provider: u.provider, incognito: false, image: null },
    });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (err) {
    console.error("[auth/register]", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}

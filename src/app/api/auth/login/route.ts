// SafeSign — login email + password (rate-limited anti brute-force).
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSessionToken, verifyPassword, sessionCookieOptions, SESSION_COOKIE, sweepStaleIncognitoLogs } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const Schema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = rateLimit(`login:${ip}`, 10, 15 * 60_000);
    if (!rl.ok) {
      return NextResponse.json({ ok: false, error: "RATE_LIMITED", retryAfter: rl.retryAfter }, { status: 429 });
    }

    const parsed = Schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 });
    }
    const { email, password } = parsed.data;

    const u = await db.user.findUnique({ where: { email } });
    // Pesan error generik — jangan bocorkan apakah email terdaftar
    if (!u || !u.passwordHash) {
      return NextResponse.json({ ok: false, error: "WRONG_CREDENTIALS" }, { status: 401 });
    }

    const passwordOk = await verifyPassword(password, u.passwordHash);
    if (!passwordOk) {
      // Lockout berbasis DB — bekerja lintas instance serverless (in-memory limiter
      // hanya best-effort). 10x gagal → kunci akun 15 menit. Saat terkunci,
      // kegagalan baru TIDAK memperpanjang kunci (mencegah DoS permanen).
      const now = new Date();
      const isLocked = u.lockedUntil ? u.lockedUntil > now : false;
      if (!isLocked) {
        const fails = u.failedLogins + 1;
        if (fails >= 10) {
          await db.user.update({ where: { id: u.id }, data: { failedLogins: 0, lockedUntil: new Date(now.getTime() + 15 * 60_000) } });
        } else {
          await db.user.update({ where: { id: u.id }, data: { failedLogins: fails } });
        }
      }
      return NextResponse.json({ ok: false, error: "WRONG_CREDENTIALS" }, { status: 401 });
    }

    // Password benar tapi akun terkunci → tolak + beri tahu durasi tunggu.
    // (Penebak yang tidak tahu password tetap hanya melihat WRONG_CREDENTIALS —
    // tidak ada kebocoran info apakah akun terkunci/terdaftar.)
    if (u.lockedUntil && u.lockedUntil > new Date()) {
      const retryAfter = Math.ceil((u.lockedUntil.getTime() - Date.now()) / 60_000);
      return NextResponse.json({ ok: false, error: "ACCOUNT_LOCKED", retryAfter }, { status: 423 });
    }

    await db.user.update({ where: { id: u.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
    void sweepStaleIncognitoLogs();

    const token = await createSessionToken({ id: u.id, email: u.email, name: u.name, role: u.role, provider: u.provider });
    const res = NextResponse.json({
      ok: true,
      user: { id: u.id, name: u.name, email: u.email, role: u.role, provider: u.provider, incognito: false, image: u.image ?? null },
    });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}

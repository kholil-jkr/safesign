// SafeSign — ganti password (akun credentials). Akun Google tanpa password
// boleh menetapkan password pertama tanpa password lama.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser, hashPassword, verifyPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const Schema = z.object({
  currentPassword: z.string().max(200).optional(),
  newPassword: z.string().min(8).max(200),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "LOGIN_REQUIRED" }, { status: 401 });

  const rl = rateLimit(`chpw:${user.id}`, 5, 3_600_000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "RATE_LIMITED", retryAfter: rl.retryAfter }, { status: 429 });
  }

  try {
    const parsed = Schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "INVALID_INPUT" }, { status: 400 });
    }

    const u = await db.user.findUnique({ where: { id: user.id } });
    if (!u) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    // Akun credentials wajib password lama benar
    if (u.passwordHash) {
      const ok = parsed.data.currentPassword
        ? await verifyPassword(parsed.data.currentPassword, u.passwordHash)
        : false;
      if (!ok) return NextResponse.json({ ok: false, error: "WRONG_PASSWORD" }, { status: 401 });
    }

    await db.user.update({
      where: { id: u.id },
      data: { passwordHash: await hashPassword(parsed.data.newPassword) },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/change-password]", err);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}

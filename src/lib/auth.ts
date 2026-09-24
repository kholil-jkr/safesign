// SafeSign — autentikasi ringan berbasis JWT (jose) + bcrypt.
// Desain: login OPSIONAL (Analyzer tetap anonim), sesi cookie httpOnly,
// Mode Penyamaran = klaim `inc` di token (anti-manipulasi sisi klien).
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "safesign_session";
const SESSION_DAYS = 30;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string; // admin | legal | manager | staff | user
  provider: string; // credentials | google
  incognito: boolean;
  image: string | null;
};

function secretKey(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    // Fallback dev-only — produksi wajib AUTH_SECRET (divalidasi saat login)
    return new TextEncoder().encode("safesign-dev-secret-do-not-use-in-prod-000000");
  }
  return new TextEncoder().encode(s);
}

export function authSecretConfigured(): boolean {
  const s = process.env.AUTH_SECRET;
  return Boolean(s && s.length >= 32);
}

/* ── Password ─────────────────────────────────────────────────────────── */
export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 12);
}
export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

/* ── Sesi ─────────────────────────────────────────────────────────────── */
export async function createSessionToken(u: {
  id: string;
  email: string;
  name: string;
  role: string;
  provider: string;
  incognito?: boolean;
}): Promise<string> {
  return new SignJWT({
    email: u.email,
    name: u.name,
    role: u.role,
    provider: u.provider,
    inc: u.incognito ?? false,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(u.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  };
}

/** Ambil user sesi dari cookie (baca DB supaya role/nama selalu segar). */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secretKey());
    const uid = payload.sub;
    if (!uid) return null;
    const u = await db.user.findUnique({ where: { id: uid } });
    if (!u) return null;
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      provider: u.provider,
      incognito: payload.inc === true,
      image: u.image ?? null,
    };
  } catch {
    return null;
  }
}

/** Role yang boleh membuka modul Manajemen (organisasi). */
export function isManageRole(role: string): boolean {
  return role === "admin" || role === "legal" || role === "manager" || role === "staff";
}

/** Bersihkan riwayat Mode Penyamaran user (dipanggil saat logout). */
export async function purgeIncognitoLogs(userId: string): Promise<number> {
  const r = await db.analysisLog.deleteMany({ where: { userId, incognito: true } });
  return r.count;
}

/** Bersihkan riwayat penyamaran yang menggantung (>24 jam, sesi ditinggal). */
export async function sweepStaleIncognitoLogs(): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 3_600_000);
  try {
    await db.analysisLog.deleteMany({ where: { incognito: true, updatedAt: { lt: cutoff } } });
  } catch {
    // best-effort
  }
}

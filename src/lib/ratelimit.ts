// SafeSign — rate limiter sederhana in-memory (sliding window).
// Best-effort per instance serverless; cukup untuk memperlambat brute-force.
// Untuk proteksi kuat lintas instance, ganti dengan Upstash/TTL store.

type Bucket = number[]; // timestamps ms

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, arr] of buckets) {
    if (arr.length === 0 || now - arr[arr.length - 1] > 3_600_000) buckets.delete(k);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  sweep(now);
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    const retryAfter = Math.ceil((windowMs - (now - arr[0])) / 1000);
    buckets.set(key, arr);
    return { ok: false, retryAfter };
  }
  arr.push(now);
  buckets.set(key, arr);
  return { ok: true, retryAfter: 0 };
}

/** IP klien dari header proxy Vercel / fallback. */
export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

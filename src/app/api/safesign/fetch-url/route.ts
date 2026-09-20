// SafeSign — import a contract file from a URL (upload feature, "cloud" path).
// Supports direct file links plus Google Drive / Dropbox share links.
// Hardened against SSRF: only public http(s) hosts, manual redirect handling
// with per-hop validation, size cap and content-type whitelist.

import { NextRequest, NextResponse } from "next/server";
import { lookup } from "node:dns/promises";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_REDIRECTS = 4;
const HOP_TIMEOUT_MS = 20_000;

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function isPublicIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 172 && b >= 16 && b <= 31) return false; // private
  if (a === 192 && b === 168) return false; // private
  if (a === 169 && b === 254) return false; // link-local / cloud metadata
  if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT
  return true;
}

function isPublicIPv6(ip: string): boolean {
  const low = ip.toLowerCase();
  if (low === "::" || low === "::1") return false;
  if (low.startsWith("fc") || low.startsWith("fd")) return false; // ULA fc00::/7
  if (/^fe[89ab]/.test(low)) return false; // link-local fe80::/10
  const mapped = low.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) return isPublicIPv4(mapped[1]);
  return true;
}

async function isPublicHost(hostname: string): Promise<boolean> {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".localhost")) {
    return false;
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return isPublicIPv4(host);
  if (host.includes(":")) return isPublicIPv6(host);
  try {
    const addrs = await lookup(host, { all: true });
    if (addrs.length === 0) return false;
    return addrs.every((a) => (a.family === 4 ? isPublicIPv4(a.address) : isPublicIPv6(a.address)));
  } catch {
    return false;
  }
}

/** Convert common share-link forms (Google Drive, Dropbox) to direct-download URLs. */
function toDirectDownload(rawUrl: URL): URL {
  const host = rawUrl.hostname.toLowerCase();
  // Google Drive: /file/d/{id}/... or any path with ?id={id}
  if (host === "drive.google.com" || host === "docs.google.com") {
    const m = rawUrl.pathname.match(/\/file\/d\/([a-z0-9_-]+)/i) ?? rawUrl.searchParams.get("id");
    const id = typeof m === "string" ? m : m?.[1];
    if (id) {
      const u = new URL("https://drive.google.com/uc");
      u.searchParams.set("export", "download");
      u.searchParams.set("id", id);
      return u;
    }
  }
  // Dropbox: force dl=1
  if (host.endsWith("dropbox.com")) {
    const u = new URL(rawUrl.toString());
    u.searchParams.set("dl", "1");
    return u;
  }
  return rawUrl;
}

function mimeFromContentType(ct: string): string {
  return (ct || "").split(";")[0].trim().toLowerCase();
}

function fileNameFrom(url: URL, disposition: string | null): string {
  if (disposition) {
    const star = disposition.match(/filename\*=(?:UTF-8'')?([^;]+)/i);
    if (star) {
      try {
        return decodeURIComponent(star[1].replace(/["']/g, "").trim());
      } catch {
        /* ignore */
      }
    }
    const plain = disposition.match(/filename="?([^";]+)"?/i);
    if (plain) return plain[1].trim();
  }
  const last = url.pathname.split("/").filter(Boolean).pop();
  return last ? decodeURIComponent(last) : "contract";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { url?: string };
    const raw = (body.url ?? "").trim();
    if (!raw) {
      return NextResponse.json({ ok: false, error: "EMPTY" }, { status: 400 });
    }

    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      return NextResponse.json({ ok: false, error: "LINK_INVALID" }, { status: 400 });
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return NextResponse.json({ ok: false, error: "LINK_INVALID" }, { status: 400 });
    }

    url = toDirectDownload(url);

    // Manual redirect loop with per-hop SSRF validation
    let mimeType = "";
    let fileName = "";
    let bytes: Uint8Array | null = null;
    let current = url;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!(await isPublicHost(current.hostname))) {
        return NextResponse.json({ ok: false, error: "LINK_INVALID" }, { status: 400 });
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), HOP_TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch(current.toString(), {
          redirect: "manual",
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; SafeSign/1.0; +contract-checker)",
            Accept: "*/*",
          },
        });
      } catch {
        return NextResponse.json({ ok: false, error: "LINK_FAILED" }, { status: 502 });
      } finally {
        clearTimeout(timer);
      }

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) {
          return NextResponse.json({ ok: false, error: "LINK_FAILED" }, { status: 502 });
        }
        try {
          current = new URL(location, current); // relative redirects
        } catch {
          return NextResponse.json({ ok: false, error: "LINK_INVALID" }, { status: 400 });
        }
        continue;
      }
      if (!res.ok) {
        return NextResponse.json({ ok: false, error: "LINK_FAILED" }, { status: 502 });
      }

      mimeType = mimeFromContentType(res.headers.get("content-type") ?? "");
      // Some servers send generic octet-stream; fall back to the URL extension
      if (mimeType === "application/octet-stream" || mimeType === "") {
        const ext = (current.pathname.match(/\.[a-z0-9]+$/i)?.[0] ?? "").toLowerCase();
        const byExt: Record<string, string> = {
          ".pdf": "application/pdf",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".png": "image/png",
          ".webp": "image/webp",
          ".txt": "text/plain",
          ".md": "text/markdown",
          ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        };
        if (byExt[ext]) mimeType = byExt[ext];
      }

      if (mimeType.startsWith("text/html")) {
        // A share page or an interstitial instead of the file itself
        return NextResponse.json({ ok: false, error: "LINK_HTML" }, { status: 415 });
      }
      if (!ALLOWED_MIME.has(mimeType)) {
        return NextResponse.json({ ok: false, error: "LINK_INVALID_TYPE" }, { status: 415 });
      }

      const declared = Number(res.headers.get("content-length") ?? "0");
      if (declared && declared > MAX_BYTES) {
        return NextResponse.json({ ok: false, error: "TOO_LARGE" }, { status: 413 });
      }

      // Stream the body with a hard size cap
      const reader = res.body?.getReader();
      if (!reader) {
        return NextResponse.json({ ok: false, error: "LINK_FAILED" }, { status: 502 });
      }
      const chunks: Uint8Array[] = [];
      let received = 0;
      let tooLarge = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        if (received > MAX_BYTES) {
          tooLarge = true;
          break;
        }
        chunks.push(value);
      }
      if (tooLarge) {
        await reader.cancel().catch(() => undefined);
        return NextResponse.json({ ok: false, error: "TOO_LARGE" }, { status: 413 });
      }
      const total = chunks.reduce((n, c) => n + c.byteLength, 0);
      const merged = new Uint8Array(total);
      let offset = 0;
      for (const c of chunks) {
        merged.set(c, offset);
        offset += c.byteLength;
      }
      bytes = merged;
      fileName = fileNameFrom(current, res.headers.get("content-disposition"));
      break;
    }

    if (!bytes) {
      return NextResponse.json({ ok: false, error: "LINK_FAILED" }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      fileBase64: Buffer.from(bytes).toString("base64"),
      mimeType,
      fileName,
    });
  } catch (err) {
    console.error("[safesign/fetch-url] error:", err);
    return NextResponse.json({ ok: false, error: "LINK_FAILED" }, { status: 502 });
  }
}

// SafeSign — image OCR endpoint (upload feature).
// Receives a base64 image (photo of a contract, screenshot, rendered PDF page)
// and returns the transcribed text using the multimodal Workers AI model.
// The API key stays server-side (Brief §5).

import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { cfVisionTranscribe } from "@/lib/safesign/cloudflare-ai";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_IMAGE_BYTES = 12 * 1024 * 1024; // 12 MB decoded
const MAX_DIM = 2200; // safety re-encode limit for oversized/odd formats

const DIRECT_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { image?: string; mime?: string };
    const b64 = (body.image ?? "").replace(/^data:[^,]+,/, "").trim();
    const mime = (body.mime ?? "image/jpeg").toLowerCase();

    if (!b64) {
      return NextResponse.json({ ok: false, error: "EMPTY" }, { status: 400 });
    }
    const approxBytes = Math.floor((b64.length * 3) / 4);
    if (approxBytes > MAX_IMAGE_BYTES) {
      return NextResponse.json({ ok: false, error: "TOO_LARGE" }, { status: 413 });
    }

    const buffer = Buffer.from(b64, "base64");

    // Normalize: pass common formats straight through; convert anything else
    // (HEIC photos from iPhones, TIFF, AVIF…) to JPEG with sharp.
    let imageBase64 = b64;
    let outMime = mime;
    if (!DIRECT_MIMES.has(mime)) {
      try {
        const converted = await sharp(buffer)
          .rotate()
          .resize(MAX_DIM, MAX_DIM, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 0.88 })
          .toBuffer();
        imageBase64 = converted.toString("base64");
        outMime = "image/jpeg";
      } catch {
        return NextResponse.json({ ok: false, error: "UNSUPPORTED_FORMAT" }, { status: 415 });
      }
    }

    const text = await cfVisionTranscribe(imageBase64, outMime);
    return NextResponse.json({ ok: true, text });
  } catch (err) {
    console.error("[safesign/ocr] error:", err);
    const message = err instanceof Error ? err.message : "UNKNOWN";
    if (message === "NO_TEXT") {
      return NextResponse.json({ ok: false, error: "NO_TEXT" }, { status: 422 });
    }
    if (message === "MISSING_CREDENTIALS") {
      return NextResponse.json({ ok: false, error: "CONFIG" }, { status: 500 });
    }
    return NextResponse.json({ ok: false, error: "UPSTREAM" }, { status: 502 });
  }
}

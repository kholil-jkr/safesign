// SafeSign — document text extraction endpoint (upload feature).
// Accepts a DOCX (Word) or TXT file via FormData and returns its plain text.
// PDFs and images are handled client-side (pdf.js in the browser) so scanned
// pages can be rendered there; this route only covers formats the browser
// cannot read natively.

import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_RETURN_CHARS = 40_000;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "NO_FILE" }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ ok: false, error: "TOO_LARGE" }, { status: 413 });
    }

    const name = file.name.toLowerCase();
    const isDocx =
      name.endsWith(".docx") ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const isTxt =
      name.endsWith(".txt") ||
      name.endsWith(".md") ||
      file.type === "text/plain" ||
      file.type === "text/markdown";

    if (isDocx) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.extractRawText({ buffer });
      const text = (result?.value ?? "").trim();
      if (!text) {
        return NextResponse.json({ ok: false, error: "NO_TEXT" }, { status: 422 });
      }
      return NextResponse.json({ ok: true, text: text.slice(0, MAX_RETURN_CHARS) });
    }

    if (isTxt) {
      const text = (await file.text()).trim();
      if (!text) {
        return NextResponse.json({ ok: false, error: "NO_TEXT" }, { status: 422 });
      }
      return NextResponse.json({ ok: true, text: text.slice(0, MAX_RETURN_CHARS) });
    }

    return NextResponse.json({ ok: false, error: "UNSUPPORTED" }, { status: 415 });
  } catch (err) {
    console.error("[safesign/extract-file] error:", err);
    const message = err instanceof Error ? err.message : "UNKNOWN";
    if (message.includes("NO_TEXT")) {
      return NextResponse.json({ ok: false, error: "NO_TEXT" }, { status: 422 });
    }
    return NextResponse.json({ ok: false, error: "UPSTREAM" }, { status: 502 });
  }
}

// SafeSign — client-side extraction pipeline (upload feature).
// Photos & screenshots: downscale in the browser, then OCR server-side
// (multimodal model). PDFs: text-layer extraction with pdf.js in the browser;
// scanned pages are rendered to canvas and OCR-ed like photos. DOCX: parsed
// server-side with mammoth. Links: fetched server-side (SSRF-guarded).
//
// pdf.js is loaded at runtime from /pdfjs/ (self-hosted, no CDN) via a
// `new Function` dynamic import so the bundler never touches it.

export const MAX_UPLOAD_FILES = 12;
export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_PDF_PAGES = 30;
export const MAX_PDF_OCR_PAGES = 12;

const MAX_IMAGE_DIM = 2000;
const JPEG_QUALITY = 0.85;

export type FileKind = "image" | "pdf" | "docx" | "txt" | "unsupported";

export function classifyFile(file: File): FileKind {
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  if (type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp|heic|heif|tiff?|avif)$/.test(name)) {
    return "image";
  }
  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    return "docx";
  }
  if (type.startsWith("text/") || /\.(txt|md)$/.test(name)) return "txt";
  return "unsupported";
}

/* ------------------------------------------------------------------ */
/* base64 helpers                                                      */
/* ------------------------------------------------------------------ */

export function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

export function base64ToBytes(b64: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/* ------------------------------------------------------------------ */
/* image downscale (canvas)                                            */
/* ------------------------------------------------------------------ */

const CANVAS_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/avif"]);

/**
 * Downscale an image in the browser and return base64 JPEG (no data: prefix).
 * Falls back to the raw file bytes (server converts with sharp) when the
 * browser cannot decode the format (e.g. HEIC outside Safari).
 */
export async function downscaleImage(file: File): Promise<{ base64: string; mime: string }> {
  const type = (file.type || "").toLowerCase();
  if (CANVAS_MIMES.has(type) || type === "") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff"; // flatten transparency onto white for JPEG
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(bitmap, 0, 0, w, h);
        bitmap.close?.();
        const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        const base64 = dataUrl.split(",")[1] ?? "";
        if (base64) return { base64, mime: "image/jpeg" };
      }
      bitmap.close?.();
    } catch {
      // fall through to raw bytes
    }
  }
  const base64 = arrayBufferToBase64(await file.arrayBuffer());
  return { base64, mime: type || "application/octet-stream" };
}

/* ------------------------------------------------------------------ */
/* server API calls                                                    */
/* ------------------------------------------------------------------ */

/** Custom error codes surfaced to the UI. */
export class ExtractError extends Error {
  constructor(public code: "NO_TEXT" | "FAILED" | "TOO_LARGE" | "UNSUPPORTED" | "CONFIG") {
    super(code);
  }
}

export async function ocrImage(base64: string, mime: string): Promise<string> {
  let lastCode = "FAILED";
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch("/api/safesign/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mime }),
        signal: AbortSignal.timeout(120_000),
      });
      const data = (await res.json().catch(() => ({ ok: false, error: "FAILED" }))) as {
        ok?: boolean;
        text?: string;
        error?: string;
      };
      if (res.ok && data.ok && typeof data.text === "string") {
        return data.text;
      }
      lastCode = data.error ?? "FAILED";
      // Only retry on transient server errors
      if (res.status < 500 && lastCode !== "UPSTREAM") break;
    } catch {
      lastCode = "FAILED";
    }
    if (attempt === 0) await new Promise((r) => setTimeout(r, 1500));
  }
  throw new ExtractError(mapError(lastCode));
}

function mapError(e: string): "NO_TEXT" | "FAILED" | "TOO_LARGE" | "UNSUPPORTED" | "CONFIG" {
  if (e === "NO_TEXT") return "NO_TEXT";
  if (e === "TOO_LARGE") return "TOO_LARGE";
  if (e === "UNSUPPORTED_FORMAT" || e === "EMPTY") return "UNSUPPORTED";
  if (e === "CONFIG") return "CONFIG";
  return "FAILED";
}

export async function extractDocxText(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  try {
    const res = await fetch("/api/safesign/extract-file", {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(60_000),
    });
    const data = (await res.json().catch(() => ({ ok: false, error: "FAILED" }))) as {
      ok?: boolean;
      text?: string;
      error?: string;
    };
    if (res.ok && data.ok && typeof data.text === "string") return data.text;
    throw new ExtractError(mapError(data.error ?? "FAILED"));
  } catch (err) {
    if (err instanceof ExtractError) throw err;
    throw new ExtractError("FAILED");
  }
}

export interface FetchedUrlFile {
  file: File;
}

export async function fetchUrlFile(url: string): Promise<FetchedUrlFile> {
  let data: {
    ok?: boolean;
    fileBase64?: string;
    mimeType?: string;
    fileName?: string;
    error?: string;
  };
  try {
    const res = await fetch("/api/safesign/fetch-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(90_000),
    });
    data = await res.json();
  } catch {
    throw new ExtractError("FAILED");
  }
  if (data?.ok && data.fileBase64 && data.mimeType) {
    const bytes = base64ToBytes(data.fileBase64);
    const file = new File([bytes], data.fileName || "contract", { type: data.mimeType });
    return { file };
  }
  const code = data?.error ?? "LINK_FAILED";
  if (code === "TOO_LARGE") throw new ExtractError("TOO_LARGE");
  if (code === "LINK_INVALID_TYPE" || code === "LINK_HTML") throw new ExtractError("UNSUPPORTED");
  if (code === "LINK_INVALID") throw new ExtractError("FAILED");
  throw new ExtractError("FAILED");
}

/* ------------------------------------------------------------------ */
/* pdf.js runtime loading (self-hosted, bundler-free)                  */
/* ------------------------------------------------------------------ */

let pdfjsPromise: Promise<any> | null = null;

function loadPdfjs(): Promise<any> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      // `new Function` keeps webpack/turbopack from touching this import —
      // the module is served straight from /public/pdfjs/.
      const dynamicImport = new Function("u", "return import(u)") as (u: string) => Promise<any>;
      const pdfjs = await dynamicImport("/pdfjs/pdf.min.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
      return pdfjs;
    })().catch((err) => {
      pdfjsPromise = null; // allow retry on next upload
      throw err;
    });
  }
  return pdfjsPromise;
}

export interface PdfExtractResult {
  parts: string[];
  ocrPages: number;
  truncated: boolean;
  totalPages: number;
}

/**
 * Extract text from a PDF in the browser. Pages with a text layer are read
 * directly; scanned pages are rendered to canvas and OCR-ed via ocrPage().
 */
export async function extractPdfText(
  file: File,
  opts: {
    ocrPage: (base64: string) => Promise<string>;
    onProgress?: (done: number, total: number) => void;
  }
): Promise<PdfExtractResult> {
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;
  const total = Math.min(doc.numPages, MAX_PDF_PAGES);
  const parts: string[] = [];
  let ocrPages = 0;
  let truncated = false;

  for (let p = 1; p <= total; p++) {
    const page = await doc.getPage(p);
    let text = "";
    try {
      const tc = await page.getTextContent();
      // hasEOL keeps the original line structure
      text = tc.items
        .map((it: any) => (typeof it.str === "string" ? it.str + (it.hasEOL ? "\n" : "") : ""))
        .join("")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
    } catch {
      text = "";
    }

    if (text.length >= 60) {
      parts.push(text);
    } else if (ocrPages < MAX_PDF_OCR_PAGES) {
      // Scanned page: render → JPEG → OCR
      ocrPages++;
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(2.4, Math.max(1.5, 1500 / Math.max(base.width, base.height)));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
        const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        const base64 = dataUrl.split(",")[1] ?? "";
        try {
          parts.push(await opts.ocrPage(base64));
        } catch {
          parts.push(""); // keep page order; page simply unreadable
        }
      }
    } else {
      truncated = true;
    }

    page.cleanup?.();
    opts.onProgress?.(p, total);
  }

  await doc.destroy?.();
  return { parts, ocrPages, truncated, totalPages: doc.numPages };
}

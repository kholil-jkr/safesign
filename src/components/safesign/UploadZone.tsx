"use client";

// SafeSign — contract upload zone (camera / photos / files / drag & drop /
// clipboard paste / link import). Extracts text via the client pipeline
// (src/lib/safesign/extract.ts) and hands it to the parent page, which puts
// it into the editable textarea so the user can review before analysing.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  FileUp,
  Images,
  Link2,
  Loader2,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/lib/safesign/i18n/dictionary";
import {
  ExtractError,
  MAX_FILE_BYTES,
  MAX_UPLOAD_FILES,
  classifyFile,
  downscaleImage,
  extractDocxText,
  extractPdfText,
  fetchUrlFile,
  ocrImage,
} from "@/lib/safesign/extract";

type ErrorKey =
  | "failed"
  | "noText"
  | "unsupported"
  | "tooLarge"
  | "tooMany"
  | "linkInvalid"
  | "linkFailed";

export interface UploadZoneProps {
  dict: Dictionary;
  disabled?: boolean;
  onExtracted: (text: string, info: { pages: number; truncated: boolean }) => void;
}

export function UploadZone({ dict, disabled = false, onExtracted }: UploadZoneProps) {
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null);
  const [progressLabel, setProgressLabel] = useState("");
  const [progressPage, setProgressPage] = useState("");
  const [doneInfo, setDoneInfo] = useState<{ pages: number; truncated: boolean } | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);

  const errorMessages: Record<ErrorKey, string> = {
    failed: dict.uploadFailed,
    noText: dict.ocrNoText,
    unsupported: dict.uploadUnsupported,
    tooLarge: dict.uploadTooLarge,
    tooMany: dict.uploadTooMany.replace("{n}", String(MAX_UPLOAD_FILES)),
    linkInvalid: dict.linkInvalid,
    linkFailed: dict.linkFailed,
  };

  const mapExtractError = (err: unknown): ErrorKey => {
    if (err instanceof ExtractError) {
      if (err.code === "NO_TEXT") return "noText";
      if (err.code === "TOO_LARGE") return "tooLarge";
      if (err.code === "UNSUPPORTED") return "unsupported";
    }
    return "failed";
  };

  const setBusyState = (value: boolean, label = "", page = "") => {
    busyRef.current = value;
    setBusy(value);
    setProgressLabel(label);
    setProgressPage(page);
  };

  const processFiles = useCallback(
    async (fileList: File[]) => {
      if (busyRef.current || fileList.length === 0) return;

      setErrorKey(null);
      setDoneInfo(null);

      if (fileList.length > MAX_UPLOAD_FILES) {
        setErrorKey("tooMany");
        return;
      }
      const kinds = fileList.map((f) => ({ file: f, kind: classifyFile(f) }));
      if (kinds.some((k) => k.file.size > MAX_FILE_BYTES)) {
        setErrorKey("tooLarge");
        return;
      }
      if (kinds.length > 0 && kinds.every((k) => k.kind === "unsupported")) {
        setErrorKey("unsupported");
        return;
      }
      const unsupportedNames = kinds.filter((k) => k.kind === "unsupported");
      const usable = kinds.filter((k) => k.kind !== "unsupported");

      setBusyState(true, usable.length === 1 ? dict.readingFile.replace("{name}", usable[0].file.name) : dict.readingFile.replace("{name}", `${usable.length}`));

      const parts: string[] = [];
      let pagesOk = 0;
      let truncated = false;
      let sawNoText = false;
      let sawFailure = false;

      try {
        for (const { file, kind } of usable) {
          setBusyState(true, dict.readingFile.replace("{name}", file.name));
          if (kind === "image") {
            const { base64, mime } = await downscaleImage(file);
            const text = await ocrImage(base64, mime);
            parts.push(text);
            pagesOk++;
          } else if (kind === "pdf") {
            const result = await extractPdfText(file, {
              ocrPage: (b64) => ocrImage(b64, "image/jpeg"),
              onProgress: (done, total) => {
                setBusyState(
                  true,
                  dict.readingFile.replace("{name}", file.name),
                  dict.readingProgress.replace("{n}", String(done)).replace("{m}", String(total))
                );
              },
            });
            for (const part of result.parts) {
              if (part.trim()) {
                parts.push(part);
                pagesOk++;
              }
            }
            truncated = truncated || result.truncated;
          } else if (kind === "docx") {
            const text = await extractDocxText(file);
            parts.push(text);
            pagesOk++;
          } else if (kind === "txt") {
            const text = (await file.text()).trim();
            if (text) {
              parts.push(text);
              pagesOk++;
            }
          }
        }
      } catch (err) {
        sawFailure = true;
        if (err instanceof ExtractError && err.code === "NO_TEXT") {
          sawNoText = true;
        }
      } finally {
        setBusyState(false);
      }

      if (parts.length === 0) {
        setErrorKey(sawNoText ? "noText" : "failed");
        return;
      }

      const joined = parts.filter((p) => p.trim()).join("\n\n");
      setDoneInfo({ pages: pagesOk, truncated });
      onExtracted(joined, { pages: pagesOk, truncated });

      if (sawFailure) {
        setErrorKey("failed");
      } else if (unsupportedNames.length > 0) {
        setErrorKey("unsupported");
      }
    },
    [dict, onExtracted]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      e.target.value = ""; // allow re-selecting the same file
      void processFiles(files);
    },
    [processFiles]
  );

  // Clipboard paste (screenshots) — listen while enabled & idle
  useEffect(() => {
    if (disabled) return;
    const onPaste = (e: ClipboardEvent) => {
      if (busyRef.current) return;
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => classifyFile(f) !== "unsupported");
      if (files.length > 0) {
        e.preventDefault();
        void processFiles(files);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [disabled, processFiles]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled || busyRef.current) return;
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length > 0) void processFiles(files);
    },
    [disabled, processFiles]
  );

  const handleLinkImport = useCallback(async () => {
    const url = linkUrl.trim();
    if (!url || linkBusy || busyRef.current) return;
    setLinkBusy(true);
    setErrorKey(null);
    setDoneInfo(null);
    try {
      const { file } = await fetchUrlFile(url);
      await processFiles([file]);
      setLinkUrl("");
      setLinkOpen(false);
    } catch (err) {
      if (err instanceof ExtractError) {
        setErrorKey(
          err.code === "TOO_LARGE"
            ? "tooLarge"
            : err.code === "UNSUPPORTED"
              ? "linkInvalid"
              : "linkFailed"
        );
      } else {
        setErrorKey("linkFailed");
      }
    } finally {
      setLinkBusy(false);
    }
  }, [linkUrl, linkBusy, processFiles]);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled && !busy) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={[
        "rounded-2xl border-2 border-dashed p-4 transition-colors sm:p-5",
        dragging
          ? "border-teal-600 bg-teal-100/60"
          : "border-teal-300 bg-teal-50/40",
        disabled ? "opacity-60" : "",
      ].join(" ")}
    >
      <p className="flex items-center gap-2 text-sm font-bold text-teal-900">
        <FileUp className="h-4 w-4 shrink-0" aria-hidden="true" />
        {dict.uploadTitle}
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2.5">
        <Button
          type="button"
          variant="outline"
          disabled={disabled || busy}
          onClick={() => cameraInputRef.current?.click()}
          className="h-16 flex-col gap-1 rounded-xl border-teal-200 bg-white text-teal-900 hover:bg-teal-50 hover:text-teal-800"
        >
          <Camera className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs font-semibold sm:text-sm">{dict.uploadCamera}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || busy}
          onClick={() => photoInputRef.current?.click()}
          className="h-16 flex-col gap-1 rounded-xl border-teal-200 bg-white text-teal-900 hover:bg-teal-50 hover:text-teal-800"
        >
          <Images className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs font-semibold sm:text-sm">{dict.uploadPhoto}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || busy}
          onClick={() => fileInputRef.current?.click()}
          className="h-16 flex-col gap-1 rounded-xl border-teal-200 bg-white text-teal-900 hover:bg-teal-50 hover:text-teal-800"
        >
          <FileUp className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs font-semibold sm:text-sm">{dict.uploadFile}</span>
        </Button>
      </div>

      <p className="mt-2.5 text-xs leading-relaxed text-slate-500">{dict.uploadFormatsHint}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{dict.uploadCloudHint}</p>

      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => setLinkOpen((v) => !v)}
        className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 underline-offset-2 hover:underline disabled:opacity-50"
      >
        <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
        {dict.uploadFromLink}
      </button>

      {linkOpen ? (
        <div className="mt-2 flex gap-2">
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleLinkImport();
              }
            }}
            placeholder={dict.linkPlaceholder}
            disabled={disabled || busy || linkBusy}
            inputMode="url"
            className="h-11 rounded-xl border-slate-300 bg-white text-sm shadow-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
          />
          <Button
            type="button"
            onClick={() => void handleLinkImport()}
            disabled={disabled || busy || linkBusy || !linkUrl.trim()}
            className="h-11 shrink-0 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
          >
            {linkBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : dict.linkImport}
          </Button>
        </div>
      ) : null}

      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleInputChange}
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleInputChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md,image/*"
        multiple
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleInputChange}
      />

      {/* Progress */}
      {busy ? (
        <div
          role="status"
          className="mt-3 flex items-center gap-3 rounded-xl border border-teal-200 bg-white p-3.5"
        >
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-teal-700" aria-hidden="true" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{progressLabel}</p>
            {progressPage ? (
              <p className="mt-0.5 text-xs text-slate-500">{progressPage}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Success */}
      {doneInfo && !busy ? (
        <div
          role="status"
          className="mt-3 flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 p-3.5"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
          <div className="min-w-0 text-sm leading-relaxed text-teal-900">
            <p className="font-semibold">
              {dict.extractDone.replace("{n}", String(doneInfo.pages))}
            </p>
            {doneInfo.truncated ? (
              <p className="mt-1 text-xs text-teal-800">{dict.extractPartial.replace("{n}", "12")}</p>
            ) : null}
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-teal-700">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {dict.uploadPrivacy}
            </p>
          </div>
        </div>
      ) : null}

      {/* Error */}
      {errorKey && !busy ? (
        <div
          role="alert"
          className="mt-3 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5"
        >
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-red-800">{errorMessages[errorKey]}</p>
        </div>
      ) : null}
    </div>
  );
}

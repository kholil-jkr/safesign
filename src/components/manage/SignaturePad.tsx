// SafeSign Manajemen — e-signature pad: draw with mouse/touch or type name
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface SignatureResult {
  signerName: string;
  signerRole: string;
  signatureData: string; // data URL PNG
  typedName: string | null;
}

export function SignaturePad({ signerName, onDone, busy }: {
  signerName: string;
  onDone: (result: SignatureResult) => void;
  busy?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState(signerName);
  const [fontStyle, setFontStyle] = useState<"script" | "print">("script");

  // HiDPI-aware canvas setup
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
    // guide line
    ctx.save();
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(24, rect.height - 28);
    ctx.lineTo(rect.width - 24, rect.height - 28);
    ctx.stroke();
    ctx.restore();
  }, []);

  useEffect(() => {
    setupCanvas();
    const onResize = () => {
      const hadInk = hasInk;
      setupCanvas();
      if (hadInk) setHasInk(false); // resize clears ink; require redraw
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [setupCanvas, hasInk]);

  const getPoint = (e: PointerEvent | React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== "draw") return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    canvas.setPointerCapture(e.pointerId);
    drawing.current = true;
    lastPoint.current = getPoint(e);
  };

  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || mode !== "draw") return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !lastPoint.current) return;
    const p = getPoint(e);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPoint.current = p;
    if (!hasInk) setHasInk(true);
  };

  const endDraw = () => {
    drawing.current = false;
    lastPoint.current = null;
  };

  const clear = () => {
    setupCanvas();
    setHasInk(false);
  };

  /** Renders the typed name onto the canvas in a handwriting-like style. */
  const renderTyped = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    setupCanvas();
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    if (!ctx) return null;
    ctx.fillStyle = "#0f172a";
    const name = typedName.trim() || "Tanda Tangan";
    let size = 40;
    do {
      ctx.font = `${fontStyle === "script" ? "italic " : ""}${size}px "Segoe Script", "Brush Script MT", cursive`;
      size -= 2;
    } while (ctx.measureText(name).width > rect.width - 48 && size > 14);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, rect.width / 2, rect.height / 2 - 8);
    setHasInk(true);
    return true;
  }, [setupCanvas, typedName, fontStyle]);

  const handleSubmit = () => {
    if (!signerName.trim()) return;
    if (mode === "draw" && !hasInk) return;
    let dataUrl = "";
    if (mode === "draw") {
      const canvas = canvasRef.current!;
      // strip the dashed guide line by cropping the area above it
      dataUrl = cropGuide(canvas);
    } else {
      const ok = renderTyped();
      if (!ok) return;
      const canvas = canvasRef.current!;
      dataUrl = cropGuide(canvas);
    }
    if (!dataUrl) return;
    onDone({
      signerName: signerName.trim(),
      signerRole: "party_b",
      signatureData: dataUrl,
      typedName: mode === "type" ? typedName.trim() : null,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={mode === "draw" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setMode("draw");
            clear();
          }}
          className={cn("h-9 rounded-xl text-xs font-bold", mode === "draw" && "bg-teal-700 hover:bg-teal-800")}
        >
          <PenTool className="h-3.5 w-3.5" aria-hidden="true" />
          Gambar TTD
        </Button>
        <Button
          type="button"
          variant={mode === "type" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setMode("type");
            clear();
          }}
          className={cn("h-9 rounded-xl text-xs font-bold", mode === "type" && "bg-teal-700 hover:bg-teal-800")}
        >
          Ketik Nama
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clear}
          className="ml-auto h-9 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
        >
          <Eraser className="h-3.5 w-3.5" aria-hidden="true" />
          Hapus
        </Button>
      </div>

      {mode === "type" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <Label htmlFor="sig-typed" className="text-xs font-semibold text-slate-600">
              Nama yang akan dirender
            </Label>
            <Input
              id="sig-typed"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value.slice(0, 60))}
              className="mt-1 h-10 rounded-xl"
              placeholder="Nama lengkap"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-600">Gaya tulisan</Label>
            <div className="mt-1 flex gap-2">
              <Button
                type="button"
                variant={fontStyle === "script" ? "default" : "outline"}
                size="sm"
                onClick={() => setFontStyle("script")}
                className={cn("h-10 flex-1 rounded-xl text-xs font-bold", fontStyle === "script" && "bg-teal-700 hover:bg-teal-800")}
              >
                Kursif
              </Button>
              <Button
                type="button"
                variant={fontStyle === "print" ? "default" : "outline"}
                size="sm"
                onClick={() => setFontStyle("print")}
                className={cn("h-10 flex-1 rounded-xl text-xs font-bold", fontStyle === "print" && "bg-teal-700 hover:bg-teal-800")}
              >
                Tebal
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-2">
        <canvas
          ref={canvasRef}
          className="h-40 w-full touch-none rounded-xl bg-white"
          onPointerDown={startDraw}
          onPointerMove={moveDraw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
          role="img"
          aria-label="Area tanda tangan digital"
        />
        {mode === "draw" && !hasInk ? (
          <p className="pb-1 text-center text-xs text-slate-400">
            Tanda tangan di area atas menggunakan mouse atau sentuhan
          </p>
        ) : null}
      </div>

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={busy || !signerName.trim() || (mode === "draw" && !hasInk)}
        className="h-11 w-full rounded-xl bg-teal-700 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50"
      >
        {busy ? "Menyimpan…" : "Simpan Tanda Tangan Digital"}
      </Button>
    </div>
  );
}

/** Crops the dashed guide line from the bottom of the signature canvas. */
function cropGuide(canvas: HTMLCanvasElement): string {
  try {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width;
    const h = Math.max(1, Math.round((canvas.getBoundingClientRect().height - 32) * dpr));
    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const ctx = out.getContext("2d");
    if (!ctx) return canvas.toDataURL("image/png");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(canvas, 0, 0);
    return out.toDataURL("image/png");
  } catch {
    return canvas.toDataURL("image/png");
  }
}

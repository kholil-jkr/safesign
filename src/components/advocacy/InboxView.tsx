"use client";

// SafeSign Advokasi — Kotak Masuk email (status kiriman + balasan lembaga).
// Semua email advokasi user dalam satu tampilan; balasan yang masuk via
// webhook ditampilkan lengkap, dan laporan otomatis juga dikirim ke email asli.
import { useCallback, useEffect, useState } from "react";
import { Inbox, Loader2, Mail, MailCheck, MailOpen, RefreshCw, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MessageItem = {
  id: string;
  caseId: string;
  caseNumber: string;
  caseTitle: string;
  caseStatus: string;
  institution: string;
  institutionEmail: string | null;
  type: string; // initial | followup
  subject: string;
  status: string; // sent | replied (draft tidak tampil di sini)
  sentAt: string | null;
  repliedAt: string | null;
  replyFrom: string | null;
  replyText: string | null;
  createdAt: string;
};

const STATUS_META: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
  sent: { label: "Terkirim — menunggu balasan", cls: "bg-amber-100 text-amber-800", Icon: MailCheck },
  replied: { label: "Ada balasan", cls: "bg-teal-100 text-teal-800", Icon: Reply },
};

function fmtDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export function InboxView() {
  const [items, setItems] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/messages", { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; items?: MessageItem[] };
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    // polling ringan: cek balasan baru tiap 60 detik
    const t = setInterval(() => void load(), 60_000);
    return () => clearInterval(t);
  }, [load]);

  const replies = items.filter((i) => i.status === "replied").length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Kotak Masuk</h1>
          <p className="mt-1 text-sm text-slate-500">
            Status email advokasi Anda — {items.length} email, {replies} balasan diterima.
            Balasan juga otomatis diteruskan ke email asli Anda.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void load()}
          disabled={loading}
          className="h-10 rounded-xl border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
          Muat ulang
        </Button>
      </div>

      {loading && items.length === 0 ? (
        <div className="mt-16 flex items-center justify-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="text-sm">Memuat kotak masuk…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-16 text-center">
          <Inbox className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-slate-700">Belum ada email</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
            Email yang Anda kirim melalui wizard Advokasi akan tampil di sini beserta
            status balasannya. Buat laporan pertama Anda untuk memulai.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((m) => {
            const meta = STATUS_META[m.status] ?? STATUS_META.sent;
            const MetaIcon = meta.Icon;
            const open = openId === m.id;
            return (
              <li key={m.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <button
                  onClick={() => setOpenId(open ? null : m.id)}
                  className="flex w-full items-start gap-3 p-4 text-left hover:bg-slate-50"
                  aria-expanded={open}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      m.status === "replied" ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700"
                    )}
                    aria-hidden="true"
                  >
                    {m.status === "replied" ? <MailOpen className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-bold text-slate-900">{m.subject}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", meta.cls)}>
                        <MetaIcon className="mr-1 inline h-3 w-3" aria-hidden="true" />
                        {meta.label}
                      </span>
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      Ke: {m.institution} {m.institutionEmail ? `(${m.institutionEmail})` : ""} · Kasus {m.caseNumber}
                      {m.type === "followup" ? " · Tindak lanjut" : ""}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-slate-400">
                      Dikirim: {fmtDate(m.sentAt)}
                      {m.repliedAt ? ` · Balasan: ${fmtDate(m.repliedAt)}` : ""}
                    </span>
                  </span>
                </button>

                {open ? (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-4">
                    {m.status === "replied" && m.replyText ? (
                      <div>
                        <p className="text-xs font-bold text-slate-700">
                          Balasan dari {m.replyFrom ?? "lembaga"}:
                        </p>
                        <div className="mt-2 whitespace-pre-wrap rounded-xl border border-teal-200 bg-white p-3.5 text-sm leading-relaxed text-slate-700">
                          {m.replyText}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">
                        Menunggu balasan dari {m.institution}. Balasan akan muncul di sini dan
                        diteruskan otomatis ke email Anda.
                      </p>
                    )}
                    <p className="mt-3 text-[11px] text-slate-400">
                      Kasus terkait: {m.caseTitle} · Buka menu "Kasus Saya" untuk linimasa lengkap.
                    </p>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

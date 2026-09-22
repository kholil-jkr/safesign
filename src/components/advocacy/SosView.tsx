// SafeSign Advokasi — SOS Darurat: hotline 24 jam Indonesia, nomor darurat lokal
// per negara penempatan, langkah aman, dan ceklis persiapan.
"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Megaphone,
  MessageCircle,
  Phone,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RIGHTS_COUNTRIES, SOS_CHECKLIST, SOS_INDONESIA, SOS_STEPS } from "@/lib/advocacy/rights";
import { useAdvocacy } from "@/lib/advocacy/store";

export function SosView() {
  const startNewCase = useAdvocacy((s) => s.startNewCase);

  return (
    <section aria-label="SOS darurat pekerja migran" className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white">
            <ShieldAlert className="h-7 w-7" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-red-900">SOS — Bantuan Darurat</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-red-800">
              Untuk keadaan darurat (kekerasan, ancaman, bahaya fisik). Prioritas utama: pastikan Anda aman, lalu
              hubungi hotline 24 jam di bawah ini. Semua layanan gratis.
            </p>
          </div>
        </div>
      </div>

      {/* Langkah aman */}
      <ol className="grid gap-3 sm:grid-cols-2">
        {SOS_STEPS.map((s, i) => (
          <li key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-slate-900">{s.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.desc}</p>
          </li>
        ))}
      </ol>

      {/* Hotline Indonesia */}
      <div>
        <h2 className="text-base font-extrabold text-slate-900">Hotline Indonesia — 24 Jam</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {SOS_INDONESIA.map((h) => (
            <a
              key={h.href}
              href={h.href}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-4 rounded-2xl border-2 border-teal-200 bg-white p-5 shadow-sm transition-all hover:border-teal-600 hover:shadow-md"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-700 text-white transition-transform group-hover:scale-110">
                {h.icon === "phone" ? <Phone className="h-6 w-6" aria-hidden="true" /> : <MessageCircle className="h-6 w-6" aria-hidden="true" />}
              </span>
              <span>
                <span className="block text-sm font-extrabold text-slate-900">{h.label}</span>
                <span className="mt-0.5 block text-sm text-teal-700">{h.detail}</span>
              </span>
            </a>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Nomor dapat berubah — verifikasi di bp2mi.go.id dan kemlu.go.id.
        </p>
      </div>

      {/* Nomor darurat lokal per negara */}
      <div>
        <h2 className="text-base font-extrabold text-slate-900">Nomor Penting di Negara Penempatan</h2>
        <p className="mt-0.5 text-sm text-slate-500">Polisi / ambulans / hotline pekerja migran setempat.</p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {RIGHTS_COUNTRIES.map((c) => (
            <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-extrabold text-slate-900">{c.name}</p>
              <ul className="mt-2 space-y-1">
                {c.hotlines.map((h, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="text-slate-500">{h.label}</span>
                    <a
                      href={`tel:${h.value.replace(/[^+\d]/g, "")}`}
                      className="font-mono font-bold text-teal-700 hover:underline"
                    >
                      {h.value}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Ceklis persiapan */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
          <ClipboardList className="h-5 w-5 text-teal-700" aria-hidden="true" />
          Siapkan Sebelum Menelepon
        </h2>
        <p className="mt-1 text-sm text-slate-500">Petugas akan menanyakan informasi ini — siapkan agar panggilan lebih cepat ditindaklanjuti.</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {SOS_CHECKLIST.map((item, i) => (
            <li key={i} className="flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA laporan terdokumentasi */}
      <div className="rounded-2xl border-2 border-teal-200 bg-teal-50 p-6 text-center">
        <p className="flex items-center justify-center gap-2 text-base font-extrabold text-teal-900">
          <Megaphone className="h-5 w-5" aria-hidden="true" />
          Situasi sudah aman / tidak darurat?
        </p>
        <p className="mx-auto mt-1.5 max-w-xl text-sm leading-relaxed text-teal-800">
          Buat laporan terdokumentasi — AI akan menyusun email resmi ke lembaga yang berwenang, lengkap dengan
          terjemahan, dan membantu memantau tindak lanjutnya.
        </p>
        <Button onClick={() => startNewCase()} className="mt-4 gap-2 bg-teal-700 hover:bg-teal-800" size="lg">
          <Megaphone className="h-4 w-4" aria-hidden="true" />
          Buat Laporan Advokasi
        </Button>
      </div>

      <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-relaxed text-red-800" role="note">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        SafeSign adalah alat bantu, bukan layanan darurat. Dalam situasi mengancam nyawa, hubungi nomor darurat
        lokal setempat terlebih dahulu.
      </p>
    </section>
  );
}

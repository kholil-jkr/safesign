// SafeSign Advokasi — application shell: sidebar, module switcher, dan router
// view (kasus / buat laporan / lembaga / panduan hak / SOS / kotak masuk).
// Kasus & laporan bersifat PRIBADI — wajib login. Direktori, panduan, dan SOS
// tetap terbuka untuk semua orang (SOS = fitur keselamatan, tidak boleh digerbang).
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  Briefcase,
  Building2,
  FilePlus2,
  Inbox,
  LogIn,
  Megaphone,
  Menu,
  ScanSearch,
  ShieldCheck,
  Siren,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAdvocacy, type AdvocacyView } from "@/lib/advocacy/store";
import { useAuth } from "@/lib/auth-store";
import { CasesView } from "./CasesView";
import { CaseDetailView } from "./CaseDetailView";
import { NewCaseView } from "./NewCaseView";
import { InstitutionsView } from "./InstitutionsView";
import { RightsView } from "./RightsView";
import { SosView } from "./SosView";
import { InboxView } from "./InboxView";

const NAV: { id: AdvocacyView; label: string; icon: React.ElementType; danger?: boolean; loginRequired?: boolean }[] = [
  { id: "cases", label: "Kasus Saya", icon: Briefcase, loginRequired: true },
  { id: "new", label: "Buat Laporan", icon: FilePlus2, loginRequired: true },
  { id: "inbox", label: "Kotak Masuk", icon: Inbox, loginRequired: true },
  { id: "institutions", label: "Direktori Lembaga", icon: Building2 },
  { id: "rights", label: "Panduan Hak", icon: BookOpen },
  { id: "sos", label: "SOS Darurat", icon: Siren, danger: true },
];

function NavList({ view, onNavigate }: { view: AdvocacyView; onNavigate: (v: AdvocacyView) => void }) {
  const authUser = useAuth((s) => s.user);
  return (
    <nav aria-label="Navigasi advokasi" className="flex flex-col gap-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = view === item.id;
        const locked = item.loginRequired && !authUser;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-colors",
              active
                ? item.danger
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-teal-700 text-white shadow-sm"
                : item.danger
                  ? "text-red-300 hover:bg-red-600/20 hover:text-red-200"
                  : "text-slate-100/80 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon className={cn("h-4.5 w-4.5 shrink-0", !active && item.danger && "text-red-400")} aria-hidden="true" />
            <span className="flex-1">{item.label}</span>
            {locked ? <LockBadge /> : null}
          </button>
        );
      })}
    </nav>
  );
}

function LockBadge() {
  return (
    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-300" title="Perlu masuk">
      Masuk
    </span>
  );
}

/** Gerbang login untuk view privat (kasus/laporan/kotak masuk). */
function LoginGate({ title, desc }: { title: string; desc: string }) {
  const openDialog = useAuth((s) => s.openDialog);
  return (
    <div className="mx-auto mt-10 max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700">
        <ShieldCheck className="h-7 w-7 text-white" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-extrabold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
      <Button
        onClick={openDialog}
        className="mt-5 h-12 w-full rounded-xl bg-teal-700 text-base font-bold text-white hover:bg-teal-800"
      >
        <LogIn className="h-5 w-5" aria-hidden="true" />
        Masuk / Daftar
      </Button>
      <p className="mt-3 text-xs leading-relaxed text-slate-400">
        Kasus Anda terikat akun — hanya Anda yang bisa melihatnya. Analizer tetap bisa
        dipakai tanpa akun.
      </p>
    </div>
  );
}

export function AdvocacyApp({
  onOpenAnalyzer,
  onOpenContract,
}: {
  onOpenAnalyzer: () => void;
  onOpenContract: (contractId: string) => void;
}) {
  const { view, setView, selectedCaseId } = useAdvocacy();
  const authUser = useAuth((s) => s.user);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Navigasi "Kotak Masuk" dari widget akun (event lintas modul)
  useEffect(() => {
    const onView = (e: Event) => {
      const detail = (e as CustomEvent<{ view: string }>).detail;
      if (detail?.view === "inbox") setView("inbox");
    };
    window.addEventListener("safesign:advocacy-view", onView);
    return () => window.removeEventListener("safesign:advocacy-view", onView);
  }, [setView]);

  const handleNav = useCallback(
    (v: AdvocacyView) => {
      setView(v);
      setDrawerOpen(false); // tutup drawer mobile setelah memilih menu
    },
    [setView]
  );

  const privateView = view === "cases" || view === "new" || view === "inbox";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900 text-white">
        <div className="flex h-16 items-center gap-3 px-4">
          {/* mobile menu */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 hover:text-white lg:hidden"
                aria-label="Buka menu navigasi"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-slate-800 bg-slate-900 p-0 text-white">
              <SheetTitle className="sr-only">Menu navigasi advokasi</SheetTitle>
              <SheetDescription className="sr-only">
                Pilih menu: kasus, buat laporan, kotak masuk, direktori lembaga, panduan hak, atau SOS darurat.
              </SheetDescription>
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-2.5 border-b border-slate-800 px-5 py-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700">
                    <Megaphone className="h-5 w-5 text-white" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-base font-extrabold leading-tight">SafeSign</p>
                    <p className="text-xs text-teal-300">Advokasi & Perlindungan</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  <NavList view={view} onNavigate={handleNav} />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 items-center gap-2.5">
            <span className="hidden h-9 w-9 items-center justify-center rounded-xl bg-teal-700 lg:flex">
              <Megaphone className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="text-base font-extrabold tracking-tight">SafeSign</p>
              <p className="hidden text-xs text-teal-300 sm:block">Advokasi & Perlindungan</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onOpenAnalyzer}
              className="h-9 gap-2 rounded-xl border-slate-700 bg-slate-800 px-3 text-xs font-bold text-white hover:bg-slate-700 hover:text-white"
              aria-label="Buka modul Analyzer"
            >
              <ScanSearch className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Analyzer</span>
            </Button>
            {authUser ? (
              <span className="hidden rounded-full bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-teal-300 sm:inline-flex">
                {authUser.name.split(" ")[0]}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 p-4 lg:flex print:hidden">
          <NavList view={view} onNavigate={handleNav} />
          <div className="mt-auto rounded-2xl bg-slate-800/60 p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold text-teal-300">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Prinsip Advokasi
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
              AI menyusun, <span className="font-bold text-white">Anda yang memutuskan</span>. Tidak ada email
              yang terkirim tanpa izin Anda.
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            {!authUser && privateView ? (
              <LoginGate
                title={
                  view === "cases"
                    ? "Kasus Anda, hanya milik Anda"
                    : view === "new"
                      ? "Buat Laporan Advokasi"
                      : "Kotak Masuk Email"
                }
                desc={
                  view === "cases"
                    ? "Masuk untuk melihat dan melacak kasus advokasi Anda. Setiap kasus terikat pada akun Anda — orang lain tidak dapat melihatnya."
                    : view === "new"
                      ? "Masuk untuk membuat laporan advokasi. AI akan mencocokkan kasus Anda dengan lembaga yang tepat dan menyusun draf email — Anda yang memberi izin kirim."
                      : "Masuk untuk melihat status email advokasi Anda: terkirim, menunggu balasan, dan balasan lembaga — semuanya di satu tempat."
                }
              />
            ) : view === "cases" ? (
              selectedCaseId ? (
                <CaseDetailView onOpenContract={onOpenContract} />
              ) : (
                <CasesView />
              )
            ) : view === "new" ? (
              <NewCaseView onOpenContract={onOpenContract} />
            ) : view === "inbox" ? (
              <InboxView />
            ) : view === "institutions" ? (
              <InstitutionsView />
            ) : view === "rights" ? (
              <RightsView />
            ) : view === "sos" ? (
              <SosView />
            ) : null}
          </div>
        </main>
      </div>

      {/* Compact footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 print:hidden">
        <p className="px-4 text-center text-xs text-slate-400">
          SafeSign Advokasi · AI menyusun draf, Anda memberi izin · Nomor kontak dapat berubah — verifikasi di situs resmi lembaga
        </p>
      </footer>
    </div>
  );
}

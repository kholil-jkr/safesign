// SafeSign Advokasi — application shell: sidebar, module switcher, user/role,
// dan router view (kasus / buat laporan / lembaga / panduan hak / SOS).
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  Building2,
  FilePlus2,
  LayoutDashboard,
  Megaphone,
  Menu,
  ScanSearch,
  ShieldCheck,
  Siren,
  Briefcase,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useManage, useRestoreUser } from "@/lib/manage/store";
import { ROLE_LABELS } from "@/lib/manage/types";
import { useAdvocacy, type AdvocacyView } from "@/lib/advocacy/store";
import { CasesView } from "./CasesView";
import { CaseDetailView } from "./CaseDetailView";
import { NewCaseView } from "./NewCaseView";
import { InstitutionsView } from "./InstitutionsView";
import { RightsView } from "./RightsView";
import { SosView } from "./SosView";

const NAV: { id: AdvocacyView; label: string; icon: React.ElementType; danger?: boolean }[] = [
  { id: "cases", label: "Kasus Saya", icon: Briefcase },
  { id: "new", label: "Buat Laporan", icon: FilePlus2 },
  { id: "institutions", label: "Direktori Lembaga", icon: Building2 },
  { id: "rights", label: "Panduan Hak", icon: BookOpen },
  { id: "sos", label: "SOS Darurat", icon: Siren, danger: true },
];

function NavList({ view, onNavigate }: { view: AdvocacyView; onNavigate: (v: AdvocacyView) => void }) {
  return (
    <nav aria-label="Navigasi advokasi" className="flex flex-col gap-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = view === item.id;
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
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

export function AdvocacyApp({
  onOpenAnalyzer,
  onOpenManage,
  onOpenContract,
}: {
  onOpenAnalyzer: () => void;
  onOpenManage: () => void;
  onOpenContract: (contractId: string) => void;
}) {
  const { currentUser, users, setCurrentUser, loadUsers } = useManage();
  const { view, setView, selectedCaseId } = useAdvocacy();
  const [drawerOpen, setDrawerOpen] = useState(false);
  useRestoreUser();

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleNav = useCallback(
    (v: AdvocacyView) => {
      setView(v);
      setDrawerOpen(false); // tutup drawer mobile setelah memilih menu
    },
    [setView]
  );

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
                Pilih menu: kasus, buat laporan, direktori lembaga, panduan hak, atau SOS darurat.
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
                  <AdvocacyNavContent onNavigate={handleNav} />
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
            <Button
              variant="outline"
              onClick={onOpenManage}
              className="h-9 gap-2 rounded-xl border-slate-700 bg-slate-800 px-3 text-xs font-bold text-white hover:bg-slate-700 hover:text-white"
              aria-label="Buka modul Manajemen"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Manajemen</span>
            </Button>

            {/* Simulated current user / role switcher (konsisten dengan modul Manajemen) */}
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-2 md:flex">
                <UserRound className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <Select
                  value={currentUser.id}
                  onValueChange={(v) => {
                    const u = users.find((x) => x.id === v);
                    if (u) setCurrentUser(u);
                  }}
                >
                  <SelectTrigger
                    className="h-9 w-auto min-w-40 gap-2 rounded-xl border-slate-700 bg-slate-800 text-xs font-semibold text-white hover:bg-slate-700 focus:ring-teal-500"
                    aria-label="Ganti peran pengguna"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="text-sm">
                        {u.name} — {ROLE_LABELS[u.role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1.5 text-xs font-bold text-teal-300 md:hidden">
                {ROLE_LABELS[currentUser.role]}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 p-4 lg:flex print:hidden">
          <AdvocacyNavContent onNavigate={handleNav} />
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
            {view === "cases" ? (
              selectedCaseId ? (
                <CaseDetailView onOpenContract={onOpenContract} />
              ) : (
                <CasesView />
              )
            ) : null}
            {view === "new" ? <NewCaseView onOpenContract={onOpenContract} /> : null}
            {view === "institutions" ? <InstitutionsView /> : null}
            {view === "rights" ? <RightsView /> : null}
            {view === "sos" ? <SosView /> : null}
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

/** Nav content dibagi agar dipakai di sidebar & drawer mobile */
function AdvocacyNavContent({ onNavigate }: { onNavigate: (v: AdvocacyView) => void }) {
  const view = useAdvocacy((s) => s.view);
  return <NavList view={view} onNavigate={onNavigate} />;
}

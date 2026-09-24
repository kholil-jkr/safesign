// SafeSign Manajemen — application shell: sidebar, notifikasi jatuh tempo,
// identitas akun asli (sesi login), dan router view.
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  FilePlus2,
  FileText,
  LayoutDashboard,
  Megaphone,
  Menu,
  PenTool,
  ScanSearch,
  ShieldCheck,
  UserRound,
  Users,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  useManage,
  type ManageView,
} from "@/lib/manage/store";
import { ROLE_LABELS, daysLeftLabel, formatDate } from "@/lib/manage/types";
import { useAuth } from "@/lib/auth-store";
import { DashboardView } from "./DashboardView";
import { ContractsView } from "./ContractsView";
import { ContractDetail } from "./ContractDetail";
import { NewContractView } from "./NewContractView";
import { TemplatesView } from "./TemplatesView";
import { ReportsView } from "./ReportsView";
import { TeamView } from "./TeamView";

const NAV: { id: ManageView; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "contracts", label: "Registry Kontrak", icon: FileText },
  { id: "new", label: "Tambah Kontrak", icon: FilePlus2 },
  { id: "templates", label: "Template", icon: FileSpreadsheet },
  { id: "reports", label: "Laporan & Export", icon: PenTool },
  { id: "team", label: "Tim & Peran", icon: Users },
];

function NavList({ view, onNavigate }: { view: ManageView; onNavigate: (v: ManageView) => void }) {
  return (
    <nav aria-label="Navigasi utama" className="flex flex-col gap-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = view === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              onNavigate(item.id);
            }}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-colors",
              active
                ? "bg-teal-700 text-white shadow-sm"
                : "text-slate-100/80 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

export function ManageApp({ onOpenAnalyzer, onOpenAdvocacy }: { onOpenAnalyzer: () => void; onOpenAdvocacy: () => void }) {
  const authUser = useAuth((s) => s.user);
  const {
    view,
    setView,
    selectedContractId,
    openContract,
    notifications,
    notifOpen,
    setNotifOpen,
    refreshNotifications,
    refreshKey,
  } = useManage();

  useEffect(() => {
    void refreshNotifications();
    const t = setInterval(() => void refreshNotifications(), 60_000);
    return () => clearInterval(t);
  }, [refreshNotifications, refreshKey]);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleNav = useCallback(
    (v: ManageView) => {
      setView(v);
      setDrawerOpen(false); // tutup drawer mobile setelah memilih menu
    },
    [setView]
  );

  const unreadCount = notifications.length;

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
              <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
              <SheetDescription className="sr-only">
                Pilih menu manajemen kontrak: dashboard, registry, tambah kontrak, template, laporan, atau tim.
              </SheetDescription>
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-2.5 border-b border-slate-800 px-5 py-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700">
                    <ShieldCheck className="h-5 w-5 text-white" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-base font-extrabold leading-tight">SafeSign</p>
                    <p className="text-xs text-teal-300">Manajemen Kontrak</p>
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
              <ShieldCheck className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="text-base font-extrabold tracking-tight">SafeSign</p>
              <p className="hidden text-xs text-teal-300 sm:block">Manajemen Kontrak</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Switch to other modules */}
            <Button
              variant="outline"
              onClick={onOpenAdvocacy}
              className="h-9 gap-2 rounded-xl border-slate-700 bg-slate-800 px-3 text-xs font-bold text-white hover:bg-slate-700 hover:text-white"
              aria-label="Buka modul Advokasi"
            >
              <Megaphone className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Advokasi</span>
            </Button>
            <Button
              variant="outline"
              onClick={onOpenAnalyzer}
              className="h-9 gap-2 rounded-xl border-slate-700 bg-slate-800 px-3 text-xs font-bold text-white hover:bg-slate-700 hover:text-white"
              aria-label="Buka modul Analyzer"
            >
              <ScanSearch className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Analyzer</span>
            </Button>

            {/* Notification bell */}
            <Popover open={notifOpen} onOpenChange={setNotifOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-white hover:bg-white/10 hover:text-white"
                  aria-label={`Notifikasi jatuh tempo (${unreadCount} belum dibaca)`}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : null}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 rounded-2xl p-0 sm:w-96" sideOffset={8}>
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-bold text-slate-900">Peringatan Jatuh Tempo</p>
                  {unreadCount > 0 ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                      {unreadCount} aktif
                    </span>
                  ) : null}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-500">
                      Tidak ada peringatan aktif. Semua kontrak aman terpantau.
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {notifications.slice(0, 12).map((n) => (
                        <li key={n.key}>
                          <button
                            onClick={() => {
                              setNotifOpen(false);
                              openContract(n.contractId);
                              setView("contracts");
                            }}
                            className="w-full px-4 py-3 text-left transition-colors hover:bg-slate-50"
                          >
                            <p className="line-clamp-2 text-sm font-semibold text-slate-800">{n.title}</p>
                            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                              <span
                                className={cn(
                                  "font-bold",
                                  n.daysLeft <= 7 ? "text-red-600" : n.daysLeft <= 30 ? "text-amber-600" : "text-slate-500"
                                )}
                              >
                                {daysLeftLabel(n.daysLeft)}
                              </span>
                              <span className="text-slate-400">·</span>
                              <span className="text-slate-500">Berakhir {formatDate(n.endDate)}</span>
                              {n.autoRenew ? (
                                <>
                                  <span className="text-slate-400">·</span>
                                  <span className="font-medium text-teal-700">Auto-renew</span>
                                </>
                              ) : null}
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <p className="border-t border-slate-100 px-4 py-2.5 text-center text-xs text-slate-400">
                  Ambang batas H-90 / H-60 / H-30 / H-7 · dapat diatur per kontrak
                </p>
              </PopoverContent>
            </Popover>

            {/* Identitas akun asli (dari sesi login) */}
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-2 md:flex">
                <UserRound className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <span className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-white">
                  {authUser?.name ?? "—"} · {authUser ? ROLE_LABELS[authUser.role] ?? authUser.role : ""}
                </span>
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1.5 text-xs font-bold text-teal-300 md:hidden">
                {authUser ? ROLE_LABELS[authUser.role] ?? authUser.role : "—"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 p-4 lg:flex print:hidden">
          <NavList view={view} onNavigate={handleNav} />
          <div className="mt-auto rounded-2xl bg-slate-800/60 p-4">
            <p className="text-xs font-bold text-slate-300">Masuk sebagai</p>
            <p className="mt-1 truncate text-sm font-bold text-white">{authUser?.name ?? "—"}</p>
            <p className="text-xs font-semibold text-teal-300">{authUser ? ROLE_LABELS[authUser.role] ?? authUser.role : ""}</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            {view === "dashboard" ? <DashboardView /> : null}
            {view === "contracts" ? (
              selectedContractId ? (
                <ContractDetail />
              ) : (
                <ContractsView />
              )
            ) : null}
            {view === "new" ? <NewContractView /> : null}
            {view === "templates" ? <TemplatesView /> : null}
            {view === "reports" ? <ReportsView /> : null}
            {view === "team" ? <TeamView /> : null}
          </div>
        </main>
      </div>

      {/* Compact footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 print:hidden">
        <p className="px-4 text-center text-xs text-slate-400">
          SafeSign Manajemen Kontrak · Data tersimpan aman di server · Peringatan otomatis H-90/H-60/H-30/H-7
        </p>
      </footer>
    </div>
  );
}

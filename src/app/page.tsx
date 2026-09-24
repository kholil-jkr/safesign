"use client";

// SafeSign — application shell.
// Fitur inti ditonjolkan:
//  • "analyzer"  — Analyzer kontrak (default, bisa anonim, 10 bahasa)
//  • "advocacy"  — Advokasi & perlindungan pekerja (kasus pribadi per akun)
//  • "manage"    — Modul Organisasi (TERSEMBUNYI; khusus role admin/legal/
//                  manager/staff — dibuka lewat menu akun)
// Login opsional: tamu hanya Analyzer (hasil tidak disimpan); login mendapat
// Riwayat Kontrak, kasus advokasi pribadi, dan Kotak Masuk email.

import { useCallback, useEffect, useState } from "react";
import { AnalyzerApp } from "@/components/safesign/AnalyzerApp";
import { ManageApp } from "@/components/manage/ManageApp";
import { AdvocacyApp } from "@/components/advocacy/AdvocacyApp";
import { useManage } from "@/lib/manage/store";
import { useAuth } from "@/lib/auth-store";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { AccountWidget } from "@/components/auth/AccountWidget";
import { RiwayatDrawer } from "@/components/auth/RiwayatDrawer";

type Module = "analyzer" | "manage" | "advocacy";
const MODULE_STORAGE_KEY = "safesign.module";

function isManageRole(role?: string): boolean {
  return role === "admin" || role === "legal" || role === "manager" || role === "staff";
}

export default function SafeSignPage() {
  const [module, setModule] = useState<Module>("analyzer");
  const [ready, setReady] = useState(false);

  const authUser = useAuth((s) => s.user);
  const authReady = useAuth((s) => s.ready);
  const fetchMe = useAuth((s) => s.fetchMe);

  useEffect(() => {
    void fetchMe();
  }, [fetchMe]);

  const switchModule = useCallback(
    (next: Module) => {
      // Modul Organisasi hanya untuk role organisasi
      if (next === "manage" && !isManageRole(useAuth.getState().user?.role)) {
        next = "analyzer";
      }
      setModule(next);
      window.localStorage.setItem(MODULE_STORAGE_KEY, next);
      window.scrollTo({ top: 0 });
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      const stored = window.localStorage.getItem(MODULE_STORAGE_KEY);
      if (stored === "manage" || stored === "analyzer" || stored === "advocacy") setModule(stored);
      setReady(true);
    });

    // Navigasi antar modul dari widget akun / tombol lintas modul
    const onNavigate = (e: Event) => {
      const detail = (e as CustomEvent<{ module: Module; view?: string }>).detail;
      if (!detail?.module) return;
      switchModule(detail.module);
      if (detail.view) {
        // beri waktu modul mount lalu teruskan view (mis. "inbox" advokasi)
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("safesign:advocacy-view", { detail: { view: detail.view } }));
        }, 80);
      }
    };
    window.addEventListener("safesign:navigate", onNavigate);
    return () => {
      cancelled = true;
      window.removeEventListener("safesign:navigate", onNavigate);
    };
  }, [switchModule]);

  // Bila sesi berubah (mis. role diketahui setelah fetchMe), pastikan modul valid
  useEffect(() => {
    if (authReady && module === "manage" && !isManageRole(authUser?.role)) {
      setModule("analyzer");
      window.localStorage.setItem(MODULE_STORAGE_KEY, "analyzer");
    }
  }, [authReady, authUser, module]);

  // Dari modul Advokasi → buka kontrak terkait di registry Manajemen (khusus role org)
  const openContractInManage = useCallback(
    (contractId: string) => {
      if (!isManageRole(useAuth.getState().user?.role)) return;
      useManage.getState().setView("contracts");
      useManage.getState().openContract(contractId);
      switchModule("manage");
    },
    [switchModule]
  );

  if (!ready || !authReady) {
    // avoid module flash before localStorage/session is read
    return <div className="min-h-screen bg-white" aria-hidden="true" />;
  }

  return (
    <>
      {module === "analyzer" ? (
        <AnalyzerApp onOpenAdvocacy={() => switchModule("advocacy")} />
      ) : module === "manage" && isManageRole(authUser?.role) ? (
        <ManageApp
          onOpenAnalyzer={() => switchModule("analyzer")}
          onOpenAdvocacy={() => switchModule("advocacy")}
        />
      ) : (
        <AdvocacyApp
          onOpenAnalyzer={() => switchModule("analyzer")}
          onOpenManage={openContractInManage}
          onOpenContract={openContractInManage}
        />
      )}

      {/* Lapisan akun global (semua modul) */}
      <AccountWidget />
      <AuthDialog />
      <RiwayatDrawer />
    </>
  );
}

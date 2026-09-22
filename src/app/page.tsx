"use client";

// SafeSign — application shell.
// Three modules behind one route:
//  • "analyzer"  — worker-facing AI contract guardian (10 languages, anonymous)
//  • "manage"    — organization-facing contract management platform (Indonesian):
//                  dashboard, registry, AI extraction, approvals, e-signature,
//                  versions, reminders, templates, reports, role-based access.
//  • "advocacy"  — worker-facing advocacy & protection module (Indonesian):
//                  smart institution matching, AI-drafted emails with an explicit
//                  user permission gate, case tracking, follow-ups, rights guide, SOS.
// The module choice is remembered per device (localStorage).

import { useCallback, useEffect, useState } from "react";
import { AnalyzerApp } from "@/components/safesign/AnalyzerApp";
import { ManageApp } from "@/components/manage/ManageApp";
import { AdvocacyApp } from "@/components/advocacy/AdvocacyApp";
import { useManage } from "@/lib/manage/store";

type Module = "analyzer" | "manage" | "advocacy";
const MODULE_STORAGE_KEY = "safesign.module";

export default function SafeSignPage() {
  const [module, setModule] = useState<Module>("analyzer");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // async restore (setState inside a callback, not synchronously in the effect body)
    Promise.resolve().then(() => {
      if (cancelled) return;
      const stored = window.localStorage.getItem(MODULE_STORAGE_KEY);
      if (stored === "manage" || stored === "analyzer" || stored === "advocacy") setModule(stored);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const switchModule = useCallback((next: Module) => {
    setModule(next);
    window.localStorage.setItem(MODULE_STORAGE_KEY, next);
    window.scrollTo({ top: 0 });
  }, []);

  // Dari modul Advokasi → buka kontrak terkait di registry Manajemen
  const openContractInManage = useCallback(
    (contractId: string) => {
      useManage.getState().setView("contracts"); // reset seleksi dulu
      useManage.getState().openContract(contractId);
      switchModule("manage");
    },
    [switchModule]
  );

  if (!ready) {
    // avoid module flash before localStorage is read
    return <div className="min-h-screen bg-white" aria-hidden="true" />;
  }

  return (
    <>
      {module === "analyzer" ? (
        <AnalyzerApp
          onSaveToRegistry={() => switchModule("manage")}
          onOpenManage={() => switchModule("manage")}
          onOpenAdvocacy={() => switchModule("advocacy")}
        />
      ) : module === "manage" ? (
        <ManageApp
          onOpenAnalyzer={() => switchModule("analyzer")}
          onOpenAdvocacy={() => switchModule("advocacy")}
        />
      ) : (
        <AdvocacyApp
          onOpenAnalyzer={() => switchModule("analyzer")}
          onOpenManage={() => switchModule("manage")}
          onOpenContract={openContractInManage}
        />
      )}
    </>
  );
}

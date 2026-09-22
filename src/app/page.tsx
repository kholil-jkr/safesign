"use client";

// SafeSign — application shell.
// Two modules behind one route:
//  • "analyzer"  — worker-facing AI contract guardian (10 languages, anonymous)
//  • "manage"    — organization-facing contract management platform (Indonesian):
//                  dashboard, registry, AI extraction, approvals, e-signature,
//                  versions, reminders, templates, reports, role-based access.
// The module choice is remembered per device (localStorage).

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AnalyzerApp } from "@/components/safesign/AnalyzerApp";
import { ManageApp } from "@/components/manage/ManageApp";
import { useManage } from "@/lib/manage/store";

type Module = "analyzer" | "manage";
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
      if (stored === "manage" || stored === "analyzer") setModule(stored);
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
        />
      ) : (
        <ManageApp onOpenAnalyzer={() => switchModule("analyzer")} />
      )}
    </>
  );
}

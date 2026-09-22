// SafeSign Manajemen — team & access control: role cards, permission matrix, user switch
"use client";

import { Check, Minus, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useManage } from "@/lib/manage/store";
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  type Role,
} from "@/lib/manage/types";
import { SectionCard } from "./shared";

const PERMISSIONS: { label: string; roles: Record<Role, boolean> }[] = [
  { label: "Melihat semua kontrak", roles: { admin: true, legal: true, manager: true, staff: true } },
  { label: "Mengunggah & membuat draft kontrak", roles: { admin: true, legal: true, manager: true, staff: true } },
  { label: "Mengajukan kontrak untuk approval", roles: { admin: true, legal: true, manager: true, staff: true } },
  { label: "Menandatangani kontrak (e-signature)", roles: { admin: true, legal: true, manager: true, staff: true } },
  { label: "Approval tahap 1 (Manager)", roles: { admin: true, manager: true, legal: false, staff: false } },
  { label: "Approval tahap 2 (Legal)", roles: { admin: true, legal: true, manager: false, staff: false } },
  { label: "Mengelola template kontrak", roles: { admin: true, legal: true, manager: false, staff: false } },
  { label: "Mengubah data kontrak & amandemen", roles: { admin: true, legal: true, manager: true, staff: true } },
  { label: "Menghentikan / membuka kontrak", roles: { admin: true, legal: true, manager: false, staff: false } },
  { label: "Menghapus kontrak permanen", roles: { admin: true, legal: false, manager: false, staff: false } },
  { label: "Export laporan (CSV & PDF)", roles: { admin: true, legal: true, manager: true, staff: true } },
];

const ROLE_ORDER: Role[] = ["admin", "legal", "manager", "staff"];

export function TeamView() {
  const { users, currentUser, setCurrentUser } = useManage();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Tim & Kontrol Akses
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
          Kontrol akses berbasis peran (role-based access control). Simulasi login memungkinkan Anda
          mencoba setiap peran — izin otomatis diterapkan di seluruh aplikasi.
        </p>
      </div>

      {/* User cards */}
      <SectionCard title="Pengguna">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {users.map((u) => {
            const active = u.id === currentUser.id;
            return (
              <li key={u.id}>
                <button
                  onClick={() => setCurrentUser(u)}
                  aria-pressed={active}
                  className={cn(
                    "flex w-full flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-colors",
                    active
                      ? "border-teal-600 bg-teal-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full",
                        active ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      <UserRound className="h-5 w-5" aria-hidden="true" />
                    </span>
                    {active ? (
                      <span className="rounded-full bg-teal-700 px-2 py-0.5 text-xs font-extrabold text-white">
                        Aktif
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm font-bold text-slate-900">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-bold",
                      u.role === "admin" && "border-slate-800 bg-slate-800 text-white",
                      u.role === "legal" && "border-teal-200 bg-teal-50 text-teal-800",
                      u.role === "manager" && "border-amber-200 bg-amber-50 text-amber-800",
                      u.role === "staff" && "border-slate-200 bg-slate-50 text-slate-600"
                    )}
                  >
                    {ROLE_LABELS[u.role]}
                  </span>
                  {active ? (
                    <p className="mt-1 text-xs leading-relaxed text-teal-800">
                      Anda sedang berperan sebagai pengguna ini.
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">Klik untuk berganti peran</p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      {/* Role descriptions */}
      <SectionCard title="Deskripsi Peran">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ROLE_ORDER.map((r) => (
            <div key={r} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-extrabold text-slate-900">{ROLE_LABELS[r]}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{ROLE_DESCRIPTIONS[r]}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Permission matrix */}
      <SectionCard title="Matriks Izin Akses">
        <div className="overflow-x-auto">
          <table className="w-full min-w-135 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="rounded-tl-xl px-4 py-3 font-bold">Kemampuan</th>
                {ROLE_ORDER.map((r, i) => (
                  <th
                    key={r}
                    scope="col"
                    className={cn("px-4 py-3 text-center font-bold", i === ROLE_ORDER.length - 1 && "rounded-tr-xl")}
                  >
                    {ROLE_LABELS[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PERMISSIONS.map((p) => (
                <tr key={p.label}>
                  <th scope="row" className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                    {p.label}
                  </th>
                  {ROLE_ORDER.map((r) => (
                    <td key={r} className="px-4 py-3 text-center">
                      {p.roles[r] ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700" role="img" aria-label="diizinkan">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      ) : (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400" role="img" aria-label="tidak diizinkan">
                          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 rounded-xl bg-teal-50 px-4 py-3 text-xs leading-relaxed text-teal-900">
          Catatan keamanan: sistem ini adalah demo kontrol akses di sisi aplikasi. Pada deployment
          produksi, peran terikat ke sesi login terautentikasi (mis. NextAuth) sehingga izin tidak
          dapat diganti bebas oleh pengguna.
        </p>
      </SectionCard>
    </div>
  );
}

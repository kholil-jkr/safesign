// SafeSign Manajemen — dashboard stats aggregation
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeContract } from "@/lib/manage/serialize";
import { daysLeft, CATEGORY_LABELS, STATUS_LABELS } from "@/lib/manage/types";
import { getSessionUser, isManageRole } from "@/lib/auth";


export const dynamic = "force-dynamic";

export async function GET() {
    const authUser = await getSessionUser();
    if (!authUser || !isManageRole(authUser.role)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

  try {
    const contracts = await db.contract.findMany({
      include: {
        createdBy: true,
        _count: { select: { approvals: true, signatures: true, versions: true } },
      },
    });

    const dtos = contracts.map(serializeContract);

    const byStatusMap = new Map<string, number>();
    const byCategoryMap = new Map<string, number>();
    const byRiskMap = new Map<string, number>();
    const currencyMap = new Map<string, number>();
    const monthlyMap = new Map<string, { count: number; value: number; sort: number }>();

    let active = 0, expiring30 = 0, expired = 0, drafts = 0, pending = 0, signedTotal = 0;

    const now = new Date();
    for (const c of dtos) {
      byStatusMap.set(c.status, (byStatusMap.get(c.status) ?? 0) + 1);
      byCategoryMap.set(c.category, (byCategoryMap.get(c.category) ?? 0) + 1);
      if (c.riskLevel) byRiskMap.set(c.riskLevel, (byRiskMap.get(c.riskLevel) ?? 0) + 1);
      if (c.value) currencyMap.set(c.currency, (currencyMap.get(c.currency) ?? 0) + c.value);
      signedTotal += c.signedCount ?? 0;
      if (c.status === "draft") drafts++;
      if (c.status === "pending_approval") pending++;

      const dl = daysLeft(c.endDate);
      if (c.endDate && (c.status === "approved" || c.status === "pending_approval")) {
        if (dl !== null && dl >= 0) {
          const started = !c.startDate || new Date(c.startDate).getTime() <= now.getTime();
          if (started) active++;
          if (dl <= 30) expiring30++;
          // monthly renewal buckets for the next 8 months
          const end = new Date(c.endDate);
          const monthsAhead =
            (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
          if (monthsAhead >= 0 && monthsAhead <= 7) {
            const label = end.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
            const cur = monthlyMap.get(label) ?? { count: 0, value: 0, sort: monthsAhead };
            cur.count++;
            cur.value += c.value ?? 0;
            monthlyMap.set(label, cur);
          }
        }
        if (dl !== null && dl < 0) expired++;
      }
    }

    // fill empty months so the chart is continuous
    const monthlyRenewals: { month: string; count: number; value: number }[] = [];
    for (let m = 0; m <= 7; m++) {
      const d = new Date(now.getFullYear(), now.getMonth() + m, 1);
      const label = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
      const cur = monthlyMap.get(label);
      monthlyRenewals.push({ month: label, count: cur?.count ?? 0, value: cur?.value ?? 0 });
    }

    const expiringSoon = dtos
      .map((c) => ({ ...c, daysLeft: daysLeft(c.endDate) }))
      .filter((c) => c.daysLeft !== null && c.daysLeft >= 0 && c.daysLeft <= 90 && c.status !== "terminated" && c.status !== "rejected")
      .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))
      .slice(0, 8);

    const recent = [...dtos]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 6);

    const pendingApprovals = await db.contract.findMany({
      where: { status: "pending_approval" },
      include: {
        createdBy: true,
        approvals: { where: { status: "pending" }, orderBy: { step: "asc" } },
      },
    });
    const pendingList = pendingApprovals.map((c) => ({
      ...serializeContract({ ...c, _count: undefined }),
      pendingStep: c.approvals[0]?.step ?? 1,
      pendingRole: c.approvals[0]?.approverRole ?? "manager",
    }));

    return NextResponse.json({
      ok: true,
      stats: {
        total: dtos.length,
        byStatus: [...byStatusMap.entries()].map(([status, count]) => ({
          status,
          count,
          label: STATUS_LABELS[status] ?? status,
        })),
        byCategory: [...byCategoryMap.entries()].map(([category, count]) => ({
          category,
          count,
          label: CATEGORY_LABELS[category] ?? category,
        })),
        byRisk: [...byRiskMap.entries()].map(([risk, count]) => ({ risk, count })),
        monthlyRenewals,
        totalValueByCurrency: [...currencyMap.entries()].map(([currency, total]) => ({ currency, total })),
        expiringSoon,
        recent,
        pendingApprovals: pendingList,
        counts: { active, expiring30, expired, drafts, pending, signed: signedTotal },
      },
    });
  } catch (err) {
    console.error("[dashboard]", err);
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
}

// SafeSign Manajemen — notification center: upcoming expiries per enabled thresholds
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeParse } from "@/lib/manage/serialize";
import { daysLeft } from "@/lib/manage/types";
import type { NotificationItem } from "@/lib/manage/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const contracts = await db.contract.findMany({
      where: { status: { in: ["approved", "pending_approval", "draft"] } },
    });

    const items: NotificationItem[] = [];
    for (const c of contracts) {
      const dl = daysLeft(c.endDate);
      if (dl === null || dl < 0) continue;
      const thresholds = safeParse<number[]>(c.remindersJson, [90, 60, 30, 7]);
      const acked = safeParse<string[]>(c.ackedJson, []);
      // trigger when daysLeft crosses any enabled threshold
      const triggered = thresholds.filter((t) => dl <= t);
      if (triggered.length === 0) continue;
      const threshold = Math.max(...triggered);
      const key = `${c.id}:${threshold}`;
      if (acked.includes(key)) continue;
      items.push({
        contractId: c.id,
        title: c.title,
        daysLeft: dl,
        threshold,
        endDate: c.endDate ? c.endDate.toISOString() : null,
        key,
        autoRenew: c.autoRenew,
      });
    }

    items.sort((a, b) => a.daysLeft - b.daysLeft);
    return NextResponse.json({ ok: true, items });
  } catch (err) {
    console.error("[notifications]", err);
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
}

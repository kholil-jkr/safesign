// SafeSign Advokasi — direktori lembaga (list & filter)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeInstitution } from "@/lib/advocacy/serialize";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const q = (sp.get("q") ?? "").trim().toLowerCase();
    const type = sp.get("type") ?? "";
    const origin = sp.get("origin") ?? "";
    const destination = sp.get("destination") ?? "";
    const category = sp.get("category") ?? "";

    const where: Prisma.InstitutionWhereInput = {};
    const AND: Prisma.InstitutionWhereInput[] = [];
    if (q) {
      AND.push({
        OR: [
          { name: { contains: q } },
          { shortName: { contains: q } },
          { description: { contains: q } },
          { jurisdiction: { contains: q } },
        ],
      });
    }
    if (["government", "embassy", "international", "ngo"].includes(type)) AND.push({ type });
    if (origin) {
      AND.push({ OR: [{ originCountry: origin }, { originCountry: "ANY" }] });
    }
    if (destination) {
      AND.push({ OR: [{ destinationCountry: destination }, { destinationCountry: null }] });
    }
    if (category) AND.push({ categories: { contains: category } });
    if (AND.length > 0) where.AND = AND;

    const institutions = await db.institution.findMany({
      where,
      orderBy: [{ priority: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ ok: true, institutions: institutions.map(serializeInstitution) });
  } catch (err) {
    console.error("[advocacy/institutions GET]", err);
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
}

// SafeSign Advokasi — pencarian lembaga pintar (rule-based scoring + alasan).
// Mencocokkan lembaga berdasarkan negara asal, negara penempatan, dan kategori masalah.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeInstitution } from "@/lib/advocacy/serialize";
import { CATEGORY_META, type CaseCategory } from "@/lib/advocacy/types";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES = Object.keys(CATEGORY_META) as string[];

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const originCountry = String(body.originCountry ?? "Indonesia").slice(0, 60);
    const destinationCountry =
      typeof body.destinationCountry === "string" && body.destinationCountry && body.destinationCountry !== "none"
        ? body.destinationCountry.slice(0, 60)
        : null;
    const category = String(body.category ?? "");
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ ok: false, error: "CATEGORY_INVALID" }, { status: 400 });
    }

    const categoryLabel = CATEGORY_META[category as CaseCategory]?.label ?? category;
    const all = await db.institution.findMany({ orderBy: [{ priority: "asc" }, { name: "asc" }] });

    const matches = all
      .map((inst) => {
        const reasons: string[] = [];
        let score = 0;

        if (inst.originCountry === originCountry) {
          score += 100;
          reasons.push(`Berwenang untuk pekerja dari ${originCountry}`);
        } else if (inst.originCountry === "ANY") {
          score += 55;
          reasons.push("Melayani pekerja migran dari semua negara asal");
        } else {
          return null; // lembaga milik negara asal lain — tidak relevan
        }

        if (destinationCountry) {
          if (inst.destinationCountry === destinationCountry) {
            score += 45;
            reasons.push(`Berkepentingan langsung dengan kasus di ${destinationCountry}`);
          } else if (inst.destinationCountry === null) {
            score += 12;
          } else {
            return null; // lembaga milik negara penempatan lain
          }
        } else if (inst.destinationCountry === null) {
          score += 8;
        }

        if (inst.categories.includes(category)) {
          score += 40;
          reasons.push(`Menangani kategori "${categoryLabel}"`);
        }

        if (inst.type === "embassy") reasons.push("Perwakilan resmi negara Anda di negara penempatan");
        if (inst.type === "international") reasons.push("Saluran internasional bila jalur nasional belum memadai");

        score += (10 - Math.min(inst.priority, 10)) * 2; // prioritas seed (1 = tertinggi)

        return {
          ...serializeInstitution(inst),
          score,
          reasons,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .filter((x) => x.score >= 55) // ambang relevansi minimum
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    return NextResponse.json({ ok: true, matches });
  } catch (err) {
    console.error("[advocacy/match POST]", err);
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
}

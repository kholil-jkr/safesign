// SafeSign Manajemen — contract templates (list / create / delete)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeTemplate } from "@/lib/manage/serialize";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES = ["employment", "vendor", "lease", "nda", "service", "other"];

export async function GET() {
  try {
    const templates = await db.template.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ ok: true, templates: templates.map(serializeTemplate) });
  } catch (err) {
    console.error("[templates GET]", err);
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name?: string;
      category?: string;
      description?: string;
      content?: string;
    };
    const name = (body.name ?? "").trim();
    const content = body.content ?? "";
    if (!name || content.trim().length < 20) {
      return NextResponse.json({ ok: false, error: "INVALID" }, { status: 400 });
    }
    const category = VALID_CATEGORIES.includes(String(body.category)) ? String(body.category) : "other";
    const t = await db.template.create({
      data: {
        name: name.slice(0, 200),
        category,
        description: body.description ? String(body.description).slice(0, 500) : null,
        content: content.slice(0, 100_000),
      },
    });
    return NextResponse.json({ ok: true, id: t.id });
  } catch (err) {
    console.error("[templates POST]", err);
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "ID_REQUIRED" }, { status: 400 });
    await db.template.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[templates DELETE]", err);
    return NextResponse.json({ ok: false, error: "DB_ERROR" }, { status: 500 });
  }
}

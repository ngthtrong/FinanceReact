import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ abbreviation: string }> }
) {
  try {
    const { abbreviation: abbr } = await params;
    const body = await request.json();
    const { full_name, english_name, category_type, group } = body;
    const originalType = body.original_type ?? category_type;

    const existing = await sql`SELECT * FROM categories WHERE abbreviation = ${abbr} AND category_type = ${originalType}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const cur = existing[0] as Record<string, unknown>;
    const rows = await sql`
      UPDATE categories SET
        abbreviation = ${body.abbreviation ?? abbr},
        full_name = ${full_name ?? cur.full_name},
        english_name = ${english_name !== undefined ? english_name : cur.english_name},
        category_type = ${category_type ?? cur.category_type},
        "group" = ${group ?? cur.group}
      WHERE abbreviation = ${abbr} AND category_type = ${originalType}
      RETURNING *
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ abbreviation: string }> }
) {
  try {
    const { abbreviation: abbr } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let result;
    if (type) {
      result = await sql`DELETE FROM categories WHERE abbreviation = ${abbr} AND category_type = ${type} RETURNING abbreviation`;
    } else {
      result = await sql`DELETE FROM categories WHERE abbreviation = ${abbr} RETURNING abbreviation`;
    }

    if (result.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}

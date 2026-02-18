import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { Category } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let rows;
    if (type === "income" || type === "expense") {
      rows = await sql`SELECT * FROM categories WHERE category_type = ${type} ORDER BY "group", full_name`;
    } else {
      rows = await sql`SELECT * FROM categories ORDER BY category_type, "group", full_name`;
    }

    return NextResponse.json(rows as Category[]);
  } catch (error) {
    console.error("Error reading categories:", error);
    return NextResponse.json({ error: "Failed to read categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { abbreviation, full_name, english_name, category_type, group } = body;

    if (!abbreviation || !full_name || !category_type || !group) {
      return NextResponse.json(
        { error: "Missing required fields: abbreviation, full_name, category_type, group" },
        { status: 400 }
      );
    }

    const existing = await sql`SELECT 1 FROM categories WHERE abbreviation = ${abbreviation} AND category_type = ${category_type}`;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Danh mục với viết tắt "${abbreviation}" đã tồn tại cho loại ${category_type}` },
        { status: 409 }
      );
    }

    const rows = await sql`
      INSERT INTO categories (abbreviation, full_name, english_name, category_type, "group")
      VALUES (${abbreviation}, ${full_name}, ${english_name || ""}, ${category_type}, ${group})
      RETURNING *
    `;

    return NextResponse.json(rows[0] as Category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { readCSV, writeCSV, CATEGORY_HEADERS } from "@/lib/csv";
import { Category } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let categories = await readCSV<Category>("categories.csv");

    if (type === "income" || type === "expense") {
      categories = categories.filter((c) => c.category_type === type);
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error reading categories:", error);
    return NextResponse.json(
      { error: "Failed to read categories" },
      { status: 500 }
    );
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

    const categories = await readCSV<Category>("categories.csv");

    // Check for duplicate abbreviation within same type
    const duplicate = categories.find(
      (c) => c.abbreviation === abbreviation && c.category_type === category_type
    );
    if (duplicate) {
      return NextResponse.json(
        { error: `Danh mục với viết tắt "${abbreviation}" đã tồn tại cho loại ${category_type}` },
        { status: 409 }
      );
    }

    const newCategory: Category = {
      abbreviation,
      full_name,
      english_name: english_name || "",
      category_type,
      group,
    };

    categories.push(newCategory);
    await writeCSV("categories.csv", categories, CATEGORY_HEADERS);

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

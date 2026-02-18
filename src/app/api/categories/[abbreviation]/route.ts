import { NextRequest, NextResponse } from "next/server";
import { readCSV, writeCSV, CATEGORY_HEADERS } from "@/lib/csv";
import { Category } from "@/types";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ abbreviation: string }> }
) {
  try {
    const { abbreviation: abbr } = await params;
    const body = await request.json();
    const { full_name, english_name, category_type, group } = body;

    const categories = await readCSV<Category>("categories.csv");
    const index = categories.findIndex(
      (c) => c.abbreviation === abbr && c.category_type === (body.original_type || category_type)
    );

    if (index === -1) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    if (full_name) categories[index].full_name = full_name;
    if (english_name !== undefined) categories[index].english_name = english_name;
    if (category_type) categories[index].category_type = category_type;
    if (group) categories[index].group = group;
    if (body.abbreviation) categories[index].abbreviation = body.abbreviation;

    await writeCSV("categories.csv", categories, CATEGORY_HEADERS);

    return NextResponse.json(categories[index]);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
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

    const categories = await readCSV<Category>("categories.csv");
    const index = categories.findIndex(
      (c) => c.abbreviation === abbr && (!type || c.category_type === type)
    );

    if (index === -1) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const removed = categories.splice(index, 1)[0];
    await writeCSV("categories.csv", categories, CATEGORY_HEADERS);

    return NextResponse.json({ message: "Deleted", category: removed });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { readSettings, writeSettings } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await readSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error reading settings:", error);
    return NextResponse.json(
      { error: "Failed to read settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const current = await readSettings();
    const updated = {
      ...current,
      ...body,
      savingsGoals: body.savingsGoals
        ? { ...current.savingsGoals, ...body.savingsGoals }
        : current.savingsGoals,
      categoryLimits: body.categoryLimits ?? current.categoryLimits,
    };
    await writeSettings(updated);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error writing settings:", error);
    return NextResponse.json(
      { error: "Failed to write settings" },
      { status: 500 }
    );
  }
}

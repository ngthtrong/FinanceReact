import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import type { PlannedTransactionCreateInput } from "@/types";

function toPlanned(r: Record<string, unknown>) {
  return {
    ...r,
    id: Number(r.id),
    amount: Number(r.amount),
    planned_date:
      typeof r.planned_date === "string"
        ? r.planned_date
        : (r.planned_date as Date).toISOString().slice(0, 10),
    is_active: Boolean(r.is_active),
    created_at:
      typeof r.created_at === "string"
        ? r.created_at
        : (r.created_at as Date).toISOString(),
  };
}

export async function GET() {
  try {
    const rows = await sql`
      SELECT * FROM planned_transactions
      ORDER BY planned_date ASC, created_at ASC
    `;
    return NextResponse.json((rows as Record<string, unknown>[]).map(toPlanned));
  } catch (error) {
    console.error("Error reading planned transactions:", error);
    return NextResponse.json(
      { error: "Failed to read planned transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: PlannedTransactionCreateInput = await request.json();

    if (
      !body.title ||
      body.amount == null ||
      !body.planned_date ||
      !body.type ||
      !body.recurrence
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: title, amount, planned_date, type, recurrence",
        },
        { status: 400 }
      );
    }

    const rows = await sql`
      INSERT INTO planned_transactions (title, amount, planned_date, type, category, recurrence, is_active, note)
      VALUES (
        ${body.title},
        ${body.amount},
        ${body.planned_date},
        ${body.type},
        ${body.category ?? ""},
        ${body.recurrence},
        true,
        ${body.note ?? ""}
      )
      RETURNING *
    `;

    return NextResponse.json(
      toPlanned(rows[0] as Record<string, unknown>),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating planned transaction:", error);
    return NextResponse.json(
      { error: "Failed to create planned transaction" },
      { status: 500 }
    );
  }
}

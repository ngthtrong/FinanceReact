import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);
    const body = await request.json();

    // Single query: UPDATE with COALESCE so missing fields keep existing values.
    // Returns 0 rows if id not found → 404.
    const rows = await sql`
      UPDATE planned_transactions SET
        title        = COALESCE(${body.title        ?? null}, title),
        amount       = COALESCE(${body.amount       ?? null}, amount),
        planned_date = COALESCE(${body.planned_date ?? null}::date, planned_date),
        type         = COALESCE(${body.type         ?? null}, type),
        category     = COALESCE(${body.category     ?? null}, category),
        recurrence   = COALESCE(${body.recurrence   ?? null}, recurrence),
        is_active    = COALESCE(${body.is_active    ?? null}, is_active),
        note         = COALESCE(${body.note         ?? null}, note)
      WHERE id = ${itemId}
      RETURNING *
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Planned transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(toPlanned(rows[0] as Record<string, unknown>));
  } catch (error) {
    console.error("Error updating planned transaction:", error);
    return NextResponse.json(
      { error: "Failed to update planned transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);

    // Single query: DELETE RETURNING to detect missing row.
    const rows = await sql`
      DELETE FROM planned_transactions WHERE id = ${itemId} RETURNING id
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Planned transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting planned transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete planned transaction" },
      { status: 500 }
    );
  }
}

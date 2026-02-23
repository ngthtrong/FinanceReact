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

    const existing = await sql`SELECT * FROM planned_transactions WHERE id = ${itemId}`;
    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Planned transaction not found" },
        { status: 404 }
      );
    }
    const cur = existing[0] as Record<string, unknown>;

    const rows = await sql`
      UPDATE planned_transactions SET
        title        = ${body.title        ?? cur.title},
        amount       = ${body.amount       ?? Number(cur.amount)},
        planned_date = ${body.planned_date ?? cur.planned_date},
        type         = ${body.type         ?? cur.type},
        category     = ${body.category     ?? cur.category ?? ""},
        recurrence   = ${body.recurrence   ?? cur.recurrence},
        is_active    = ${body.is_active    !== undefined ? body.is_active : Boolean(cur.is_active)},
        note         = ${body.note         ?? cur.note ?? ""}
      WHERE id = ${itemId}
      RETURNING *
    `;

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

    const existing = await sql`SELECT id FROM planned_transactions WHERE id = ${itemId}`;
    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Planned transaction not found" },
        { status: 404 }
      );
    }

    await sql`DELETE FROM planned_transactions WHERE id = ${itemId}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting planned transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete planned transaction" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getDayOfWeek } from "@/lib/formatters";

function toTransaction(r: Record<string, unknown>) {
  return {
    ...r,
    date: typeof r.date === "string" ? r.date : (r.date as Date).toISOString().slice(0, 10),
    amount: Number(r.amount),
    budget_impact: Number(r.budget_impact),
    year: Number(r.year),
    month: Number(r.month),
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transactionId = parseInt(id, 10);
    const body = await request.json();

    const existing = await sql`SELECT * FROM transactions WHERE id = ${transactionId}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const cur = existing[0] as Record<string, unknown>;
    const date = body.date ?? (typeof cur.date === "string" ? cur.date : (cur.date as Date).toISOString().slice(0, 10));
    const amount = body.amount ?? Number(cur.amount);
    const transaction_type = body.transaction_type ?? cur.transaction_type;
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day_of_week = getDayOfWeek(date);
    const budget_impact = transaction_type === "income" ? amount : -amount;

    const rows = await sql`
      UPDATE transactions SET
        date = ${date},
        title = ${body.title ?? cur.title},
        amount = ${amount},
        transaction_type = ${transaction_type},
        category = ${body.category ?? cur.category},
        category_group = ${body.category_group ?? cur.category_group},
        special_tag = ${body.special_tag ?? cur.special_tag ?? ""},
        budget_impact = ${budget_impact},
        year = ${year},
        month = ${month},
        day_of_week = ${day_of_week}
      WHERE id = ${transactionId}
      RETURNING *
    `;

    return NextResponse.json(toTransaction(rows[0] as Record<string, unknown>));
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transactionId = parseInt(id, 10);

    const result = await sql`DELETE FROM transactions WHERE id = ${transactionId} RETURNING id`;
    if (result.length === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: transactionId });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}

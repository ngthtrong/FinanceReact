import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

function toLoan(r: Record<string, unknown>) {
  return {
    ...r,
    date: typeof r.date === "string" ? r.date : (r.date as Date).toISOString().slice(0, 10),
    amount: Number(r.amount),
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
    const loanId = parseInt(id, 10);
    const body = await request.json();

    const existing = await sql`SELECT * FROM loans WHERE loan_id = ${loanId}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }
    const cur = existing[0] as Record<string, unknown>;

    let newStatus = body.status ?? cur.status;
    const newAmount = body.amount !== undefined ? body.amount : Number(cur.amount);
    const newDate = body.date ?? (typeof cur.date === "string" ? cur.date : (cur.date as Date).toISOString().slice(0, 10));
    const dateObj = new Date(newDate);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;

    // When marking as paid: create payment for remaining
    if (body.status === "paid" && cur.status !== "paid") {
      const paidResult = await sql`SELECT COALESCE(SUM(amount),0)::bigint AS paid FROM payments WHERE loan_id = ${loanId}`;
      const currentPaid = Number((paidResult[0] as { paid: number }).paid);
      const remaining = Number(cur.amount) - currentPaid;
      if (remaining > 0) {
        await sql`
          INSERT INTO payments (loan_id, amount, date, note)
          VALUES (${loanId}, ${remaining}, ${new Date().toISOString().slice(0, 10)}, 'Thanh toán toàn bộ')
        `;
      }
    }

    // When amount changes, recompute status
    if (body.amount !== undefined && body.amount !== Number(cur.amount)) {
      const paidResult = await sql`SELECT COALESCE(SUM(amount),0)::bigint AS paid FROM payments WHERE loan_id = ${loanId}`;
      const totalPaid = Number((paidResult[0] as { paid: number }).paid);
      if (totalPaid >= newAmount) newStatus = "paid";
      else if (totalPaid > 0) newStatus = "partial";
      else newStatus = "outstanding";
    }

    const rows = await sql`
      UPDATE loans SET
        title = ${body.title ?? cur.title},
        amount = ${newAmount},
        date = ${newDate},
        loan_type = ${body.loan_type ?? cur.loan_type},
        status = ${newStatus},
        counterparty = ${body.counterparty ?? cur.counterparty},
        related_tags = ${body.related_tags ?? cur.related_tags ?? ""},
        original_category = ${body.original_category ?? cur.original_category},
        year = ${year},
        month = ${month}
      WHERE loan_id = ${loanId}
      RETURNING *
    `;

    return NextResponse.json(toLoan(rows[0] as Record<string, unknown>));
  } catch (error) {
    console.error("Error updating loan:", error);
    return NextResponse.json({ error: "Failed to update loan" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const loanId = parseInt(id, 10);

    // payments are deleted via ON DELETE CASCADE
    const result = await sql`DELETE FROM loans WHERE loan_id = ${loanId} RETURNING loan_id`;
    if (result.length === 0) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: loanId });
  } catch (error) {
    console.error("Error deleting loan:", error);
    return NextResponse.json({ error: "Failed to delete loan" }, { status: 500 });
  }
}

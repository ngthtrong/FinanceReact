import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { PaymentCreateInput } from "@/types";

function calcLoanStatus(totalPaid: number, loanAmount: number): "outstanding" | "partial" | "paid" {
  if (totalPaid >= loanAmount) return "paid";
  if (totalPaid > 0) return "partial";
  return "outstanding";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const loanId = parseInt(id, 10);

    const rows = await sql`SELECT * FROM payments WHERE loan_id = ${loanId} ORDER BY date DESC`;
    const payments = rows.map((p) => ({
      ...p,
      date: typeof p.date === "string" ? p.date : (p.date as Date).toISOString().slice(0, 10),
      amount: Number(p.amount),
    }));
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({ payments, totalPaid });
  } catch (error) {
    console.error("Error reading payments:", error);
    return NextResponse.json({ error: "Failed to read payments" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const loanId = parseInt(id, 10);
    const body: PaymentCreateInput = await request.json();

    if (!body.amount || body.amount <= 0 || !body.date) {
      return NextResponse.json({ error: "Số tiền và ngày là bắt buộc" }, { status: 400 });
    }

    const loanRows = await sql`SELECT * FROM loans WHERE loan_id = ${loanId}`;
    if (loanRows.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy khoản vay" }, { status: 404 });
    }
    const loan = loanRows[0] as { loan_id: number; amount: number; status: string };
    const loanAmount = Number(loan.amount);

    const paidResult = await sql`SELECT COALESCE(SUM(amount),0)::bigint AS paid FROM payments WHERE loan_id = ${loanId}`;
    const currentPaid = Number((paidResult[0] as { paid: number }).paid);
    const remaining = loanAmount - currentPaid;

    if (body.amount > remaining) {
      return NextResponse.json(
        { error: `Số tiền thanh toán vượt quá số dư còn lại (${remaining})` },
        { status: 400 }
      );
    }

    const newPaymentRows = await sql`
      INSERT INTO payments (loan_id, amount, date, note)
      VALUES (${loanId}, ${body.amount}, ${body.date}, ${body.note || ""})
      RETURNING *
    `;
    const newPayment = {
      ...newPaymentRows[0],
      date: typeof newPaymentRows[0].date === "string" ? newPaymentRows[0].date : (newPaymentRows[0].date as Date).toISOString().slice(0, 10),
      amount: Number(newPaymentRows[0].amount),
    };

    const newTotalPaid = currentPaid + body.amount;
    const newStatus = calcLoanStatus(newTotalPaid, loanAmount);

    if (loan.status !== newStatus) {
      await sql`UPDATE loans SET status = ${newStatus} WHERE loan_id = ${loanId}`;
    }

    return NextResponse.json(
      { payment: newPayment, totalPaid: newTotalPaid, remaining: loanAmount - newTotalPaid, loanStatus: newStatus },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Không thể tạo thanh toán" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const loanId = parseInt(id, 10);
    const { searchParams } = new URL(request.url);
    const paymentId = parseInt(searchParams.get("paymentId") || "", 10);

    if (isNaN(paymentId)) {
      return NextResponse.json({ error: "paymentId là bắt buộc" }, { status: 400 });
    }

    const loanRows = await sql`SELECT * FROM loans WHERE loan_id = ${loanId}`;
    if (loanRows.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy khoản vay" }, { status: 404 });
    }
    const loan = loanRows[0] as { loan_id: number; amount: number; status: string };
    const loanAmount = Number(loan.amount);

    const deleted = await sql`DELETE FROM payments WHERE payment_id = ${paymentId} AND loan_id = ${loanId} RETURNING payment_id`;
    if (deleted.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy khoản thanh toán" }, { status: 404 });
    }

    const paidResult = await sql`SELECT COALESCE(SUM(amount),0)::bigint AS paid FROM payments WHERE loan_id = ${loanId}`;
    const newTotalPaid = Number((paidResult[0] as { paid: number }).paid);
    const newStatus = calcLoanStatus(newTotalPaid, loanAmount);

    if (loan.status !== newStatus) {
      await sql`UPDATE loans SET status = ${newStatus} WHERE loan_id = ${loanId}`;
    }

    return NextResponse.json({
      totalPaid: newTotalPaid,
      remaining: loanAmount - newTotalPaid,
      loanStatus: newStatus,
    });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json({ error: "Không thể xóa thanh toán" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { readCSV, writeCSV, getNextId, PAYMENT_HEADERS, LOAN_HEADERS } from "@/lib/csv";
import { Loan, Payment, PaymentCreateInput } from "@/types";

function calcLoanStatus(totalPaid: number, loanAmount: number): "outstanding" | "partial" | "paid" {
  if (totalPaid >= loanAmount) return "paid";
  if (totalPaid > 0) return "partial";
  return "outstanding";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const loanId = parseInt(id, 10);

    const allPayments = await readCSV<Payment>("payments.csv");
    const loanPayments = allPayments
      .filter((p) => p.loan_id === loanId)
      .sort((a, b) => b.date.localeCompare(a.date));

    const totalPaid = loanPayments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({ payments: loanPayments, totalPaid });
  } catch (error) {
    console.error("Error reading payments:", error);
    return NextResponse.json(
      { error: "Failed to read payments" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "Số tiền và ngày là bắt buộc" },
        { status: 400 }
      );
    }

    const loans = await readCSV<Loan>("loans.csv");
    const loan = loans.find((l) => l.loan_id === loanId);
    if (!loan) {
      return NextResponse.json(
        { error: "Không tìm thấy khoản vay" },
        { status: 404 }
      );
    }

    const allPayments = await readCSV<Payment>("payments.csv");
    const loanPayments = allPayments.filter((p) => p.loan_id === loanId);
    const currentPaid = loanPayments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = loan.amount - currentPaid;

    if (body.amount > remaining) {
      return NextResponse.json(
        { error: `Số tiền thanh toán vượt quá số dư còn lại (${remaining})` },
        { status: 400 }
      );
    }

    const nextPaymentId = getNextId(allPayments);
    const newPayment: Payment = {
      payment_id: nextPaymentId,
      loan_id: loanId,
      amount: body.amount,
      date: body.date,
      note: body.note || "",
    };
    allPayments.push(newPayment);
    await writeCSV("payments.csv", allPayments, PAYMENT_HEADERS);

    const newTotalPaid = currentPaid + body.amount;
    const newStatus = calcLoanStatus(newTotalPaid, loan.amount);

    if (loan.status !== newStatus) {
      const loanIndex = loans.findIndex((l) => l.loan_id === loanId);
      loans[loanIndex] = { ...loan, status: newStatus };
      await writeCSV("loans.csv", loans, LOAN_HEADERS);
    }

    return NextResponse.json(
      {
        payment: newPayment,
        totalPaid: newTotalPaid,
        remaining: loan.amount - newTotalPaid,
        loanStatus: newStatus,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Không thể tạo thanh toán" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "paymentId là bắt buộc" },
        { status: 400 }
      );
    }

    const loans = await readCSV<Loan>("loans.csv");
    const loan = loans.find((l) => l.loan_id === loanId);
    if (!loan) {
      return NextResponse.json(
        { error: "Không tìm thấy khoản vay" },
        { status: 404 }
      );
    }

    const allPayments = await readCSV<Payment>("payments.csv");
    const paymentIndex = allPayments.findIndex(
      (p) => p.payment_id === paymentId && p.loan_id === loanId
    );
    if (paymentIndex === -1) {
      return NextResponse.json(
        { error: "Không tìm thấy khoản thanh toán" },
        { status: 404 }
      );
    }

    allPayments.splice(paymentIndex, 1);
    await writeCSV("payments.csv", allPayments, PAYMENT_HEADERS);

    const remainingPayments = allPayments.filter((p) => p.loan_id === loanId);
    const newTotalPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0);
    const newStatus = calcLoanStatus(newTotalPaid, loan.amount);

    if (loan.status !== newStatus) {
      const loanIndex = loans.findIndex((l) => l.loan_id === loanId);
      loans[loanIndex] = { ...loan, status: newStatus };
      await writeCSV("loans.csv", loans, LOAN_HEADERS);
    }

    return NextResponse.json({
      totalPaid: newTotalPaid,
      remaining: loan.amount - newTotalPaid,
      loanStatus: newStatus,
    });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json(
      { error: "Không thể xóa thanh toán" },
      { status: 500 }
    );
  }
}

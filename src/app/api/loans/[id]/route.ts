import { NextRequest, NextResponse } from "next/server";
import { readCSV, writeCSV, getNextId, LOAN_HEADERS, PAYMENT_HEADERS } from "@/lib/csv";
import { Loan, Payment } from "@/types";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const loanId = parseInt(id, 10);
    const body = await request.json();

    const loans = await readCSV<Loan>("loans.csv");
    const index = loans.findIndex((l) => l.loan_id === loanId);

    if (index === -1) {
      return NextResponse.json(
        { error: "Loan not found" },
        { status: 404 }
      );
    }

    const existing = loans[index];

    // Update fields
    const updated: Loan = {
      ...existing,
      title: body.title ?? existing.title,
      amount: body.amount ?? existing.amount,
      date: body.date ?? existing.date,
      loan_type: body.loan_type ?? existing.loan_type,
      status: body.status ?? existing.status,
      counterparty: body.counterparty ?? existing.counterparty,
      related_tags: body.related_tags ?? existing.related_tags,
      original_category: body.original_category ?? existing.original_category,
    };

    // Recompute derived fields if date changed
    if (body.date) {
      const dateObj = new Date(updated.date);
      updated.year = dateObj.getFullYear();
      updated.month = dateObj.getMonth() + 1;
    }

    // When marking as "paid", create a payment record for the remaining amount
    if (body.status === "paid" && existing.status !== "paid") {
      const allPayments = await readCSV<Payment>("payments.csv");
      const loanPayments = allPayments.filter((p) => p.loan_id === loanId);
      const currentPaid = loanPayments.reduce((sum, p) => sum + p.amount, 0);
      const remainingAmount = existing.amount - currentPaid;

      if (remainingAmount > 0) {
        const nextPaymentId = getNextId(allPayments);
        const fullPayment: Payment = {
          payment_id: nextPaymentId,
          loan_id: loanId,
          amount: remainingAmount,
          date: new Date().toISOString().split("T")[0],
          note: "Thanh toán toàn bộ",
        };
        allPayments.push(fullPayment);
        await writeCSV("payments.csv", allPayments, PAYMENT_HEADERS);
      }
    }

    // When amount changes, recompute status based on payments
    if (body.amount !== undefined && body.amount !== existing.amount) {
      const allPayments = await readCSV<Payment>("payments.csv");
      const totalPaid = allPayments
        .filter((p) => p.loan_id === loanId)
        .reduce((sum, p) => sum + p.amount, 0);

      if (totalPaid >= updated.amount) {
        updated.status = "paid";
      } else if (totalPaid > 0) {
        updated.status = "partial";
      } else {
        updated.status = "outstanding";
      }
    }

    loans[index] = updated;
    await writeCSV("loans.csv", loans, LOAN_HEADERS);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating loan:", error);
    return NextResponse.json(
      { error: "Failed to update loan" },
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

    const loans = await readCSV<Loan>("loans.csv");
    const index = loans.findIndex((l) => l.loan_id === loanId);

    if (index === -1) {
      return NextResponse.json(
        { error: "Loan not found" },
        { status: 404 }
      );
    }

    const filtered = loans.filter((l) => l.loan_id !== loanId);
    await writeCSV("loans.csv", filtered, LOAN_HEADERS);

    // Also delete associated payments
    const allPayments = await readCSV<Payment>("payments.csv");
    const remainingPayments = allPayments.filter((p) => p.loan_id !== loanId);
    if (remainingPayments.length !== allPayments.length) {
      await writeCSV("payments.csv", remainingPayments, PAYMENT_HEADERS);
    }

    return NextResponse.json({ success: true, deletedId: loanId });
  } catch (error) {
    console.error("Error deleting loan:", error);
    return NextResponse.json(
      { error: "Failed to delete loan" },
      { status: 500 }
    );
  }
}

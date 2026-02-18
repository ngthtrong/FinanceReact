import { NextResponse } from "next/server";
import { readCSV } from "@/lib/csv";
import { Transaction, Loan, Payment } from "@/types";

export async function GET() {
  try {
    const [transactions, loans, payments] = await Promise.all([
      readCSV<Transaction>("transactions.csv"),
      readCSV<Loan>("loans.csv"),
      readCSV<Payment>("payments.csv"),
    ]);

    const paidMap: Record<number, number> = {};
    payments.forEach((p) => {
      paidMap[p.loan_id] = (paidMap[p.loan_id] || 0) + p.amount;
    });

    const totalIncome = transactions
      .filter((t) => t.transaction_type === "income")
      .reduce((s, t) => s + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.transaction_type === "expense")
      .reduce((s, t) => s + t.amount, 0);

    const outstandingBorrowing = loans
      .filter((l) => l.loan_type === "borrowing" && l.status !== "paid")
      .reduce((s, l) => s + (l.amount - (paidMap[l.loan_id] || 0)), 0);

    const outstandingLending = loans
      .filter((l) => l.loan_type === "lending" && l.status !== "paid")
      .reduce((s, l) => s + (l.amount - (paidMap[l.loan_id] || 0)), 0);

    const currentBalance = totalIncome - totalExpense + outstandingBorrowing - outstandingLending;

    return NextResponse.json({ currentBalance });
  } catch (error) {
    console.error("Error computing balance:", error);
    return NextResponse.json({ error: "Failed to compute balance" }, { status: 500 });
  }
}

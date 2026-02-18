import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const [incomeResult, expenseResult, loanResult] = await Promise.all([
      sql`SELECT COALESCE(SUM(amount),0)::bigint AS total FROM transactions WHERE transaction_type = 'income'`,
      sql`SELECT COALESCE(SUM(amount),0)::bigint AS total FROM transactions WHERE transaction_type = 'expense'`,
      sql`
        SELECT
          COALESCE(SUM(CASE WHEN l.loan_type = 'borrowing' AND l.status != 'paid' THEN l.amount - COALESCE(p.paid,0) ELSE 0 END),0)::bigint AS borrowing,
          COALESCE(SUM(CASE WHEN l.loan_type = 'lending'   AND l.status != 'paid' THEN l.amount - COALESCE(p.paid,0) ELSE 0 END),0)::bigint AS lending
        FROM loans l
        LEFT JOIN (SELECT loan_id, SUM(amount)::bigint AS paid FROM payments GROUP BY loan_id) p ON p.loan_id = l.loan_id
      `,
    ]);

    const totalIncome = Number((incomeResult[0] as { total: number }).total);
    const totalExpense = Number((expenseResult[0] as { total: number }).total);
    const { borrowing, lending } = loanResult[0] as { borrowing: number; lending: number };
    const currentBalance = totalIncome - totalExpense + Number(borrowing) - Number(lending);

    return NextResponse.json({ currentBalance });
  } catch (error) {
    console.error("Error computing balance:", error);
    return NextResponse.json({ error: "Failed to compute balance" }, { status: 500 });
  }
}

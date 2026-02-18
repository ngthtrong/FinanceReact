import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { LoanCreateInput } from "@/types";

function toLoan(r: Record<string, unknown>) {
  return {
    ...r,
    date: typeof r.date === "string" ? r.date : (r.date as Date).toISOString().slice(0, 10),
    amount: Number(r.amount),
    year: Number(r.year),
    month: Number(r.month),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const loan_type = searchParams.get("loan_type") || "all";
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    const counterparty = searchParams.get("counterparty") || "";

    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (loan_type && loan_type !== "all") {
      conditions.push(`l.loan_type = $${idx++}`);
      values.push(loan_type);
    }
    if (status && status !== "all") {
      conditions.push(`l.status = $${idx++}`);
      values.push(status);
    }
    if (search) {
      conditions.push(`(LOWER(l.title) LIKE $${idx} OR LOWER(l.counterparty) LIKE $${idx} OR LOWER(l.related_tags) LIKE $${idx})`);
      values.push(`%${search.toLowerCase()}%`);
      idx++;
    }
    if (counterparty) {
      conditions.push(`LOWER(l.counterparty) LIKE $${idx++}`);
      values.push(`%${counterparty.toLowerCase()}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = await sql.query(
      `SELECT l.*, COALESCE(SUM(p.amount), 0)::bigint AS paid_amount
       FROM loans l
       LEFT JOIN payments p ON p.loan_id = l.loan_id
       ${where}
       GROUP BY l.loan_id
       ORDER BY l.date DESC`,
      values
    );

    const loans = (rows as Record<string, unknown>[]).map((r) => {
      const loan = toLoan(r);
      const paid_amount = Number(r.paid_amount);
      const remaining_amount = Math.max(0, loan.amount - paid_amount);
      const payment_percentage = loan.amount > 0 ? Math.round((paid_amount / loan.amount) * 1000) / 10 : 0;
      return { ...loan, paid_amount, remaining_amount, payment_percentage };
    });

    return NextResponse.json(loans);
  } catch (error) {
    console.error("Error reading loans:", error);
    return NextResponse.json({ error: "Failed to read loans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: LoanCreateInput = await request.json();

    if (!body.title || body.amount == null || !body.date || !body.loan_type || !body.counterparty || !body.original_category) {
      return NextResponse.json(
        { error: "Missing required fields: title, amount, date, loan_type, counterparty, original_category" },
        { status: 400 }
      );
    }

    const dateObj = new Date(body.date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;

    const rows = await sql`
      INSERT INTO loans (title, amount, date, loan_type, status, counterparty, related_tags, original_category, year, month)
      VALUES (${body.title}, ${body.amount}, ${body.date}, ${body.loan_type}, 'outstanding', ${body.counterparty}, ${body.related_tags || ""}, ${body.original_category}, ${year}, ${month})
      RETURNING *
    `;

    return NextResponse.json(toLoan(rows[0] as Record<string, unknown>), { status: 201 });
  } catch (error) {
    console.error("Error creating loan:", error);
    return NextResponse.json({ error: "Failed to create loan" }, { status: 500 });
  }
}

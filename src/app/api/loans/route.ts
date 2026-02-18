import { NextRequest, NextResponse } from "next/server";
import { readCSV, writeCSV, getNextId, LOAN_HEADERS } from "@/lib/csv";
import { Loan, LoanCreateInput, Payment } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const loan_type = searchParams.get("loan_type") || "all";
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    const counterparty = searchParams.get("counterparty") || "";

    let loans = await readCSV<Loan>("loans.csv");

    // Read payments and build paid map
    const allPayments = await readCSV<Payment>("payments.csv");
    const paidMap: Record<number, number> = {};
    allPayments.forEach((p) => {
      paidMap[p.loan_id] = (paidMap[p.loan_id] || 0) + p.amount;
    });

    // Apply filters
    if (loan_type && loan_type !== "all") {
      loans = loans.filter((l) => l.loan_type === loan_type);
    }

    if (status && status !== "all") {
      loans = loans.filter((l) => l.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      loans = loans.filter(
        (l) =>
          l.title.toLowerCase().includes(searchLower) ||
          l.counterparty.toLowerCase().includes(searchLower) ||
          (l.related_tags && l.related_tags.toLowerCase().includes(searchLower))
      );
    }

    if (counterparty) {
      const cpLower = counterparty.toLowerCase();
      loans = loans.filter((l) =>
        l.counterparty.toLowerCase().includes(cpLower)
      );
    }

    // Enrich loans with payment data
    const enrichedLoans = loans.map((loan) => {
      const paid_amount = paidMap[loan.loan_id] || 0;
      const remaining_amount = Math.max(0, loan.amount - paid_amount);
      const payment_percentage =
        loan.amount > 0
          ? Math.round((paid_amount / loan.amount) * 1000) / 10
          : 0;
      return { ...loan, paid_amount, remaining_amount, payment_percentage };
    });

    return NextResponse.json(enrichedLoans);
  } catch (error) {
    console.error("Error reading loans:", error);
    return NextResponse.json(
      { error: "Failed to read loans" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: LoanCreateInput = await request.json();

    // Validate required fields
    if (!body.title || body.amount == null || !body.date || !body.loan_type || !body.counterparty || !body.original_category) {
      return NextResponse.json(
        { error: "Missing required fields: title, amount, date, loan_type, counterparty, original_category" },
        { status: 400 }
      );
    }

    const loans = await readCSV<Loan>("loans.csv");
    const nextId = getNextId(loans);

    const dateObj = new Date(body.date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;

    const newLoan: Loan = {
      loan_id: nextId,
      title: body.title,
      amount: body.amount,
      date: body.date,
      loan_type: body.loan_type,
      status: "outstanding",
      counterparty: body.counterparty,
      related_tags: body.related_tags || "",
      original_category: body.original_category,
      year,
      month,
    };

    loans.push(newLoan);
    await writeCSV("loans.csv", loans, LOAN_HEADERS);

    return NextResponse.json(newLoan, { status: 201 });
  } catch (error) {
    console.error("Error creating loan:", error);
    return NextResponse.json(
      { error: "Failed to create loan" },
      { status: 500 }
    );
  }
}

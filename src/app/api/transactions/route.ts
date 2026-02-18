import { NextRequest, NextResponse } from "next/server";
import { readCSV, writeCSV, getNextId, TRANSACTION_HEADERS } from "@/lib/csv";
import { Transaction, TransactionCreateInput, PaginatedResponse } from "@/types";
import { getDayOfWeek } from "@/lib/formatters";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const transaction_type = searchParams.get("transaction_type") || "all";
    const category = searchParams.get("category") || "";
    const category_group = searchParams.get("category_group") || "";
    const date_from = searchParams.get("date_from") || "";
    const date_to = searchParams.get("date_to") || "";
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const sort_by = searchParams.get("sort_by") || "date";
    const sort_order = searchParams.get("sort_order") || "desc";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const per_page = parseInt(searchParams.get("per_page") || "20", 10);

    let transactions = await readCSV<Transaction>("transactions.csv");

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      transactions = transactions.filter(
        (t) =>
          t.title.toLowerCase().includes(searchLower) ||
          t.category.toLowerCase().includes(searchLower) ||
          t.category_group.toLowerCase().includes(searchLower)
      );
    }

    if (transaction_type && transaction_type !== "all") {
      transactions = transactions.filter(
        (t) => t.transaction_type === transaction_type
      );
    }

    if (category) {
      transactions = transactions.filter((t) => t.category === category);
    }

    if (category_group) {
      transactions = transactions.filter(
        (t) => t.category_group === category_group
      );
    }

    if (date_from) {
      transactions = transactions.filter((t) => t.date >= date_from);
    }

    if (date_to) {
      transactions = transactions.filter((t) => t.date <= date_to);
    }

    if (year) {
      const yearNum = parseInt(year, 10);
      transactions = transactions.filter((t) => t.year === yearNum);
    }

    if (month) {
      const monthNum = parseInt(month, 10);
      transactions = transactions.filter((t) => t.month === monthNum);
    }

    // Apply sorting
    transactions.sort((a, b) => {
      let cmp = 0;
      switch (sort_by) {
        case "date":
          cmp = a.date.localeCompare(b.date);
          break;
        case "amount":
          cmp = a.amount - b.amount;
          break;
        case "category":
          cmp = a.category.localeCompare(b.category);
          break;
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "category_group":
          cmp = a.category_group.localeCompare(b.category_group);
          break;
        case "transaction_type":
          cmp = a.transaction_type.localeCompare(b.transaction_type);
          break;
        default:
          cmp = a.date.localeCompare(b.date);
      }
      return sort_order === "asc" ? cmp : -cmp;
    });

    // Pagination
    const total = transactions.length;
    const totalPages = Math.ceil(total / per_page);
    const startIndex = (page - 1) * per_page;
    const paginatedData = transactions.slice(startIndex, startIndex + per_page);

    const response: PaginatedResponse<Transaction> = {
      data: paginatedData,
      total,
      page,
      perPage: per_page,
      totalPages,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error reading transactions:", error);
    return NextResponse.json(
      { error: "Failed to read transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TransactionCreateInput = await request.json();

    // Validate required fields
    if (!body.date || !body.title || body.amount == null || !body.transaction_type || !body.category || !body.category_group) {
      return NextResponse.json(
        { error: "Missing required fields: date, title, amount, transaction_type, category, category_group" },
        { status: 400 }
      );
    }

    const transactions = await readCSV<Transaction>("transactions.csv");
    const nextId = getNextId(transactions);

    const dateObj = new Date(body.date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day_of_week = getDayOfWeek(body.date);
    const budget_impact = body.transaction_type === "income" ? body.amount : -body.amount;

    const newTransaction: Transaction = {
      id: nextId,
      date: body.date,
      title: body.title,
      amount: body.amount,
      transaction_type: body.transaction_type,
      category: body.category,
      category_group: body.category_group,
      special_tag: body.special_tag || "",
      budget_impact,
      year,
      month,
      day_of_week,
    };

    transactions.push(newTransaction);
    await writeCSV("transactions.csv", transactions, TRANSACTION_HEADERS);

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

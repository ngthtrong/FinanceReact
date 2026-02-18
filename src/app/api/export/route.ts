import { NextRequest, NextResponse } from "next/server";
import { readCSV, TRANSACTION_HEADERS } from "@/lib/csv";
import { Transaction } from "@/types";
import Papa from "papaparse";

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

    let transactions = await readCSV<Transaction>("transactions.csv");

    // Apply filters (same logic as transactions GET)
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

    // Sort by date descending for export
    transactions.sort((a, b) => b.date.localeCompare(a.date));

    // Generate CSV string
    const csvContent = Papa.unparse(transactions, {
      columns: TRANSACTION_HEADERS,
    });

    // Return as CSV file download
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="transactions_export_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting transactions:", error);
    return NextResponse.json(
      { error: "Failed to export transactions" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { readCSV, writeCSV, TRANSACTION_HEADERS } from "@/lib/csv";
import { Transaction } from "@/types";
import { getDayOfWeek } from "@/lib/formatters";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transactionId = parseInt(id, 10);
    const body = await request.json();

    const transactions = await readCSV<Transaction>("transactions.csv");
    const index = transactions.findIndex((t) => t.id === transactionId);

    if (index === -1) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const existing = transactions[index];

    // Update fields
    const updated: Transaction = {
      ...existing,
      date: body.date ?? existing.date,
      title: body.title ?? existing.title,
      amount: body.amount ?? existing.amount,
      transaction_type: body.transaction_type ?? existing.transaction_type,
      category: body.category ?? existing.category,
      category_group: body.category_group ?? existing.category_group,
      special_tag: body.special_tag ?? existing.special_tag,
    };

    // Recompute derived fields
    const dateObj = new Date(updated.date);
    updated.year = dateObj.getFullYear();
    updated.month = dateObj.getMonth() + 1;
    updated.day_of_week = getDayOfWeek(updated.date);
    updated.budget_impact =
      updated.transaction_type === "income" ? updated.amount : -updated.amount;

    transactions[index] = updated;
    await writeCSV("transactions.csv", transactions, TRANSACTION_HEADERS);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
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
    const transactionId = parseInt(id, 10);

    const transactions = await readCSV<Transaction>("transactions.csv");
    const index = transactions.findIndex((t) => t.id === transactionId);

    if (index === -1) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const filtered = transactions.filter((t) => t.id !== transactionId);
    await writeCSV("transactions.csv", filtered, TRANSACTION_HEADERS);

    return NextResponse.json({ success: true, deletedId: transactionId });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}

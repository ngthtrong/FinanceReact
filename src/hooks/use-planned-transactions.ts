"use client";

import useSWR, { useSWRConfig } from "swr";
import type {
  PlannedTransaction,
  PlannedTransactionCreateInput,
  FutureBalancePoint,
} from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const API = "/api/du-kien";

export function usePlannedTransactions() {
  const { data, error, isLoading, mutate } = useSWR<PlannedTransaction[]>(
    API,
    fetcher
  );
  const { mutate: globalMutate } = useSWRConfig();

  async function create(input: PlannedTransactionCreateInput) {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(await res.text());
    await mutate();
    globalMutate("/api/balance");
    return res.json();
  }

  async function update(id: number, input: Partial<PlannedTransactionCreateInput> & { is_active?: boolean }) {
    const res = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(await res.text());
    await mutate();
    return res.json();
  }

  async function remove(id: number) {
    const res = await fetch(`${API}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
    await mutate();
  }

  return { data: data ?? [], error, isLoading, mutate, create, update, remove };
}

/**
 * Compute future balance projections for the next `months` months,
 * starting from today, using the provided current balance and planned items.
 */
export function computeFutureBalance(
  currentBalance: number,
  items: PlannedTransaction[],
  months = 24
): FutureBalancePoint[] {
  const today = new Date();
  const activeItems = items.filter((i) => i.is_active);

  const points: FutureBalancePoint[] = [];
  let runningBalance = currentBalance;

  for (let i = 0; i < months; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1-based
    const monthLabel = `T${month}/${year}`;

    let income = 0;
    let expense = 0;

    for (const item of activeItems) {
      const pd = new Date(item.planned_date);
      const pYear = pd.getFullYear();
      const pMonth = pd.getMonth() + 1;

      let applies = false;
      if (item.recurrence === "once") {
        applies = pYear === year && pMonth === month;
      } else if (item.recurrence === "monthly") {
        // Applies if the planned start date has already arrived (year-month >=)
        applies =
          year > pYear || (year === pYear && month >= pMonth);
      } else if (item.recurrence === "yearly") {
        // Same month each year, starting from the planned year
        applies = pMonth === month && year >= pYear;
      }

      if (applies) {
        if (item.type === "income") income += item.amount;
        else expense += item.amount;
      }
    }

    const net = income - expense;
    runningBalance += net;

    points.push({ label: monthLabel, year, month, income, expense, net, balance: runningBalance });
  }

  return points;
}

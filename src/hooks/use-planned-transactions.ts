"use client";

import useSWR from "swr";
import type {
  PlannedTransaction,
  PlannedTransactionCreateInput,
  FutureBalancePoint,
  FutureBalanceLineItem,
} from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const API = "/api/du-kien";

// Temporary id for optimistic items
let tempId = -1;
function nextTempId() { return tempId--; }

export function usePlannedTransactions() {
  const { data, error, isLoading, mutate } = useSWR<PlannedTransaction[]>(
    API,
    fetcher,
    { revalidateOnFocus: false }
  );

  const current = data ?? [];

  // CREATE — optimistic: append a placeholder immediately, replace on confirm
  async function create(input: PlannedTransactionCreateInput) {
    const optimistic: PlannedTransaction = {
      id: nextTempId(),
      title: input.title,
      amount: input.amount,
      planned_date: input.planned_date,
      type: input.type,
      category: input.category ?? "",
      recurrence: input.recurrence,
      is_active: true,
      note: input.note ?? "",
      created_at: new Date().toISOString(),
    };

    await mutate(
      async (prev = []) => {
        const res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error(await res.text());
        const created: PlannedTransaction = await res.json();
        return [...prev, created];
      },
      {
        optimisticData: [...current, optimistic],
        rollbackOnError: true,
        revalidate: false,
      }
    );
  }

  // UPDATE — optimistic: patch the item in cache immediately
  async function update(
    id: number,
    input: Partial<PlannedTransactionCreateInput> & { is_active?: boolean }
  ) {
    const optimisticData = current.map((item) =>
      item.id === id ? { ...item, ...input } : item
    );

    await mutate(
      async (prev = []) => {
        const res = await fetch(`${API}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) throw new Error(await res.text());
        const updated: PlannedTransaction = await res.json();
        return prev.map((item) => (item.id === id ? updated : item));
      },
      {
        optimisticData,
        rollbackOnError: true,
        revalidate: false,
      }
    );
  }

  // REMOVE — optimistic: remove from cache immediately
  async function remove(id: number) {
    const optimisticData = current.filter((item) => item.id !== id);

    await mutate(
      async (prev = []) => {
        const res = await fetch(`${API}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(await res.text());
        return prev.filter((item) => item.id !== id);
      },
      {
        optimisticData,
        rollbackOnError: true,
        revalidate: false,
      }
    );
  }

  return { data: current, error, isLoading, mutate, create, update, remove };
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
    const incomeItems: FutureBalanceLineItem[] = [];
    const expenseItems: FutureBalanceLineItem[] = [];

    for (const item of activeItems) {
      const pd = new Date(item.planned_date);
      const pYear = pd.getFullYear();
      const pMonth = pd.getMonth() + 1;

      let applies = false;
      if (item.recurrence === "once") {
        applies = pYear === year && pMonth === month;
      } else if (item.recurrence === "monthly") {
        applies = year > pYear || (year === pYear && month >= pMonth);
      } else if (item.recurrence === "yearly") {
        applies = pMonth === month && year >= pYear;
      }

      if (applies) {
        if (item.type === "income") {
          income += item.amount;
          incomeItems.push({ title: item.title, amount: item.amount, category: item.category });
        } else {
          expense += item.amount;
          expenseItems.push({ title: item.title, amount: item.amount, category: item.category });
        }
      }
    }

    const net = income - expense;
    runningBalance += net;

    points.push({ label: monthLabel, year, month, income, expense, net, balance: runningBalance, incomeItems, expenseItems });
  }

  return points;
}

"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/use-settings";
import { SavingsGoalCard } from "@/components/settings/savings-goal-card";
import { SavingsGoalForm } from "@/components/settings/savings-goal-form";
import { CategoryLimitsEditor } from "@/components/settings/category-limits-editor";
import { Transaction, SavingsGoal, CategoryLimit } from "@/types";
import { Pencil } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ThietLapPage() {
  const { settings, isLoading: settingsLoading, updateSettings } = useSettings();
  const [goalFormOpen, setGoalFormOpen] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Fetch transactions for savings calculations
  const { data: allTx, isLoading: txLoading } = useSWR<{
    data: Transaction[];
  }>(`/api/transactions?per_page=100000`, fetcher);

  const transactions = allTx?.data || [];

  // Current month savings
  const monthlyIncome = transactions
    .filter(
      (t) =>
        t.year === currentYear &&
        t.month === currentMonth &&
        t.transaction_type === "income" &&
        t.special_tag !== "BigY"
    )
    .reduce((s, t) => s + t.amount, 0);

  const monthlyExpense = transactions
    .filter(
      (t) =>
        t.year === currentYear &&
        t.month === currentMonth &&
        t.transaction_type === "expense" &&
        t.special_tag !== "BigY"
    )
    .reduce((s, t) => s + t.amount, 0);

  const currentMonthlySavings = monthlyIncome - monthlyExpense;

  // Current year savings
  const yearlyIncome = transactions
    .filter(
      (t) =>
        t.year === currentYear &&
        t.transaction_type === "income" &&
        t.special_tag !== "BigY"
    )
    .reduce((s, t) => s + t.amount, 0);

  const yearlyExpense = transactions
    .filter(
      (t) =>
        t.year === currentYear &&
        t.transaction_type === "expense" &&
        t.special_tag !== "BigY"
    )
    .reduce((s, t) => s + t.amount, 0);

  const currentYearlySavings = yearlyIncome - yearlyExpense;

  const isLoading = settingsLoading || txLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const goal = settings?.savingsGoals ?? {
    monthlyTarget: 0,
    yearlyTarget: 0,
    notes: "",
  };

  const handleSaveGoal = async (newGoal: SavingsGoal) => {
    await updateSettings({ savingsGoals: newGoal });
  };

  const handleSaveLimits = async (limits: Record<string, CategoryLimit>) => {
    await updateSettings({ categoryLimits: limits });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Thiết lập</h1>

      {/* Savings Goals Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mục tiêu tiết kiệm</h2>
          <Button variant="outline" onClick={() => setGoalFormOpen(true)}>
            <Pencil className="size-4" />
            Thiết lập
          </Button>
        </div>
        <SavingsGoalCard
          goal={goal}
          currentMonthlySavings={currentMonthlySavings}
          currentYearlySavings={currentYearlySavings}
        />
      </div>

      {/* Category Limits Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Giới hạn chi tiêu</h2>
        <CategoryLimitsEditor
          categoryLimits={settings?.categoryLimits ?? {}}
          onSave={handleSaveLimits}
        />
      </div>

      {/* Savings Goal Form Dialog */}
      <SavingsGoalForm
        open={goalFormOpen}
        onOpenChange={setGoalFormOpen}
        goal={goal}
        onSave={handleSaveGoal}
      />
    </div>
  );
}

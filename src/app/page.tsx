"use client";

import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CashFlowSummary } from "@/components/dashboard/cash-flow-summary";
import { HealthScoreCard } from "@/components/dashboard/health-score-card";
import { SpendingTrendChart } from "@/components/dashboard/spending-trend-chart";
import { CategoryBreakdownChart } from "@/components/dashboard/category-breakdown-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { WarningAlerts } from "@/components/dashboard/warning-alerts";
import { LoanOverview } from "@/components/dashboard/loan-overview";
import { BalanceBanner } from "@/components/shared/balance-banner";
import { useDashboard } from "@/hooks/use-dashboard";
import { getWeekRange } from "@/lib/formatters";

type Period = "week" | "month" | "year" | "all";

export default function DashboardPage() {
  const now = new Date();
  const [period, setPeriod] = useState<Period>("month");

  const weekRange = useMemo(() => {
    const { start, end } = getWeekRange(now);
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    return { from: fmt(start), to: fmt(end) };
  }, []);

  const year = period === "all" || period === "week" ? undefined : now.getFullYear();
  const month = period === "month" ? now.getMonth() + 1 : undefined;
  const dateFrom = period === "week" ? weekRange.from : undefined;
  const dateTo = period === "week" ? weekRange.to : undefined;

  const { data, isLoading } = useDashboard(year, month, dateFrom, dateTo);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <BalanceBanner />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <BalanceBanner />

      {/* Header with period selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold md:text-2xl">Trang chủ</h1>
        <Tabs
          value={period}
          onValueChange={(v) => setPeriod(v as Period)}
        >
          <TabsList className="h-8">
            <TabsTrigger value="week" className="text-xs px-2.5 h-6">Tuần này</TabsTrigger>
            <TabsTrigger value="month" className="text-xs px-2.5 h-6">Tháng này</TabsTrigger>
            <TabsTrigger value="year" className="text-xs px-2.5 h-6">Năm nay</TabsTrigger>
            <TabsTrigger value="all" className="text-xs px-2.5 h-6">Tất cả</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Cash flow summary cards */}
      <CashFlowSummary summary={data.summary} />

      {/* Charts row: Spending trend + Health score */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SpendingTrendChart monthlyTrend={data.monthlyTrend} />
        </div>
        <HealthScoreCard healthScore={data.healthScore} />
      </div>

      {/* Category breakdown + Warnings */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CategoryBreakdownChart spendingByCategory={data.spendingByCategory} />
        </div>
        <WarningAlerts warnings={data.warnings} />
      </div>

      {/* Recent transactions + Loan overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentTransactions transactions={data.recentTransactions} />
        </div>
        <LoanOverview loanSummary={data.loanSummary} />
      </div>
    </div>
  );
}

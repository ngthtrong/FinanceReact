"use client";

import { Wallet, CreditCard, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatVND } from "@/lib/formatters";
import type { CashFlowSummary as CashFlowSummaryType } from "@/types";

interface CashFlowSummaryProps {
  summary: CashFlowSummaryType;
}

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}

function MetricCard({ label, value, icon, colorClass, bgClass }: MetricCardProps) {
  return (
    <Card className="gap-4 py-4">
      <CardContent className="flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${bgClass}`}>
          <div className={colorClass}>{icon}</div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`text-lg font-bold tracking-tight ${colorClass}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function CashFlowSummary({ summary }: CashFlowSummaryProps) {
  const isPositiveNet = summary.netCashFlow >= 0;

  const metrics: MetricCardProps[] = [
    {
      label: "Tổng thu nhập",
      value: formatVND(summary.totalIncome),
      icon: <Wallet className="h-5 w-5" />,
      colorClass: "text-green-600",
      bgClass: "bg-green-50 dark:bg-green-950/30",
    },
    {
      label: "Tổng chi tiêu",
      value: formatVND(summary.totalExpense),
      icon: <CreditCard className="h-5 w-5" />,
      colorClass: "text-red-600",
      bgClass: "bg-red-50 dark:bg-red-950/30",
    },
    {
      label: "Dòng tiền ròng",
      value: formatVND(summary.netCashFlow),
      icon: isPositiveNet ? (
        <TrendingUp className="h-5 w-5" />
      ) : (
        <TrendingDown className="h-5 w-5" />
      ),
      colorClass: isPositiveNet ? "text-blue-600" : "text-red-600",
      bgClass: isPositiveNet
        ? "bg-blue-50 dark:bg-blue-950/30"
        : "bg-red-50 dark:bg-red-950/30",
    },
    {
      label: "Tỷ lệ tiết kiệm",
      value: `${summary.savingsRate.toFixed(1)}%`,
      icon: <PiggyBank className="h-5 w-5" />,
      colorClass:
        summary.savingsRate >= 20
          ? "text-green-600"
          : summary.savingsRate >= 10
            ? "text-yellow-600"
            : "text-red-600",
      bgClass:
        summary.savingsRate >= 20
          ? "bg-green-50 dark:bg-green-950/30"
          : summary.savingsRate >= 10
            ? "bg-yellow-50 dark:bg-yellow-950/30"
            : "bg-red-50 dark:bg-red-950/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} {...metric} />
      ))}
    </div>
  );
}

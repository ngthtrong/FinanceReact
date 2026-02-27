"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MonthlyReportSummary } from "@/types";
import { formatVND } from "@/lib/formatters";
import { TrendingUp, TrendingDown, Minus, DollarSign, Receipt, PiggyBank, CalendarDays } from "lucide-react";

interface Props {
  summary: MonthlyReportSummary;
}

function TrendBadge({ value, suffix = "" }: { value: number; suffix?: string }) {
  if (Math.abs(value) < 0.5)
    return <Badge variant="outline" className="gap-1 text-xs"><Minus className="size-3" />0%{suffix}</Badge>;
  if (value > 0)
    return (
      <Badge variant="destructive" className="gap-1 text-xs">
        <TrendingUp className="size-3" />+{value.toFixed(1)}%{suffix}
      </Badge>
    );
  return (
    <Badge className="gap-1 text-xs bg-green-600 hover:bg-green-700">
      <TrendingDown className="size-3" />{value.toFixed(1)}%{suffix}
    </Badge>
  );
}

export function MonthSummaryCards({ summary }: Props) {
  const vs = summary.vsLastMonth;

  const cards = [
    {
      title: "Thu nhập",
      value: formatVND(summary.totalIncome),
      icon: DollarSign,
      change: vs.incomeChangePercent,
      changeLabel: "vs tháng trước",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/50",
    },
    {
      title: "Chi tiêu",
      value: formatVND(summary.totalExpense),
      icon: Receipt,
      change: vs.expenseChangePercent,
      changeLabel: "vs tháng trước",
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-950/50",
    },
    {
      title: "Tiết kiệm",
      value: formatVND(summary.netCashFlow),
      icon: PiggyBank,
      change: vs.savingsRateChange,
      changeLabel: "tỷ lệ",
      color: summary.netCashFlow >= 0
        ? "text-green-600 dark:text-green-400"
        : "text-red-600 dark:text-red-400",
      bgColor: summary.netCashFlow >= 0
        ? "bg-green-50 dark:bg-green-950/50"
        : "bg-red-50 dark:bg-red-950/50",
    },
    {
      title: "Chi TB/ngày",
      value: formatVND(summary.avgDailyExpense),
      icon: CalendarDays,
      change: 0,
      changeLabel: `${summary.transactionCount} giao dịch`,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`size-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
            <div className="flex items-center gap-2 mt-1">
              {card.title !== "Chi TB/ngày" ? (
                <TrendBadge value={card.change} />
              ) : null}
              <span className="text-xs text-muted-foreground">{card.changeLabel}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

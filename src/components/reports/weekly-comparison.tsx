"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WeeklyComparison as WeeklyComparisonType } from "@/types";
import { formatVND } from "@/lib/formatters";
import { CHART_COLORS } from "@/lib/constants";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

interface Props {
  weeks: WeeklyComparisonType[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmtVND = (v: any) => formatVND(Number(v ?? 0));

export function WeeklyComparisonChart({ weeks }: Props) {
  const chartData = weeks.map((w) => ({
    name: w.weekLabel,
    "Chi tiêu": w.totalExpense,
    "Thu nhập": w.totalIncome,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          So sánh chi tiêu theo tuần
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}tr`} />
              <Tooltip formatter={fmtVND} />
              <Legend />
              <Bar dataKey="Chi tiêu" fill="#ef4444" />
              <Bar dataKey="Thu nhập" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {weeks.map((week, i) => (
            <div
              key={week.weekNumber}
              className="rounded-lg border p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{week.weekLabel}</span>
                <Badge
                  variant={week.vsWeeklyBudget > 0 ? "destructive" : "outline"}
                  className="text-xs"
                >
                  {week.vsWeeklyBudget > 0 ? "+" : ""}{week.vsWeeklyBudget}%
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {week.startDate} → {week.endDate}
              </div>
              <div className="text-lg font-bold" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>
                {formatVND(week.totalExpense)}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>TB: {formatVND(week.avgDaily)}/ngày</span>
                <span>{week.transactionCount} GD</span>
              </div>
              <div className="text-xs">
                Top: <span className="font-medium">{week.topCategory}</span>{" "}
                ({formatVND(week.topCategoryAmount)})
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

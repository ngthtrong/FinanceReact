"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Transaction } from "@/types";
import { formatVND } from "@/lib/formatters";
import { CHART_COLORS } from "@/lib/constants";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { FileBarChart } from "lucide-react";
import { usePersistedState } from "@/hooks/use-persisted-state";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmtVND = (v: any) => formatVND(Number(v ?? 0));

export default function BaoCaoPage() {
  const now = new Date();
  const [year, setYear] = usePersistedState("finance:report-year", now.getFullYear());
  const [compareMonth1, setCompareMonth1] = usePersistedState("finance:report-compare-month1", now.getMonth() + 1);
  const [compareMonth2, setCompareMonth2] = usePersistedState(
    "finance:report-compare-month2",
    now.getMonth() === 0 ? 12 : now.getMonth()
  );

  const { data: allTx, isLoading } = useSWR<{ data: Transaction[] }>(
    `/api/transactions?per_page=10000&year=${year}`,
    fetcher
  );

  const transactions = allTx?.data || [];

  // Monthly comparison data
  const month1Data = transactions.filter(
    (t) => t.month === compareMonth1 && t.transaction_type === "expense" && t.special_tag !== "BigY"
  );
  const month2Data = transactions.filter(
    (t) => t.month === compareMonth2 && t.transaction_type === "expense" && t.special_tag !== "BigY"
  );

  const groupsSet = new Set([
    ...month1Data.map((t) => t.category_group),
    ...month2Data.map((t) => t.category_group),
  ]);

  const compareData = Array.from(groupsSet).map((group) => ({
    group,
    [`T${compareMonth1}`]: month1Data
      .filter((t) => t.category_group === group)
      .reduce((s, t) => s + t.amount, 0),
    [`T${compareMonth2}`]: month2Data
      .filter((t) => t.category_group === group)
      .reduce((s, t) => s + t.amount, 0),
  }));

  // Day of week analysis
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const dayLabels: Record<string, string> = {
    Monday: "T2", Tuesday: "T3", Wednesday: "T4",
    Thursday: "T5", Friday: "T6", Saturday: "T7", Sunday: "CN",
  };
  const expenseByDay = dayOrder.map((day) => {
    const dayTx = transactions.filter(
      (t) => t.day_of_week === day && t.transaction_type === "expense" && t.special_tag !== "BigY"
    );
    const total = dayTx.reduce((s, t) => s + t.amount, 0);
    const count = dayTx.length || 1;
    return { day: dayLabels[day], total, avg: Math.round(total / count), count: dayTx.length };
  });

  // Category ranking
  const categoryTotals: Record<string, number> = {};
  transactions
    .filter((t) => t.transaction_type === "expense" && t.special_tag !== "BigY")
    .forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([category, total]) => ({ category, total }));

  const totalExpense = Object.values(categoryTotals).reduce((s, v) => s + v, 0);
  const pieData = topCategories.map((c) => ({
    name: c.category,
    value: c.total,
    percentage: totalExpense > 0 ? ((c.total / totalExpense) * 100).toFixed(1) : "0",
  }));

  // Monthly totals
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const income = transactions
      .filter((t) => t.month === m && t.transaction_type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expense = transactions
      .filter((t) => t.month === m && t.transaction_type === "expense" && t.special_tag !== "BigY")
      .reduce((s, t) => s + t.amount, 0);
    return { label: `T${m}`, income, expense, net: income - expense };
  }).filter((d) => d.income > 0 || d.expense > 0);

  // Static list of selectable years (from 2023 to current year)
  const currentYear = now.getFullYear();
  const years = Array.from({ length: currentYear - 2023 + 1 }, (_, i) => currentYear - i);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Báo cáo chi tiết</h1>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                Năm {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Link
          href="/bao-cao/chi-tiet"
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <FileBarChart className="size-4" />
          So sánh 2023–2025
        </Link>
      </div>

      {/* Monthly overview */}
      <Card>
        <CardHeader>
          <CardTitle>Tổng quan thu chi theo tháng - {year}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}tr`} />
                <Tooltip
                  formatter={fmtVND}
                  labelFormatter={(label) => `Tháng ${label}`}
                />
                <Legend />
                <Bar dataKey="income" name="Thu nhập" fill="#22c55e" />
                <Bar dataKey="expense" name="Chi tiêu" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Month comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              So sánh chi tiêu
              <Select value={String(compareMonth1)} onValueChange={(v) => setCompareMonth1(Number(v))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      T{i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              vs
              <Select value={String(compareMonth2)} onValueChange={(v) => setCompareMonth2(Number(v))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      T{i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compareData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="group" fontSize={12} />
                  <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}tr`} />
                  <Tooltip formatter={fmtVND} />
                  <Legend />
                  <Bar dataKey={`T${compareMonth1}`} name={`Tháng ${compareMonth1}`} fill="#3b82f6" />
                  <Bar dataKey={`T${compareMonth2}`} name={`Tháng ${compareMonth2}`} fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top categories pie */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 danh mục chi tiêu - {year}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percentage }: { name?: string; percentage?: string }) => `${name} (${percentage}%)`}
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={fmtVND} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Day of week analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Chi tiêu theo ngày trong tuần</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}tr`} />
                  <Tooltip
                    formatter={fmtVND}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Bar dataKey="total" name="Tổng chi" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category ranking table */}
        <Card>
          <CardHeader>
            <CardTitle>Xếp hạng danh mục chi tiêu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topCategories.map((c, i) => {
                const pct = totalExpense > 0 ? (c.total / totalExpense) * 100 : 0;
                return (
                  <div key={c.category} className="flex items-center gap-3">
                    <span className="text-sm font-mono w-6 text-muted-foreground">
                      {i + 1}.
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{c.category}</span>
                        <span className="font-medium">{formatVND(c.total)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

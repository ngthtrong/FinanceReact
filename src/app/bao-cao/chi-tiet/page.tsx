"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Transaction } from "@/types";
import { formatVND } from "@/lib/formatters";
import { CHART_COLORS } from "@/lib/constants";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmtVND = (v: any) => formatVND(Number(v ?? 0));

/* ── Dynamic color palette for years ── */
const YEAR_COLOR_PALETTE = [
  "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

function getYearColor(year: number, availableYears: number[]): string {
  const idx = availableYears.indexOf(year);
  return YEAR_COLOR_PALETTE[idx % YEAR_COLOR_PALETTE.length];
}

export default function ChiTietPage() {
  const { data: allTx, isLoading } = useSWR<{ data: Transaction[] }>(
    `/api/transactions?per_page=100000`,
    fetcher
  );

  const allTransactions = allTx?.data || [];

  /* ── Detect all years with data ── */
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    allTransactions.forEach((t) => yearsSet.add(t.year));
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [allTransactions]);

  const [selectedYears, setSelectedYears] = useState<number[]>([]);

  /* Auto-select all years once data loads (only on first load) */
  const effectiveYears = useMemo(() => {
    if (selectedYears.length > 0) return selectedYears.filter((y) => availableYears.includes(y));
    return availableYears;
  }, [selectedYears, availableYears]);

  const toggleYear = (year: number) => {
    setSelectedYears((prev) => {
      const current = prev.length > 0 ? prev : availableYears;
      if (current.includes(year)) {
        const next = current.filter((y) => y !== year);
        return next.length === 0 ? [year] : next; // keep at least 1 selected
      }
      return [...current, year].sort((a, b) => a - b);
    });
  };

  const selectAllYears = () => setSelectedYears([...availableYears]);

  const YEARS = effectiveYears;
  const transactions = allTransactions.filter((t) => YEARS.includes(t.year));

  /* ── Per-year KPIs ── */
  const yearData = YEARS.map((year) => {
    const yearTx = transactions.filter((t) => t.year === year);
    const income = yearTx
      .filter((t) => t.transaction_type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expense = yearTx
      .filter((t) => t.transaction_type === "expense" && t.special_tag !== "BigY")
      .reduce((s, t) => s + t.amount, 0);
    const net = income - expense;
    const savingsRate = income > 0 ? (net / income) * 100 : 0;
    const txCount = yearTx.length;
    return { year, income, expense, net, savingsRate, txCount };
  });

  /* ── Monthly expense trend (overlaid lines) ── */
  const monthlyExpenseTrend = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: Record<string, any> = { month: `T${m}` };
    YEARS.forEach((year) => {
      row[`expense_${year}`] = transactions
        .filter(
          (t) =>
            t.year === year &&
            t.month === m &&
            t.transaction_type === "expense" &&
            t.special_tag !== "BigY"
        )
        .reduce((s, t) => s + t.amount, 0);
    });
    return row;
  });

  /* ── Monthly savings rate ── */
  const savingsRateData = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: Record<string, any> = { month: `T${m}` };
    YEARS.forEach((year) => {
      const inc = transactions
        .filter((t) => t.year === year && t.month === m && t.transaction_type === "income")
        .reduce((s, t) => s + t.amount, 0);
      const exp = transactions
        .filter(
          (t) =>
            t.year === year &&
            t.month === m &&
            t.transaction_type === "expense" &&
            t.special_tag !== "BigY"
        )
        .reduce((s, t) => s + t.amount, 0);
      row[`rate_${year}`] = inc > 0 ? Math.round(((inc - exp) / inc) * 100) : 0;
    });
    return row;
  });

  /* ── Category-group comparison across years ── */
  const allGroups = new Set<string>();
  transactions
    .filter((t) => t.transaction_type === "expense" && t.special_tag !== "BigY")
    .forEach((t) => allGroups.add(t.category_group));

  const groupCompareData = Array.from(allGroups)
    .map((group) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row: Record<string, any> = { group };
      YEARS.forEach((year) => {
        row[`y${year}`] = transactions
          .filter(
            (t) =>
              t.year === year &&
              t.category_group === group &&
              t.transaction_type === "expense" &&
              t.special_tag !== "BigY"
          )
          .reduce((s, t) => s + t.amount, 0);
      });
      return row;
    })
    .sort((a, b) => {
      const totalA = YEARS.reduce((s, y) => s + (a[`y${y}`] || 0), 0);
      const totalB = YEARS.reduce((s, y) => s + (b[`y${y}`] || 0), 0);
      return totalB - totalA;
    });

  /* ── Category changes between adjacent years ── */
  function getCategoryChanges(fromYear: number, toYear: number) {
    const fromTx = transactions.filter(
      (t) => t.year === fromYear && t.transaction_type === "expense" && t.special_tag !== "BigY"
    );
    const toTx = transactions.filter(
      (t) => t.year === toYear && t.transaction_type === "expense" && t.special_tag !== "BigY"
    );
    const fromCats: Record<string, number> = {};
    const toCats: Record<string, number> = {};
    fromTx.forEach((t) => {
      fromCats[t.category] = (fromCats[t.category] || 0) + t.amount;
    });
    toTx.forEach((t) => {
      toCats[t.category] = (toCats[t.category] || 0) + t.amount;
    });
    const allCats = new Set([...Object.keys(fromCats), ...Object.keys(toCats)]);
    return Array.from(allCats)
      .map((cat) => ({
        category: cat,
        fromAmount: fromCats[cat] || 0,
        toAmount: toCats[cat] || 0,
        change: (toCats[cat] || 0) - (fromCats[cat] || 0),
        changePercent:
          (fromCats[cat] || 0) > 0
            ? (((toCats[cat] || 0) - (fromCats[cat] || 0)) / (fromCats[cat] || 0)) * 100
            : (toCats[cat] || 0) > 0
              ? 100
              : 0,
      }))
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 8);
  }

  /* ── Per-year helpers ── */
  function getYearMonthlyData(year: number) {
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const income = transactions
        .filter((t) => t.year === year && t.month === m && t.transaction_type === "income")
        .reduce((s, t) => s + t.amount, 0);
      const expense = transactions
        .filter(
          (t) =>
            t.year === year &&
            t.month === m &&
            t.transaction_type === "expense" &&
            t.special_tag !== "BigY"
        )
        .reduce((s, t) => s + t.amount, 0);
      return { label: `T${m}`, income, expense, net: income - expense };
    }).filter((d) => d.income > 0 || d.expense > 0);
  }

  function getYearCategoryData(year: number) {
    const yearTx = transactions.filter(
      (t) => t.year === year && t.transaction_type === "expense" && t.special_tag !== "BigY"
    );
    const catTotals: Record<string, number> = {};
    yearTx.forEach((t) => {
      catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
    });
    const totalExpense = Object.values(catTotals).reduce((s, v) => s + v, 0);
    return Object.entries(catTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([category, total]) => ({
        category,
        total,
        percentage: totalExpense > 0 ? (total / totalExpense) * 100 : 0,
      }));
  }

  function getYearGroupData(year: number) {
    const yearTx = transactions.filter(
      (t) => t.year === year && t.transaction_type === "expense" && t.special_tag !== "BigY"
    );
    const groupTotals: Record<string, number> = {};
    yearTx.forEach((t) => {
      groupTotals[t.category_group] = (groupTotals[t.category_group] || 0) + t.amount;
    });
    const total = Object.values(groupTotals).reduce((s, v) => s + v, 0);
    return Object.entries(groupTotals)
      .sort(([, a], [, b]) => b - a)
      .map(([group, amount]) => ({
        name: group,
        value: amount,
        percentage: total > 0 ? ((amount / total) * 100).toFixed(1) : "0",
      }));
  }

  function getYoYChange(current: number, previous: number) {
    if (previous === 0) return { change: 0, trend: "neutral" as const };
    const change = ((current - previous) / previous) * 100;
    if (change > 5) return { change, trend: "up" as const };
    if (change < -5) return { change, trend: "down" as const };
    return { change, trend: "neutral" as const };
  }

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
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
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Link
          href="/bao-cao"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-bold">
          Báo cáo chi tiết {YEARS.length > 0 ? `${YEARS[0]} – ${YEARS[YEARS.length - 1]}` : ""}
        </h1>
      </div>

      {/* ── Year selector ── */}
      {availableYears.length > 0 && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-muted-foreground">Chọn năm so sánh:</span>
              {availableYears.map((year) => {
                const isSelected = YEARS.includes(year);
                return (
                  <Button
                    key={year}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleYear(year)}
                    style={isSelected ? { backgroundColor: getYearColor(year, availableYears), borderColor: getYearColor(year, availableYears) } : {}}
                  >
                    {year}
                  </Button>
                );
              })}
              {effectiveYears.length < availableYears.length && (
                <Button variant="ghost" size="sm" onClick={selectAllYears} className="text-xs">
                  Chọn tất cả
                </Button>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                Đang so sánh {YEARS.length} / {availableYears.length} năm có dữ liệu
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Year summary cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {yearData.map((yd, idx) => {
          const prevYd = idx > 0 ? yearData[idx - 1] : null;
          const expenseChange = prevYd
            ? getYoYChange(yd.expense, prevYd.expense)
            : null;

          return (
            <Card key={yd.year}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">Năm {yd.year}</span>
                  <Badge variant="outline">{yd.txCount} giao dịch</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Thu nhập</span>
                  <span className="text-sm font-medium text-green-600">
                    {formatVND(yd.income)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Chi tiêu</span>
                  <span className="text-sm font-medium text-red-500">
                    {formatVND(yd.expense)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm text-muted-foreground">Dòng tiền ròng</span>
                  <span
                    className={`text-sm font-bold ${
                      yd.net >= 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {formatVND(yd.net)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tỷ lệ tiết kiệm</span>
                  <span
                    className={`text-sm font-medium ${
                      yd.savingsRate >= 20
                        ? "text-green-600"
                        : yd.savingsRate >= 0
                          ? "text-yellow-500"
                          : "text-red-500"
                    }`}
                  >
                    {yd.savingsRate.toFixed(1)}%
                  </span>
                </div>
                {expenseChange && (
                  <div className="flex items-center gap-1 text-xs pt-1 border-t">
                    {expenseChange.trend === "up" ? (
                      <TrendingUp className="size-3 text-red-500" />
                    ) : expenseChange.trend === "down" ? (
                      <TrendingDown className="size-3 text-green-500" />
                    ) : (
                      <Minus className="size-3 text-muted-foreground" />
                    )}
                    <span
                      className={
                        expenseChange.trend === "up"
                          ? "text-red-500"
                          : expenseChange.trend === "down"
                            ? "text-green-500"
                            : "text-muted-foreground"
                      }
                    >
                      Chi tiêu {expenseChange.change > 0 ? "+" : ""}
                      {expenseChange.change.toFixed(1)}% so với {yd.year - 1}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Year-over-year comparison ── */}
      <Card>
        <CardHeader>
          <CardTitle>So sánh thu chi qua các năm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={yearData.map((yd) => ({
                  name: String(yd.year),
                  "Thu nhập": yd.income,
                  "Chi tiêu": yd.expense,
                  Ròng: yd.net,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}tr`} />
                <Tooltip formatter={fmtVND} />
                <Legend />
                <Bar dataKey="Thu nhập" fill="#22c55e" />
                <Bar dataKey="Chi tiêu" fill="#ef4444" />
                <Bar dataKey="Ròng" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Monthly trends ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expense trend lines */}
        <Card>
          <CardHeader>
            <CardTitle>Xu hướng chi tiêu hàng tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyExpenseTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}tr`} />
                  <Tooltip formatter={fmtVND} />
                  <Legend />
                  {YEARS.map((year) => (
                    <Line
                      key={year}
                      type="monotone"
                      dataKey={`expense_${year}`}
                      name={String(year)}
                      stroke={getYearColor(year, availableYears)}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Savings rate lines */}
        <Card>
          <CardHeader>
            <CardTitle>Tỷ lệ tiết kiệm hàng tháng (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={savingsRateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `${v}%`} />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Legend />
                  {YEARS.map((year) => (
                    <Line
                      key={year}
                      type="monotone"
                      dataKey={`rate_${year}`}
                      name={String(year)}
                      stroke={getYearColor(year, availableYears)}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Category group comparison ── */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiêu theo nhóm danh mục qua các năm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupCompareData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}tr`}
                />
                <YAxis type="category" dataKey="group" width={100} fontSize={12} />
                <Tooltip formatter={fmtVND} />
                <Legend />
                {YEARS.map((year) => (
                  <Bar
                    key={year}
                    dataKey={`y${year}`}
                    name={String(year)}
                    fill={getYearColor(year, availableYears)}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Category changes between years ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {YEARS.slice(0, -1).map((from, i) => {
          const to = YEARS[i + 1];
          return [from, to] as const;
        }).map(([from, to]) => {
          const changes = getCategoryChanges(from, to);
          return (
            <Card key={`${from}-${to}`}>
              <CardHeader>
                <CardTitle>
                  Biến động danh mục {from} &rarr; {to}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {changes.map((c) => (
                    <div
                      key={c.category}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex-1 truncate">{c.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs w-24 text-right">
                          {formatVND(c.fromAmount)}
                        </span>
                        <span className="text-xs">&rarr;</span>
                        <span className="text-xs w-24 text-right">
                          {formatVND(c.toAmount)}
                        </span>
                        <span
                          className={`text-xs font-medium w-16 text-right ${
                            c.change > 0
                              ? "text-red-500"
                              : c.change < 0
                                ? "text-green-500"
                                : "text-muted-foreground"
                          }`}
                        >
                          {c.change > 0 ? "+" : ""}
                          {c.changePercent.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Per-year detail tabs ── */}
      <Tabs defaultValue={String(YEARS[0] ?? "")}>
        <TabsList>
          {YEARS.map((year) => (
            <TabsTrigger key={year} value={String(year)}>
              Chi tiết {year}
            </TabsTrigger>
          ))}
        </TabsList>

        {YEARS.map((year) => {
          const monthlyData = getYearMonthlyData(year);
          const categoryData = getYearCategoryData(year);
          const groupData = getYearGroupData(year);

          return (
            <TabsContent
              key={year}
              value={String(year)}
              className="space-y-6 mt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monthly income / expense */}
                <Card>
                  <CardHeader>
                    <CardTitle>Thu chi hàng tháng – {year}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis
                            tickFormatter={(v) =>
                              `${(v / 1_000_000).toFixed(0)}tr`
                            }
                          />
                          <Tooltip formatter={fmtVND} />
                          <Legend />
                          <Bar dataKey="income" name="Thu nhập" fill="#22c55e" />
                          <Bar
                            dataKey="expense"
                            name="Chi tiêu"
                            fill="#ef4444"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Pie chart by group */}
                <Card>
                  <CardHeader>
                    <CardTitle>Phân bổ theo nhóm – {year}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={groupData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({
                              name,
                              percentage,
                            }: {
                              name?: string;
                              percentage?: string;
                            }) => `${name} (${percentage}%)`}
                          >
                            {groupData.map((_, idx) => (
                              <Cell
                                key={idx}
                                fill={CHART_COLORS[idx % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={fmtVND} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Category ranking */}
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 danh mục chi tiêu – {year}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categoryData.map((c, i) => (
                      <div key={c.category} className="flex items-center gap-3">
                        <span className="text-sm font-mono w-6 text-muted-foreground">
                          {i + 1}.
                        </span>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{c.category}</span>
                            <span className="font-medium">
                              {formatVND(c.total)}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${c.percentage}%`,
                                backgroundColor:
                                  CHART_COLORS[i % CHART_COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {c.percentage.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

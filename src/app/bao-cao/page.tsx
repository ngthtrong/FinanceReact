"use client";

import Link from "next/link";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Transaction, MonthlyReport } from "@/types";
import { formatVND } from "@/lib/formatters";
import { CHART_COLORS } from "@/lib/constants";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { FileBarChart, Calendar, BarChart3, AlertTriangle, Lightbulb, TrendingUp } from "lucide-react";
import { usePersistedState } from "@/hooks/use-persisted-state";

import { MonthSummaryCards } from "@/components/reports/month-summary-cards";
import { WeeklyComparisonChart } from "@/components/reports/weekly-comparison";
import { LargeExpensesList } from "@/components/reports/large-expenses-list";
import { OverBudgetList } from "@/components/reports/over-budget-list";
import { AnomalyDetection } from "@/components/reports/anomaly-detection";
import { ImprovementSuggestions } from "@/components/reports/improvement-suggestions";
import { CategoryTrendsChart } from "@/components/reports/category-trends";
import { SavingsAnalysisCard } from "@/components/reports/savings-analysis";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmtVND = (v: any) => formatVND(Number(v ?? 0));

export default function BaoCaoPage() {
  const now = new Date();
  const [year, setYear] = usePersistedState("finance:report-year", now.getFullYear());
  const [month, setMonth] = usePersistedState("finance:report-month", now.getMonth() + 1);
  const [compareMonth1, setCompareMonth1] = usePersistedState("finance:report-compare-month1", now.getMonth() + 1);
  const [compareMonth2, setCompareMonth2] = usePersistedState(
    "finance:report-compare-month2",
    now.getMonth() === 0 ? 12 : now.getMonth()
  );

  const { data: allTx, isLoading: txLoading } = useSWR<{ data: Transaction[] }>(
    `/api/transactions?per_page=10000&year=${year}`,
    fetcher
  );

  // Fetch monthly report
  const { data: monthlyReport, isLoading: reportLoading } = useSWR<MonthlyReport>(
    `/api/bao-cao?year=${year}&month=${month}`,
    fetcher
  );

  const transactions = allTx?.data || [];
  const isLoading = txLoading || reportLoading;

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
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
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
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
        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => (
              <SelectItem key={i + 1} value={String(i + 1)}>
                Tháng {i + 1}
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

      {/* Tabs */}
      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly" className="gap-1.5">
            <Calendar className="size-4" />
            Báo cáo tháng
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-1.5">
            <AlertTriangle className="size-4" />
            Phân tích & Cảnh báo
          </TabsTrigger>
          <TabsTrigger value="yearly" className="gap-1.5">
            <BarChart3 className="size-4" />
            Tổng quan năm
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="gap-1.5">
            <Lightbulb className="size-4" />
            Gợi ý cải thiện
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: Monthly Report ── */}
        <TabsContent value="monthly" className="space-y-6">
          {monthlyReport && (
            <>
              <MonthSummaryCards summary={monthlyReport.summary} />
              <WeeklyComparisonChart weeks={monthlyReport.weeklyComparison} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SavingsAnalysisCard analysis={monthlyReport.savingsAnalysis} />
                <LargeExpensesList expenses={monthlyReport.largeExpenses} />
              </div>
            </>
          )}
        </TabsContent>

        {/* ── TAB 2: Analysis & Warnings ── */}
        <TabsContent value="analysis" className="space-y-6">
          {monthlyReport && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OverBudgetList categories={monthlyReport.overBudgetCategories} />
                <AnomalyDetection anomalies={monthlyReport.anomalies} />
              </div>
              <CategoryTrendsChart trends={monthlyReport.categoryTrends} />
            </>
          )}
        </TabsContent>

        {/* ── TAB 3: Yearly Overview ── */}
        <TabsContent value="yearly" className="space-y-6">
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
        </TabsContent>

        {/* ── TAB 4: Improvement Suggestions ── */}
        <TabsContent value="suggestions" className="space-y-6">
          {monthlyReport && (
            <>
              <ImprovementSuggestions suggestions={monthlyReport.improvementSuggestions} />

              {/* Roadmap card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="size-5 text-blue-500" />
                    Kế hoạch cải thiện tài chính
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Phase 1 */}
                    <div className="relative pl-6 border-l-2 border-blue-300 dark:border-blue-700">
                      <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-500" />
                      <h3 className="font-semibold text-sm mb-1">Giai đoạn 1: Kiểm soát (Tuần 1-2)</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Xem xét các danh mục vượt ngân sách và đặt giới hạn thực tế</li>
                        <li>• Áp dụng quy tắc chi tiêu hàng ngày (theo dõi mỗi tối)</li>
                        <li>• Thiết lập cảnh báo khi chi tiêu vượt 80% ngưỡng</li>
                      </ul>
                    </div>

                    {/* Phase 2 */}
                    <div className="relative pl-6 border-l-2 border-green-300 dark:border-green-700">
                      <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-green-500" />
                      <h3 className="font-semibold text-sm mb-1">Giai đoạn 2: Tối ưu (Tuần 3-4)</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Giảm 10-15% chi tiêu ở các danh mục có xu hướng tăng</li>
                        <li>• Tìm các khoản chi bất thường và đánh giá cần thiết</li>
                        <li>• Chuyển ngân sách dư từ danh mục giảm sang tiết kiệm</li>
                      </ul>
                    </div>

                    {/* Phase 3 */}
                    <div className="relative pl-6 border-l-2 border-purple-300 dark:border-purple-700">
                      <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-purple-500" />
                      <h3 className="font-semibold text-sm mb-1">Giai đoạn 3: Phát triển (Tháng tiếp)</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Tăng tỷ lệ tiết kiệm lên mục tiêu {monthlyReport.savingsAnalysis.targetSavingsRate}%</li>
                        <li>• Đa dạng hóa nguồn thu nhập</li>
                        <li>• Thiết lập quỹ dự phòng 3-6 tháng chi phí sinh hoạt</li>
                        <li>• Xem xét đầu tư dài hạn cho phần tiết kiệm vượt mức</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

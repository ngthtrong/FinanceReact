"use client";

import { useMemo, useState } from "react";
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/formatters";
import { computeFutureBalance } from "@/hooks/use-planned-transactions";
import type { PlannedTransaction } from "@/types";
import { cn } from "@/lib/utils";

interface FutureBalanceChartProps {
  currentBalance: number;
  items: PlannedTransaction[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-md text-sm min-w-50">
      <p className="mb-2 font-semibold">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}
          </span>
          <span
            className={cn(
              "font-medium",
              entry.name === "Dự thu" && "text-green-600",
              entry.name === "Dự chi" && "text-red-600",
              entry.name === "Số dư" && (entry.value >= 0 ? "text-blue-600" : "text-orange-600")
            )}
          >
            {entry.name === "Dự chi" ? "-" : ""}
            {formatVND(Math.abs(entry.value))}
          </span>
        </div>
      ))}
    </div>
  );
}

const HORIZON_OPTIONS = [
  { label: "6 tháng", value: 6 },
  { label: "12 tháng", value: 12 },
  { label: "24 tháng", value: 24 },
  { label: "36 tháng", value: 36 },
];

export function FutureBalanceChart({ currentBalance, items }: FutureBalanceChartProps) {
  const [horizon, setHorizon] = useState(12);

  const data = useMemo(
    () => computeFutureBalance(currentBalance, items, horizon),
    [currentBalance, items, horizon]
  );

  const minBalance = Math.min(...data.map((d) => d.balance));
  const maxBalance = Math.max(...data.map((d) => d.balance));
  const finalBalance = data[data.length - 1]?.balance ?? currentBalance;
  const balanceTrend = finalBalance - currentBalance;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Dự báo số dư tương lai</CardTitle>
          <div className="flex gap-1">
            {HORIZON_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={horizon === opt.value ? "default" : "outline"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setHorizon(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary row */}
        <div className="flex flex-wrap gap-4 mt-2 text-sm">
          <div>
            <span className="text-muted-foreground">Số dư hiện tại: </span>
            <span className={cn("font-semibold", currentBalance >= 0 ? "text-blue-600" : "text-red-600")}>
              {formatVND(currentBalance)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Dự báo sau {horizon} tháng: </span>
            <span className={cn("font-semibold", finalBalance >= 0 ? "text-blue-600" : "text-red-600")}>
              {formatVND(finalBalance)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Thay đổi: </span>
            <span className={cn("font-semibold", balanceTrend >= 0 ? "text-green-600" : "text-red-600")}>
              {balanceTrend >= 0 ? "+" : ""}{formatVND(balanceTrend)}
            </span>
          </div>
          {minBalance < 0 && (
            <div className="text-orange-600 font-medium text-xs bg-orange-50 px-2 py-0.5 rounded">
              ⚠️ Cảnh báo: Số dư có thể âm trong kỳ này!
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-90 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data.map((d) => ({
                name: d.label,
                income: d.income,
                expense: d.expense,
                balance: d.balance,
              }))}
              margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={minBalance < 0 ? "#f97316" : "#3b82f6"}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={minBalance < 0 ? "#f97316" : "#3b82f6"}
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={horizon > 12 ? Math.floor(horizon / 12) - 1 : 0}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => {
                  const abs = Math.abs(v);
                  const prefix = v < 0 ? "-" : "";
                  if (abs >= 1_000_000_000)
                    return `${prefix}${(abs / 1_000_000_000).toFixed(1)}tỷ`;
                  if (abs >= 1_000_000)
                    return `${prefix}${(abs / 1_000_000).toFixed(0)}tr`;
                  if (abs >= 1_000)
                    return `${prefix}${(abs / 1_000).toFixed(0)}k`;
                  return `${prefix}${abs}`;
                }}
                width={72}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value: string) => (
                  <span className="text-xs">{value}</span>
                )}
              />
              {/* Zero reference line */}
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 2" strokeWidth={1.5} />
              {/* Income bars */}
              <Bar
                dataKey="income"
                name="Dự thu"
                fill="#22c55e"
                fillOpacity={0.7}
                radius={[3, 3, 0, 0]}
                barSize={horizon <= 12 ? 14 : 8}
              />
              {/* Expense bars */}
              <Bar
                dataKey="expense"
                name="Dự chi"
                fill="#ef4444"
                fillOpacity={0.7}
                radius={[3, 3, 0, 0]}
                barSize={horizon <= 12 ? 14 : 8}
              />
              {/* Balance line + area */}
              <Area
                type="monotone"
                dataKey="balance"
                name="Số dư"
                stroke={minBalance < 0 ? "#f97316" : "#3b82f6"}
                strokeWidth={2.5}
                fill="url(#balanceGradient)"
                dot={{ r: horizon <= 12 ? 4 : 2, fill: minBalance < 0 ? "#f97316" : "#3b82f6" }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Min/max callout */}
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
          <span>
            Cao nhất:{" "}
            <strong className="text-blue-600">{formatVND(maxBalance)}</strong>
          </span>
          <span>
            Thấp nhất:{" "}
            <strong className={cn(minBalance < 0 ? "text-red-600" : "text-blue-600")}>
              {formatVND(minBalance)}
            </strong>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

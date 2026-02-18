"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVND } from "@/lib/formatters";
import type { MonthlyTrend } from "@/types";

interface SpendingTrendChartProps {
  monthlyTrend: MonthlyTrend[];
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
    <div className="rounded-lg border bg-card p-3 shadow-md">
      <p className="mb-2 text-sm font-medium">{label}</p>
      {payload.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center gap-2 text-sm"
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{formatVND(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function SpendingTrendChart({ monthlyTrend }: SpendingTrendChartProps) {
  const data = monthlyTrend.map((item) => ({
    ...item,
    name: item.label,
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Xu hướng thu chi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => {
                  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}tr`;
                  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
                  return value.toString();
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value: string) => (
                  <span className="text-sm">{value}</span>
                )}
              />
              <Bar
                dataKey="income"
                name="Thu nhập"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
              <Bar
                dataKey="expense"
                name="Chi tiêu"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
              <Line
                type="monotone"
                dataKey="net"
                name="Dòng tiền ròng"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3, fill: "#3b82f6" }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

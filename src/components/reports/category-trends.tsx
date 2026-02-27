"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryTrend } from "@/types";
import { formatVND } from "@/lib/formatters";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS } from "@/lib/constants";

interface Props {
  trends: CategoryTrend[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmtVND = (v: any) => formatVND(Number(v ?? 0));

const TrendIcon = ({ trend }: { trend: string }) => {
  switch (trend) {
    case "increasing":
      return <TrendingUp className="size-3 text-red-500" />;
    case "decreasing":
      return <TrendingDown className="size-3 text-green-500" />;
    default:
      return <Minus className="size-3 text-gray-500" />;
  }
};

const trendLabel = (trend: string) => {
  switch (trend) {
    case "increasing": return "Tăng";
    case "decreasing": return "Giảm";
    default: return "Ổn định";
  }
};

export function CategoryTrendsChart({ trends }: Props) {
  if (trends.length === 0) return null;

  // Build line chart data – months as X axis
  const topTrends = trends.slice(0, 6);
  const allMonths = topTrends[0]?.months || [];

  const chartData = allMonths.map((m) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: Record<string, any> = { label: `T${m.month}` };
    topTrends.forEach((t) => {
      const monthData = t.months.find((tm) => tm.month === m.month && tm.year === m.year);
      row[t.category] = monthData?.amount || 0;
    });
    return row;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Xu hướng danh mục chi tiêu (6 tháng)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Line chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}tr`} />
              <Tooltip formatter={fmtVND} />
              {topTrends.map((t, i) => (
                <Line
                  key={t.category}
                  type="monotone"
                  dataKey={t.category}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Trends table */}
        <div className="space-y-2">
          {trends.map((trend) => (
            <div
              key={trend.category}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
            >
              <div className="flex items-center gap-1.5 w-32 shrink-0">
                <TrendIcon trend={trend.trend} />
                <span className="text-sm font-medium truncate">{trend.category}</span>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                {trend.group}
              </Badge>
              <div className="flex-1 text-sm text-right">
                {formatVND(trend.currentMonth)}
              </div>
              <div className="text-xs text-muted-foreground w-24 text-right">
                TB: {formatVND(trend.avgLast6)}
              </div>
              <Badge
                variant={trend.trend === "increasing" ? "destructive" : trend.trend === "decreasing" ? "outline" : "secondary"}
                className="text-xs w-20 justify-center"
              >
                {trendLabel(trend.trend)} {Math.abs(trend.trendPercent)}%
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SpendingAnomaly } from "@/types";
import { formatVND } from "@/lib/formatters";
import { AlertTriangle, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

interface Props {
  anomalies: SpendingAnomaly[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmtVND = (v: any) => formatVND(Number(v ?? 0));

const SEVERITY_CONFIG = {
  mild: {
    label: "Nhẹ",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    badge: "outline" as const,
  },
  moderate: {
    label: "Trung bình",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    badge: "secondary" as const,
  },
  severe: {
    label: "Nghiêm trọng",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    badge: "destructive" as const,
  },
};

export function AnomalyDetection({ anomalies }: Props) {
  if (anomalies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5" />
            Phát hiện chi tiêu bất thường
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-4 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mb-2">
              <span className="text-2xl">👍</span>
            </div>
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Không phát hiện chi tiêu bất thường!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tất cả danh mục chi tiêu nằm trong phạm vi bình thường.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = anomalies.slice(0, 8).map((a) => ({
    name: a.category,
    "Thực tế": a.currentAmount,
    "Trung bình": a.avgAmount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-orange-500" />
          Phát hiện chi tiêu bất thường
          <Badge variant="destructive">{anomalies.length} danh mục</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Chart comparing actual vs average */}
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}tr`}
              />
              <YAxis type="category" dataKey="name" width={100} fontSize={12} />
              <Tooltip formatter={fmtVND} />
              <Bar dataKey="Trung bình" fill="#94a3b8" />
              <Bar dataKey="Thực tế" fill="#ef4444" />
              <ReferenceLine x={0} stroke="#000" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Anomaly details */}
        <div className="space-y-3">
          {anomalies.map((anomaly) => {
            const config = SEVERITY_CONFIG[anomaly.severity];
            return (
              <div
                key={anomaly.category}
                className={`p-3 rounded-lg border ${
                  anomaly.severity === "severe"
                    ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                    : anomaly.severity === "moderate"
                    ? "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{anomaly.category}</span>
                    <Badge variant={config.badge} className="text-xs">
                      {config.label}
                    </Badge>
                    <Badge variant="outline" className="gap-1 text-xs">
                      <TrendingUp className="size-3" />
                      +{anomaly.changePercent.toFixed(0)}%
                    </Badge>
                  </div>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">
                    {formatVND(anomaly.currentAmount)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {anomaly.description}
                </p>
                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                  <span>Z-Score: {anomaly.zScore.toFixed(1)}</span>
                  <span>TB: {formatVND(anomaly.avgAmount)}</span>
                  <span>Độ lệch: {formatVND(anomaly.stdDev)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

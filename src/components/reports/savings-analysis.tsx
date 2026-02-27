"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SavingsAnalysis as SavingsAnalysisType } from "@/types";
import { formatVND } from "@/lib/formatters";
import { PiggyBank, Target, TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  analysis: SavingsAnalysisType;
}

export function SavingsAnalysisCard({ analysis }: Props) {
  const progressPercent = analysis.monthlyTarget > 0
    ? Math.min((analysis.actualSaved / analysis.monthlyTarget) * 100, 100)
    : 0;
  const isOnTrack = analysis.actualSaved >= analysis.monthlyTarget;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PiggyBank className="size-5 text-green-500" />
          Phân tích tiết kiệm
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main savings gauge */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold">
            <span className={analysis.currentSavingsRate >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
              {analysis.currentSavingsRate}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Tỷ lệ tiết kiệm (mục tiêu: {analysis.targetSavingsRate}%)
          </p>

          {analysis.monthlyTarget > 0 && (
            <div className="space-y-1">
              <Progress value={Math.max(0, progressPercent)} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatVND(Math.max(0, analysis.actualSaved))}</span>
                <span>{formatVND(analysis.monthlyTarget)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <Target className="size-4 mx-auto mb-1 text-blue-500" />
            <div className="text-sm font-bold">
              {formatVND(analysis.monthlyTarget)}
            </div>
            <div className="text-xs text-muted-foreground">Mục tiêu/tháng</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <PiggyBank className="size-4 mx-auto mb-1 text-green-500" />
            <div className={`text-sm font-bold ${analysis.actualSaved >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatVND(analysis.actualSaved)}
            </div>
            <div className="text-xs text-muted-foreground">Thực tế tiết kiệm</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <TrendingUp className="size-4 mx-auto mb-1 text-green-500" />
            <div className="text-sm font-bold">
              T{analysis.bestMonth.month}: {analysis.bestMonth.rate}%
            </div>
            <div className="text-xs text-muted-foreground">Tháng tốt nhất</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <TrendingDown className="size-4 mx-auto mb-1 text-red-500" />
            <div className="text-sm font-bold">
              T{analysis.worstMonth.month}: {analysis.worstMonth.rate}%
            </div>
            <div className="text-xs text-muted-foreground">Tháng kém nhất</div>
          </div>
        </div>

        {/* Gap analysis */}
        {analysis.gap > 0 && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">Cần cải thiện</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Cần tiết kiệm thêm <span className="font-bold text-amber-600 dark:text-amber-400">{formatVND(analysis.gap)}</span>/tháng để đạt mục tiêu.
              Dự kiến tiết kiệm cả năm: {formatVND(analysis.projectedYearly)}.
            </p>
          </div>
        )}

        {isOnTrack && analysis.actualSaved > 0 && (
          <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="text-xs bg-green-600">Đạt mục tiêu! 🎉</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Bạn đã tiết kiệm vượt mục tiêu <span className="font-bold text-green-600 dark:text-green-400">{formatVND(analysis.actualSaved - analysis.monthlyTarget)}</span>.
              Tiếp tục phát huy!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatVND } from "@/lib/formatters";
import { SavingsGoal } from "@/types";
import { Target, TrendingUp, TrendingDown } from "lucide-react";

interface SavingsGoalCardProps {
  goal: SavingsGoal;
  currentMonthlySavings: number;
  currentYearlySavings: number;
}

export function SavingsGoalCard({
  goal,
  currentMonthlySavings,
  currentYearlySavings,
}: SavingsGoalCardProps) {
  const hasGoals = goal.monthlyTarget > 0 || goal.yearlyTarget > 0;

  const monthlyProgress =
    goal.monthlyTarget > 0
      ? Math.min((currentMonthlySavings / goal.monthlyTarget) * 100, 150)
      : 0;

  const yearlyProgress =
    goal.yearlyTarget > 0
      ? Math.min((currentYearlySavings / goal.yearlyTarget) * 100, 150)
      : 0;

  function getStatusColor(progress: number) {
    if (progress >= 100) return "text-green-600";
    if (progress >= 50) return "text-yellow-600";
    return "text-red-500";
  }

  function getStatusLabel(progress: number) {
    if (progress >= 100) return "Đạt mục tiêu";
    if (progress >= 50) return "Đang tiến triển";
    return "Chưa đạt";
  }

  function getProgressColor(progress: number) {
    if (progress >= 100) return "[&>div]:bg-green-500";
    if (progress >= 50) return "[&>div]:bg-yellow-500";
    return "[&>div]:bg-red-500";
  }

  if (!hasGoals) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-5" />
            Mục tiêu tiết kiệm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Chưa thiết lập mục tiêu tiết kiệm. Nhấn nút &quot;Thiết lập&quot;
            để bắt đầu.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="size-5" />
          Mục tiêu tiết kiệm
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Monthly goal */}
        {goal.monthlyTarget > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Hàng tháng</span>
              <Badge
                variant="outline"
                className={getStatusColor(monthlyProgress)}
              >
                {getStatusLabel(monthlyProgress)}
              </Badge>
            </div>
            <Progress
              value={Math.min(monthlyProgress, 100)}
              className={`h-3 ${getProgressColor(monthlyProgress)}`}
            />
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1">
                {currentMonthlySavings >= 0 ? (
                  <TrendingUp className="size-3.5 text-green-500" />
                ) : (
                  <TrendingDown className="size-3.5 text-red-500" />
                )}
                <span
                  className={
                    currentMonthlySavings >= 0
                      ? "text-green-600 font-medium"
                      : "text-red-500 font-medium"
                  }
                >
                  {formatVND(currentMonthlySavings)}
                </span>
              </div>
              <span className="text-muted-foreground">
                / {formatVND(goal.monthlyTarget)}
              </span>
            </div>
          </div>
        )}

        {/* Yearly goal */}
        {goal.yearlyTarget > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Hàng năm</span>
              <Badge
                variant="outline"
                className={getStatusColor(yearlyProgress)}
              >
                {getStatusLabel(yearlyProgress)}
              </Badge>
            </div>
            <Progress
              value={Math.min(yearlyProgress, 100)}
              className={`h-3 ${getProgressColor(yearlyProgress)}`}
            />
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1">
                {currentYearlySavings >= 0 ? (
                  <TrendingUp className="size-3.5 text-green-500" />
                ) : (
                  <TrendingDown className="size-3.5 text-red-500" />
                )}
                <span
                  className={
                    currentYearlySavings >= 0
                      ? "text-green-600 font-medium"
                      : "text-red-500 font-medium"
                  }
                >
                  {formatVND(currentYearlySavings)}
                </span>
              </div>
              <span className="text-muted-foreground">
                / {formatVND(goal.yearlyTarget)}
              </span>
            </div>
          </div>
        )}

        {/* Notes */}
        {goal.notes && (
          <p className="text-sm text-muted-foreground border-t pt-3">
            {goal.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

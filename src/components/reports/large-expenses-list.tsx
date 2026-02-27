"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LargeExpense } from "@/types";
import { formatVND, formatDate } from "@/lib/formatters";
import { AlertTriangle, Banknote } from "lucide-react";

interface Props {
  expenses: LargeExpense[];
}

export function LargeExpensesList({ expenses }: Props) {
  if (expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="size-5" />
            Các khoản chi lớn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Không có khoản chi lớn đáng chú ý trong tháng này.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="size-5" />
          Các khoản chi lớn
          <Badge variant="secondary">{expenses.length} khoản</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {expenses.map((expense, i) => (
            <div
              key={expense.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                expense.isAnomalous
                  ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                  : ""
              }`}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{expense.title}</span>
                  {expense.isAnomalous && (
                    <Badge variant="destructive" className="gap-1 text-xs shrink-0">
                      <AlertTriangle className="size-3" />
                      Bất thường
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{formatDate(expense.date)}</span>
                  <Badge variant="outline" className="text-xs">{expense.category}</Badge>
                  <span className="text-xs text-muted-foreground">
                    ({expense.percentOfMonthly.toFixed(1)}% tổng chi)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{expense.reason}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-bold text-red-600 dark:text-red-400">
                  {formatVND(expense.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

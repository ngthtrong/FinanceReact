"use client";

import { TrendingDown, TrendingUp, Wallet, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVND } from "@/lib/formatters";
import type { LoanWithPayments } from "@/types";

interface LoanSummaryCardsProps {
  loans: LoanWithPayments[];
}

export function LoanSummaryCards({ loans }: LoanSummaryCardsProps) {
  const activeLoans = loans.filter((l) => l.status !== "paid");

  const totalBorrowingRemaining = activeLoans
    .filter((l) => l.loan_type === "borrowing")
    .reduce((sum, l) => sum + l.remaining_amount, 0);

  const totalLendingRemaining = activeLoans
    .filter((l) => l.loan_type === "lending")
    .reduce((sum, l) => sum + l.remaining_amount, 0);

  const netDebt = totalBorrowingRemaining - totalLendingRemaining;
  const outstandingCount = activeLoans.filter((l) => l.status === "outstanding").length;
  const partialCount = activeLoans.filter((l) => l.status === "partial").length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total outstanding borrowing */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tổng nợ còn lại
          </CardTitle>
          <div className="rounded-md bg-red-100 p-2 dark:bg-red-900/30">
            <TrendingDown className="size-4 text-red-600 dark:text-red-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatVND(totalBorrowingRemaining)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {activeLoans.filter((l) => l.loan_type === "borrowing").length} khoản
            đang vay
          </p>
        </CardContent>
      </Card>

      {/* Total outstanding lending */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tổng cho vay còn lại
          </CardTitle>
          <div className="rounded-md bg-green-100 p-2 dark:bg-green-900/30">
            <TrendingUp className="size-4 text-green-600 dark:text-green-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatVND(totalLendingRemaining)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {activeLoans.filter((l) => l.loan_type === "lending").length} khoản
            cho vay
          </p>
        </CardContent>
      </Card>

      {/* Net debt */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Nợ ròng
          </CardTitle>
          <div
            className={`rounded-md p-2 ${
              netDebt > 0
                ? "bg-red-100 dark:bg-red-900/30"
                : netDebt < 0
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-muted"
            }`}
          >
            <Wallet
              className={`size-4 ${
                netDebt > 0
                  ? "text-red-600 dark:text-red-400"
                  : netDebt < 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground"
              }`}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              netDebt > 0
                ? "text-red-600 dark:text-red-400"
                : netDebt < 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-foreground"
            }`}
          >
            {netDebt > 0 ? "+" : ""}
            {formatVND(netDebt)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {netDebt > 0
              ? "Bạn đang nợ ròng"
              : netDebt < 0
                ? "Người khác nợ bạn ròng"
                : "Cân bằng"}
          </p>
        </CardContent>
      </Card>

      {/* Outstanding loan count */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Số khoản
          </CardTitle>
          <div className="rounded-md bg-blue-100 p-2 dark:bg-blue-900/30">
            <Hash className="size-4 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeLoans.length}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {outstandingCount > 0 && `${outstandingCount} chưa trả`}
            {outstandingCount > 0 && partialCount > 0 && ", "}
            {partialCount > 0 && `${partialCount} trả 1 phần`}
            {outstandingCount === 0 && partialCount === 0 && "Không có khoản chưa trả"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

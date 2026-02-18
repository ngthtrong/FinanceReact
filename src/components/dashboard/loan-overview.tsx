"use client";

import Link from "next/link";
import { ArrowRight, Landmark, HandCoins, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVND } from "@/lib/formatters";
import type { LoanSummary as LoanSummaryType } from "@/types";

interface LoanOverviewProps {
  loanSummary: LoanSummaryType;
}

interface LoanMetricProps {
  label: string;
  value: number;
  count?: number;
  icon: React.ReactNode;
  colorClass: string;
}

function LoanMetric({ label, value, count, icon, colorClass }: LoanMetricProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className={`${colorClass}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-bold ${colorClass}`}>
          {formatVND(value)}
        </p>
        {count !== undefined && (
          <p className="text-[10px] text-muted-foreground">
            {count} khoản chưa trả
          </p>
        )}
      </div>
    </div>
  );
}

export function LoanOverview({ loanSummary }: LoanOverviewProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Khoản vay</CardTitle>
        <Link
          href="/khoan-vay"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Xem chi tiết
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        <LoanMetric
          label="Tổng nợ"
          value={loanSummary.outstandingBorrowing}
          count={loanSummary.borrowingCount}
          icon={<Landmark className="h-4 w-4" />}
          colorClass="text-red-600"
        />
        <LoanMetric
          label="Tổng cho vay"
          value={loanSummary.outstandingLending}
          count={loanSummary.lendingCount}
          icon={<HandCoins className="h-4 w-4" />}
          colorClass="text-green-600"
        />
        <LoanMetric
          label="Nợ ròng"
          value={loanSummary.netDebt}
          icon={<Scale className="h-4 w-4" />}
          colorClass={loanSummary.netDebt <= 0 ? "text-green-600" : "text-red-600"}
        />
      </CardContent>
    </Card>
  );
}

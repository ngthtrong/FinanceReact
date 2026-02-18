"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatVND, formatDate } from "@/lib/formatters";
import { getGroupColor } from "@/lib/constants";
import type { Transaction } from "@/types";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const displayTransactions = transactions.slice(0, 10);

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">Giao dịch gần đây</CardTitle>
        <Link
          href="/giao-dich"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Xem tất cả
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {displayTransactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Chưa có giao dịch nào
          </p>
        ) : (
          <div className="space-y-3">
            {displayTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{tx.title}</p>
                    <Badge
                      variant="secondary"
                      className={`shrink-0 text-[10px] ${getGroupColor(tx.category_group).bg} ${getGroupColor(tx.category_group).text} border ${getGroupColor(tx.category_group).border}`}
                    >
                      {tx.category}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(tx.date)}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold ${
                    tx.transaction_type === "income"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {tx.transaction_type === "income" ? "+" : "-"}
                  {formatVND(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

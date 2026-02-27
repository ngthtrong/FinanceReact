"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { OverBudgetCategory } from "@/types";
import { formatVND } from "@/lib/formatters";
import { ShieldAlert } from "lucide-react";

interface Props {
  categories: OverBudgetCategory[];
}

export function OverBudgetList({ categories }: Props) {
  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5" />
            Danh mục vượt ngân sách
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-4 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mb-2">
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Tất cả danh mục nằm trong ngân sách!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalOver = categories.reduce((s, c) => s + c.monthlyOverAmount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="size-5 text-red-500" />
          Danh mục vượt ngân sách
          <Badge variant="destructive">{categories.length} danh mục</Badge>
          <span className="ml-auto text-sm font-normal text-red-600 dark:text-red-400">
            Tổng vượt: {formatVND(totalOver)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map((cat) => {
            const usagePercent = cat.monthlyLimit > 0
              ? Math.min((cat.spent / cat.monthlyLimit) * 100, 200)
              : 100;

            return (
              <div key={cat.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{cat.category}</span>
                    <Badge variant="outline" className="text-xs">{cat.group}</Badge>
                    <Badge
                      variant={cat.severity === "critical" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {cat.severity === "critical" ? "Nghiêm trọng" : "Cảnh báo"}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                      {formatVND(cat.spent)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      / {formatVND(cat.monthlyLimit)}
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <Progress
                    value={Math.min(usagePercent, 100)}
                    className="h-2"
                  />
                  {usagePercent > 100 && (
                    <div
                      className="absolute top-0 h-2 bg-red-500 rounded-r-full"
                      style={{
                        left: `${(100 / usagePercent) * 100}%`,
                        width: `${100 - (100 / usagePercent) * 100}%`,
                      }}
                    />
                  )}
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Vượt {formatVND(cat.monthlyOverAmount)} (+{cat.monthlyOverPercent}%)
                  </span>
                  <span>{usagePercent.toFixed(0)}% ngân sách</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

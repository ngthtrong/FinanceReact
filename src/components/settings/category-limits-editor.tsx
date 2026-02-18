"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCategories } from "@/hooks/use-categories";
import { SPENDING_THRESHOLDS, getGroupColor } from "@/lib/constants";
import { formatVND } from "@/lib/formatters";
import { CategoryLimit } from "@/types";
import { Save, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CategoryLimitsEditorProps {
  categoryLimits: Record<string, CategoryLimit>;
  onSave: (limits: Record<string, CategoryLimit>) => Promise<void>;
}

export function CategoryLimitsEditor({
  categoryLimits,
  onSave,
}: CategoryLimitsEditorProps) {
  const { categories } = useCategories("expense");
  const [limits, setLimits] = useState<Record<string, CategoryLimit>>(
    categoryLimits
  );
  const [isSaving, setIsSaving] = useState(false);

  // Group categories
  const grouped = useMemo(() => {
    if (!categories) return {};
    return categories.reduce<
      Record<string, { full_name: string; abbreviation: string }[]>
    >((acc, cat) => {
      if (!acc[cat.group]) acc[cat.group] = [];
      acc[cat.group].push({
        full_name: cat.full_name,
        abbreviation: cat.abbreviation,
      });
      return acc;
    }, {});
  }, [categories]);

  const getValue = (
    catName: string,
    period: "weekly" | "monthly" | "yearly"
  ): number | undefined => {
    const custom = limits[catName]?.[period];
    if (custom !== undefined) return custom;
    if (period === "weekly") return SPENDING_THRESHOLDS.weekly[catName];
    if (period === "monthly") return SPENDING_THRESHOLDS.monthly[catName];
    if (period === "yearly") {
      const monthly = SPENDING_THRESHOLDS.monthly[catName];
      return monthly ? monthly * 12 : undefined;
    }
    return undefined;
  };

  const isCustom = (catName: string, period: "weekly" | "monthly" | "yearly") => {
    return limits[catName]?.[period] !== undefined;
  };

  const handleChange = (
    catName: string,
    period: "weekly" | "monthly" | "yearly",
    value: string
  ) => {
    const num = value === "" ? undefined : Number(value);
    setLimits((prev) => ({
      ...prev,
      [catName]: {
        ...prev[catName],
        [period]: num,
      },
    }));
  };

  const handleReset = (catName: string) => {
    setLimits((prev) => {
      const next = { ...prev };
      delete next[catName];
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Clean up: remove entries with no custom values
      const cleaned: Record<string, CategoryLimit> = {};
      Object.entries(limits).forEach(([cat, limit]) => {
        const hasCustom =
          limit.weekly !== undefined ||
          limit.monthly !== undefined ||
          limit.yearly !== undefined;
        if (hasCustom) cleaned[cat] = limit;
      });
      await onSave(cleaned);
      toast.success("Đã lưu giới hạn chi tiêu");
    } catch {
      toast.error("Không thể lưu giới hạn chi tiêu");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Giới hạn chi tiêu theo danh mục</CardTitle>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Lưu thay đổi
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, cats]) => (
            <div key={group}>
              <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider flex items-center gap-2">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${getGroupColor(group).dot}`}
                />
                <span className={getGroupColor(group).text}>{group}</span>
              </h3>
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-[1fr_120px_120px_120px_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
                  <span>Danh mục</span>
                  <span className="text-center">Tuần</span>
                  <span className="text-center">Tháng</span>
                  <span className="text-center">Năm</span>
                  <span></span>
                </div>
                {cats.map((cat) => {
                  const hasCustom =
                    isCustom(cat.full_name, "weekly") ||
                    isCustom(cat.full_name, "monthly") ||
                    isCustom(cat.full_name, "yearly");

                  return (
                    <div
                      key={cat.abbreviation}
                      className="grid grid-cols-[1fr_120px_120px_120px_40px] gap-2 items-center rounded-lg border p-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {cat.full_name}
                        </span>
                        {hasCustom && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            Tùy chỉnh
                          </Badge>
                        )}
                      </div>
                      {(["weekly", "monthly", "yearly"] as const).map(
                        (period) => {
                          const val = getValue(cat.full_name, period);
                          const custom = isCustom(cat.full_name, period);
                          return (
                            <Input
                              key={period}
                              type="number"
                              min={0}
                              step={10000}
                              className={`h-8 text-xs text-center ${
                                custom
                                  ? "border-blue-300 bg-blue-50"
                                  : "text-muted-foreground"
                              }`}
                              placeholder={
                                val !== undefined
                                  ? String(val)
                                  : "—"
                              }
                              value={
                                custom
                                  ? String(limits[cat.full_name]?.[period] ?? "")
                                  : ""
                              }
                              onChange={(e) =>
                                handleChange(
                                  cat.full_name,
                                  period,
                                  e.target.value
                                )
                              }
                            />
                          );
                        }
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleReset(cat.full_name)}
                        title="Khôi phục mặc định"
                        disabled={!hasCustom}
                      >
                        <RotateCcw className="size-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Total limits */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              Tổng giới hạn
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border p-3 space-y-1">
                <span className="text-sm text-muted-foreground">
                  Tổng giới hạn tuần
                </span>
                <p className="text-lg font-bold">
                  {formatVND(SPENDING_THRESHOLDS.weeklyTotal)}
                </p>
              </div>
              <div className="rounded-lg border p-3 space-y-1">
                <span className="text-sm text-muted-foreground">
                  Tổng giới hạn tháng
                </span>
                <p className="text-lg font-bold">
                  {formatVND(SPENDING_THRESHOLDS.monthlyTotal)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

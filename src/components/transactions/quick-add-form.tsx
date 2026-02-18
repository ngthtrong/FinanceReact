"use client";

import { useState, FormEvent } from "react";
import { Plus, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CategorySelect } from "@/components/shared/category-select";
import { useCategories } from "@/hooks/use-categories";
import { cn } from "@/lib/utils";

interface MonthlyPreset {
  label: string;
  title: string;
  amount: number;
  category: string;
  category_group: string;
}

const MONTHLY_PRESETS: MonthlyPreset[] = [
  { label: "Tiền điện", title: "Tiền điện", amount: 0, category: "Tiện ích", category_group: "Sinh hoạt" },
  { label: "Spotify", title: "Spotify", amount: 59000, category: "Giải trí", category_group: "Giải trí" },
  { label: "iCloud", title: "iCloud", amount: 49000, category: "Tiện ích", category_group: "Sinh hoạt" },
  { label: "5G", title: "5G", amount: 0, category: "Tiện ích", category_group: "Sinh hoạt" },
  { label: "Tiền KTX", title: "Tiền KTX", amount: 0, category: "Nhà ở", category_group: "Sinh hoạt" },
];

interface QuickAddFormProps {
  onSuccess: () => void;
}

export function QuickAddForm({ onSuccess }: QuickAddFormProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { categories } = useCategories(transactionType);

  // Find category group based on selected abbreviation
  const selectedCat = (categories ?? []).find((c) => c.abbreviation === category);
  const categoryGroup = selectedCat?.group ?? "";
  const categoryFullName = selectedCat?.full_name ?? category;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Số tiền phải lớn hơn 0");
      return;
    }

    if (!category) {
      toast.error("Vui lòng chọn danh mục");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          amount: parsedAmount,
          transaction_type: transactionType,
          category: categoryFullName,
          category_group: categoryGroup,
          date,
        }),
      });

      if (!res.ok) throw new Error("Failed to create transaction");

      toast.success("Thêm giao dịch thành công");
      setTitle("");
      setAmount("");
      setCategory("");
      setDate(new Date().toISOString().split("T")[0]);
      onSuccess();
    } catch {
      toast.error("Có lỗi xảy ra khi thêm giao dịch");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (type: "income" | "expense") => {
    setTransactionType(type);
    setCategory(""); // Reset category when type changes
  };

  const handlePresetClick = async (preset: MonthlyPreset) => {
    if (preset.amount === 0) {
      // Pre-fill form for presets without fixed amount
      setTitle(preset.title);
      setAmount("");
      setTransactionType("expense");
      setCategory("");
      return;
    }

    // Directly submit for presets with fixed amount
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: preset.title,
          amount: preset.amount,
          transaction_type: "expense" as const,
          category: preset.category,
          category_group: preset.category_group,
          date: new Date().toISOString().split("T")[0],
          special_tag: "Monthly",
        }),
      });

      if (!res.ok) throw new Error("Failed to create transaction");

      toast.success(`Đã thêm "${preset.title}" thành công`);
      onSuccess();
    } catch {
      toast.error("Có lỗi xảy ra khi thêm giao dịch");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-3">
        {/* Monthly Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Zap className="size-3" />
            Chi hằng tháng:
          </span>
          {MONTHLY_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => handlePresetClick(preset)}
              className="h-7 text-xs"
            >
              {preset.label}
              {preset.amount > 0 && (
                <span className="ml-1 text-muted-foreground">
                  {preset.amount.toLocaleString("vi-VN")}đ
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Quick Add Form */}
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Tiêu đề
            </label>
            <Input
              placeholder="Nhập tiêu đề..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="w-[130px]">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Số tiền
            </label>
            <Input
              type="number"
              placeholder="0"
              min="0"
              step="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="w-auto">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Loại
            </label>
            <div className="flex rounded-md border overflow-hidden h-9">
              <button
                type="button"
                className={cn(
                  "px-3 text-sm font-medium transition-colors",
                  transactionType === "expense"
                    ? "bg-red-500 text-white"
                    : "bg-background text-muted-foreground hover:bg-muted"
                )}
                onClick={() => handleTypeChange("expense")}
              >
                Chi tiêu
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 text-sm font-medium transition-colors",
                  transactionType === "income"
                    ? "bg-green-500 text-white"
                    : "bg-background text-muted-foreground hover:bg-muted"
                )}
                onClick={() => handleTypeChange("income")}
              >
                Thu nhập
              </button>
            </div>
          </div>

          <div className="w-[180px]">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Danh mục
            </label>
            <CategorySelect
              value={category}
              onValueChange={setCategory}
              type={transactionType}
              placeholder="Chọn danh mục"
              className="w-full"
            />
          </div>

          <div className="w-[150px]">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Ngày
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} size="default">
            <Plus className="size-4" />
            Thêm
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect, FormEvent } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategorySelect } from "@/components/shared/category-select";
import { useCategories } from "@/hooks/use-categories";
import { Transaction } from "@/types";
import { cn } from "@/lib/utils";

const SPECIAL_TAGS = [
  { value: "__none__", label: "Không có" },
  { value: "BigY", label: "BigY (Chi lớn năm)" },
  { value: "BigM", label: "BigM (Chi lớn tháng)" },
  { value: "Monthly", label: "Monthly (Hàng tháng)" },
];

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  onSuccess: () => void;
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
  onSuccess,
}: TransactionFormDialogProps) {
  const isEditing = !!transaction;

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [specialTag, setSpecialTag] = useState("__none__");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { categories } = useCategories(transactionType);

  // Find category group based on selected abbreviation
  const selectedCat = (categories ?? []).find((c) => c.abbreviation === category);
  const categoryGroup = selectedCat?.group ?? "";
  const categoryFullName = selectedCat?.full_name ?? category;

  // Pre-fill form when editing
  useEffect(() => {
    if (transaction) {
      setTitle(transaction.title);
      setAmount(String(transaction.amount));
      setTransactionType(transaction.transaction_type);
      // Find abbreviation from full_name for the CategorySelect
      setDate(transaction.date);
      setSpecialTag(transaction.special_tag || "__none__");
    } else {
      setTitle("");
      setAmount("");
      setTransactionType("expense");
      setCategory("");
      setDate(new Date().toISOString().split("T")[0]);
      setSpecialTag("__none__");
    }
  }, [transaction, open]);

  // When categories load and we're editing, find the right abbreviation
  useEffect(() => {
    if (transaction && categories && categories.length > 0) {
      const match = categories.find((c) => c.full_name === transaction.category);
      if (match) {
        setCategory(match.abbreviation);
      } else {
        setCategory("");
      }
    }
  }, [transaction, categories]);

  const handleTypeChange = (type: "income" | "expense") => {
    setTransactionType(type);
    setCategory("");
  };

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

    if (!date) {
      toast.error("Vui lòng chọn ngày");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      title: title.trim(),
      amount: parsedAmount,
      transaction_type: transactionType,
      category: categoryFullName,
      category_group: categoryGroup,
      date,
      special_tag: specialTag === "__none__" ? "" : specialTag,
    };

    try {
      const url = isEditing
        ? `/api/transactions/${transaction.id}`
        : "/api/transactions";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save transaction");

      toast.success(
        isEditing ? "Cập nhật giao dịch thành công" : "Thêm giao dịch thành công"
      );
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Có lỗi xảy ra khi lưu giao dịch");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100vw-1rem)] sm:max-w-[480px] max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Sửa giao dịch" : "Thêm giao dịch mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Chỉnh sửa thông tin giao dịch"
              : "Điền thông tin để tạo giao dịch mới"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="form-title">Tiêu đề</Label>
            <Input
              id="form-title"
              placeholder="Nhập tiêu đề giao dịch..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="form-amount">Số tiền (VND)</Label>
            <Input
              id="form-amount"
              type="number"
              placeholder="0"
              min="0"
              step="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Transaction Type */}
          <div className="space-y-2">
            <Label>Loại giao dịch</Label>
            <div className="flex rounded-md border overflow-hidden h-9">
              <button
                type="button"
                className={cn(
                  "flex-1 text-sm font-medium transition-colors",
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
                  "flex-1 text-sm font-medium transition-colors",
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

          {/* Category */}
          <div className="space-y-2">
            <Label>Danh mục</Label>
            <CategorySelect
              value={category}
              onValueChange={setCategory}
              type={transactionType}
              placeholder="Chọn danh mục"
              className="w-full"
            />
            {categoryGroup && (
              <p className="text-xs text-muted-foreground">
                Nhóm: {categoryGroup}
              </p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="form-date">Ngày</Label>
            <Input
              id="form-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Special Tag */}
          <div className="space-y-2">
            <Label>Thẻ đặc biệt (tùy chọn)</Label>
            <Select value={specialTag} onValueChange={setSpecialTag}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn thẻ" />
              </SelectTrigger>
              <SelectContent>
                {SPECIAL_TAGS.map((tag) => (
                  <SelectItem key={tag.value} value={tag.value}>
                    {tag.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting
                ? "Đang lưu..."
                : isEditing
                  ? "Cập nhật"
                  : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

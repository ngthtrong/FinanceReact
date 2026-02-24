"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PlannedTransaction, PlannedRecurrence, PlannedTransactionCreateInput } from "@/types";

interface PlannedFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: PlannedTransaction;
  onSubmit: (payload: PlannedTransactionCreateInput) => void;
}

export function PlannedForm({ open, onOpenChange, item, onSubmit }: PlannedFormProps) {
  const isEdit = !!item;

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [recurrence, setRecurrence] = useState<PlannedRecurrence>("once");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      if (item) {
        setTitle(item.title);
        setAmount(String(item.amount));
        setPlannedDate(item.planned_date);
        setType(item.type);
        setCategory(item.category);
        setRecurrence(item.recurrence);
        setNote(item.note);
      } else {
        setTitle("");
        setAmount("");
        setPlannedDate(new Date().toISOString().split("T")[0]);
        setType("expense");
        setCategory("");
        setRecurrence("once");
        setNote("");
      }
    }
  }, [open, item]);

  const isValid = title.trim() !== "" && Number(amount) > 0 && plannedDate !== "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    // Close immediately — parent handles the async mutation
    onOpenChange(false);
    onSubmit({
      title: title.trim(),
      amount: Number(amount),
      planned_date: plannedDate,
      type,
      category: category.trim(),
      recurrence,
      note: note.trim(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100vw-1rem)] sm:max-w-md max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Chỉnh sửa khoản dự kiến" : "Thêm khoản dự kiến"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin khoản dự thu / dự chi."
              : "Thêm khoản dự thu hoặc dự chi để dự đoán số dư tương lai."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div className="space-y-2">
            <Label>Loại</Label>
            <Select value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">💰 Dự thu (Thu nhập)</SelectItem>
                <SelectItem value="expense">💸 Dự chi (Chi tiêu)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="plan-title">Mô tả</Label>
            <Input
              id="plan-title"
              placeholder={
                type === "income"
                  ? "Ví dụ: Tiền lương tháng, Bán xe cũ…"
                  : "Ví dụ: Tiền nhà, Học phí, Mua xe…"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="plan-amount">Số tiền (VND)</Label>
            <Input
              id="plan-amount"
              type="number"
              placeholder="0"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Recurrence */}
          <div className="space-y-2">
            <Label>Chu kỳ lặp lại</Label>
            <Select
              value={recurrence}
              onValueChange={(v) => setRecurrence(v as PlannedRecurrence)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Một lần</SelectItem>
                <SelectItem value="monthly">Hàng tháng</SelectItem>
                <SelectItem value="yearly">Hàng năm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Planned date */}
          <div className="space-y-2">
            <Label htmlFor="plan-date">
              {recurrence === "once"
                ? "Ngày dự kiến"
                : recurrence === "monthly"
                ? "Bắt đầu từ tháng"
                : "Bắt đầu từ năm (tháng lặp lại)"}
            </Label>
            <Input
              id="plan-date"
              type="date"
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
              required
            />
          </div>

          {/* Category (optional) */}
          <div className="space-y-2">
            <Label htmlFor="plan-category">Danh mục (tùy chọn)</Label>
            <Input
              id="plan-category"
              placeholder="Ví dụ: Nhà ở, Giáo dục, Lương…"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="plan-note">Ghi chú</Label>
            <Textarea
              id="plan-note"
              placeholder="Ghi chú thêm…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={!isValid}>
              {isEdit ? "Lưu thay đổi" : "Thêm khoản dự kiến"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

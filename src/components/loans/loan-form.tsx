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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Loan, LoanCreateInput } from "@/types";

interface LoanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan?: Loan;
  onSuccess: () => void;
}

export function LoanForm({ open, onOpenChange, loan, onSuccess }: LoanFormProps) {
  const isEditMode = !!loan;

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [loanType, setLoanType] = useState<"borrowing" | "lending">("borrowing");
  const [counterparty, setCounterparty] = useState("");
  const [relatedTags, setRelatedTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when editing or reset when creating
  useEffect(() => {
    if (open) {
      if (loan) {
        setTitle(loan.title);
        setAmount(String(loan.amount));
        setDate(loan.date);
        setLoanType(loan.loan_type);
        setCounterparty(loan.counterparty);
        setRelatedTags(loan.related_tags || "");
      } else {
        setTitle("");
        setAmount("");
        setDate(new Date().toISOString().split("T")[0]);
        setLoanType("borrowing");
        setCounterparty("");
        setRelatedTags("");
      }
    }
  }, [open, loan]);

  const originalCategory =
    loanType === "borrowing" ? "Đang vay" : "Cho vay";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: LoanCreateInput = {
        title,
        amount: Number(amount),
        date,
        loan_type: loanType,
        counterparty,
        related_tags: relatedTags || undefined,
        original_category: originalCategory,
      };

      const url = isEditMode ? `/api/loans/${loan.loan_id}` : "/api/loans";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Lỗi khi lưu khoản vay");
      }

      onSuccess();
      onOpenChange(false);
    } catch {
      // Error is handled by the parent via toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid =
    title.trim() !== "" &&
    Number(amount) > 0 &&
    date !== "" &&
    counterparty.trim() !== "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Chỉnh sửa khoản vay" : "Thêm khoản vay mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Cập nhật thông tin khoản vay."
              : "Nhập thông tin khoản vay hoặc cho vay mới."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="loan-title">Tiêu đề</Label>
            <Input
              id="loan-title"
              placeholder="Ví dụ: Vay mua laptop"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="loan-amount">Số tiền (VND)</Label>
            <Input
              id="loan-amount"
              type="number"
              placeholder="0"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="loan-date">Ngày</Label>
            <Input
              id="loan-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Loan type */}
          <div className="space-y-2">
            <Label>Loại</Label>
            <Select
              value={loanType}
              onValueChange={(v) =>
                setLoanType(v as "borrowing" | "lending")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="borrowing">Đi vay</SelectItem>
                <SelectItem value="lending">Cho vay</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Counterparty */}
          <div className="space-y-2">
            <Label htmlFor="loan-counterparty">Đối tác</Label>
            <Input
              id="loan-counterparty"
              placeholder="Tên người/tổ chức"
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
              required
            />
          </div>

          {/* Related tags */}
          <div className="space-y-2">
            <Label htmlFor="loan-tags">
              Tag liên quan{" "}
              <span className="text-muted-foreground font-normal">
                (tùy chọn)
              </span>
            </Label>
            <Input
              id="loan-tags"
              placeholder="Ví dụ: BigY, urgent"
              value={relatedTags}
              onChange={(e) => setRelatedTags(e.target.value)}
            />
          </div>

          {/* Original category (auto, read-only display) */}
          <div className="space-y-2">
            <Label>Danh mục gốc</Label>
            <Input value={originalCategory} disabled />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {isEditMode ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

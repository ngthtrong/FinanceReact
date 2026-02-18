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
import { Loader2 } from "lucide-react";
import { formatVND } from "@/lib/formatters";
import { toast } from "sonner";
import type { LoanWithPayments } from "@/types";

interface PaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: LoanWithPayments | null;
  onSuccess: () => void;
}

export function PaymentForm({
  open,
  onOpenChange,
  loan,
  onSuccess,
}: PaymentFormProps) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && loan) {
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
      setNote("");
    }
  }, [open, loan]);

  const remaining = loan ? loan.remaining_amount : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loan) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/loans/${loan.loan_id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          date,
          note: note || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Lỗi khi tạo thanh toán");
      }

      toast.success("Ghi nhận thanh toán thành công");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể tạo thanh toán"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid =
    Number(amount) > 0 && Number(amount) <= remaining && date !== "";

  const quickAmounts = loan
    ? [
        { label: "Toàn bộ", value: remaining },
        { label: "50%", value: Math.round(remaining / 2) },
        { label: "25%", value: Math.round(remaining / 4) },
      ].filter((q) => q.value > 0)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100vw-1rem)] sm:max-w-md max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Ghi nhận thanh toán</DialogTitle>
          <DialogDescription>
            {loan?.title} — Còn lại: {formatVND(remaining)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {quickAmounts.length > 0 && (
            <div className="flex gap-2">
              {quickAmounts.map((q) => (
                <Button
                  key={q.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setAmount(String(q.value))}
                >
                  {q.label}
                </Button>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="payment-amount">Số tiền thanh toán (VND)</Label>
            <Input
              id="payment-amount"
              type="number"
              placeholder="0"
              min={1}
              max={remaining}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            {Number(amount) > remaining && (
              <p className="text-xs text-red-500">
                Vượt quá số tiền còn lại ({formatVND(remaining)})
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-date">Ngày thanh toán</Label>
            <Input
              id="payment-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-note">
              Ghi chú{" "}
              <span className="text-muted-foreground font-normal">
                (tùy chọn)
              </span>
            </Label>
            <Input
              id="payment-note"
              placeholder="Ví dụ: Trả qua chuyển khoản"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
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
            <Button type="submit" disabled={!isValid || isSubmitting} className="w-full sm:w-auto">
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Xác nhận thanh toán
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

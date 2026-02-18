"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatVND, formatDate } from "@/lib/formatters";
import { usePayments } from "@/hooks/use-payments";
import { toast } from "sonner";
import type { LoanWithPayments } from "@/types";
import { Calendar, FileText, Trash2, Loader2 } from "lucide-react";

interface PaymentHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: LoanWithPayments | null;
  onPaymentDeleted?: () => void;
}

export function PaymentHistory({
  open,
  onOpenChange,
  loan,
  onPaymentDeleted,
}: PaymentHistoryProps) {
  const { data, isLoading, deletePayment } = usePayments(open && loan ? loan.loan_id : null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const payments = data?.payments ?? [];

  const handleDelete = async (paymentId: number) => {
    if (!confirm("Bạn có chắc muốn xóa khoản thanh toán này?")) return;
    setDeletingId(paymentId);
    try {
      await deletePayment(paymentId);
      onPaymentDeleted?.();
      toast.success("Đã xóa khoản thanh toán");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa thanh toán");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Lịch sử thanh toán</SheetTitle>
          <SheetDescription>{loan?.title}</SheetDescription>
        </SheetHeader>

        {loan && (
          <div className="space-y-4 mt-4">
            {/* Progress summary */}
            <div className="space-y-2 p-4 rounded-lg border">
              <div className="flex justify-between text-sm">
                <span>Đã trả</span>
                <span className="font-medium">
                  {formatVND(loan.paid_amount)} / {formatVND(loan.amount)}
                </span>
              </div>
              <Progress value={loan.payment_percentage} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{loan.payment_percentage}% hoàn thành</span>
                <span>Còn lại: {formatVND(loan.remaining_amount)}</span>
              </div>
            </div>

            <Separator />

            {/* Payment list */}
            <ScrollArea className="h-[60vh]">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Chưa có thanh toán nào
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment, index) => (
                    <div key={payment.payment_id} className="flex gap-3">
                      {/* Timeline dot + line */}
                      <div className="flex flex-col items-center">
                        <div className="size-2.5 rounded-full bg-primary mt-1.5" />
                        {index < payments.length - 1 && (
                          <div className="w-px flex-1 bg-border" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm text-green-600">
                            +{formatVND(payment.amount)}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(payment.payment_id)}
                            disabled={deletingId !== null}
                          >
                            {deletingId === payment.payment_id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Calendar className="size-3" />
                          <span>{formatDate(payment.date)}</span>
                        </div>
                        {payment.note && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <FileText className="size-3" />
                            <span>{payment.note}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatVND, formatDate } from "@/lib/formatters";
import {
  Pencil,
  CheckCircle,
  Trash2,
  Calendar,
  User,
  Banknote,
  History,
} from "lucide-react";
import type { LoanWithPayments } from "@/types";

interface LoanCardProps {
  loan: LoanWithPayments;
  onEdit: (loan: LoanWithPayments) => void;
  onMarkPaid: (loan: LoanWithPayments) => void;
  onDelete: (loan: LoanWithPayments) => void;
  onAddPayment: (loan: LoanWithPayments) => void;
  onViewHistory: (loan: LoanWithPayments) => void;
}

export function LoanCard({
  loan,
  onEdit,
  onMarkPaid,
  onDelete,
  onAddPayment,
  onViewHistory,
}: LoanCardProps) {
  const isBorrowing = loan.loan_type === "borrowing";
  const isOutstanding = loan.status !== "paid";

  return (
    <Card
      className={`relative overflow-hidden transition-shadow hover:shadow-md ${
        isOutstanding ? "" : "opacity-75"
      }`}
    >
      {/* Accent bar */}
      <div
        className={`absolute inset-y-0 left-0 w-1 ${
          isBorrowing ? "bg-red-500" : "bg-green-500"
        }`}
      />

      <CardContent className="pl-5 py-4">
        <div className="space-y-3">
          {/* Title + badges */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <h3 className="font-semibold text-sm leading-tight truncate">
                {loan.title}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="size-3" />
                <span className="truncate">{loan.counterparty}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isBorrowing ? (
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[10px] px-1.5">
                  Vay
                </Badge>
              ) : (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] px-1.5">
                  Cho vay
                </Badge>
              )}
              {loan.status === "partial" ? (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] px-1.5">
                  Trả 1 phần
                </Badge>
              ) : loan.status === "outstanding" ? (
                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-[10px] px-1.5">
                  Chưa trả
                </Badge>
              ) : (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] px-1.5">
                  Đã trả
                </Badge>
              )}
            </div>
          </div>

          {/* Amount */}
          {loan.status === "partial" ? (
            <div className="space-y-0.5">
              <div
                className={`text-lg font-bold ${
                  isBorrowing ? "text-red-600" : "text-green-600"
                }`}
              >
                {formatVND(loan.remaining_amount)}
              </div>
              <div className="text-xs text-muted-foreground line-through">
                {formatVND(loan.amount)}
              </div>
            </div>
          ) : (
            <div
              className={`text-lg font-bold ${
                isBorrowing ? "text-red-600" : "text-green-600"
              }`}
            >
              {formatVND(loan.amount)}
            </div>
          )}

          {/* Payment progress bar */}
          {loan.paid_amount > 0 && (
            <div className="space-y-1">
              <Progress value={loan.payment_percentage} className="h-1.5" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Đã trả: {formatVND(loan.paid_amount)}</span>
                <span>
                  {loan.status === "paid"
                    ? "Hoàn thành"
                    : `Còn: ${formatVND(loan.remaining_amount)}`}
                </span>
              </div>
            </div>
          )}

          {/* Date + tags */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="size-3" />
              <span>{formatDate(loan.date)}</span>
            </div>
            {loan.related_tags && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {loan.related_tags}
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 pt-1 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => onEdit(loan)}
            >
              <Pencil className="size-3" />
              Sửa
            </Button>
            {isOutstanding && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => onAddPayment(loan)}
                >
                  <Banknote className="size-3" />
                  Thanh toán
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                  onClick={() => onMarkPaid(loan)}
                  title="Trả hết"
                >
                  <CheckCircle className="size-3" />
                </Button>
              </>
            )}
            {loan.paid_amount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onViewHistory(loan)}
                title="Lịch sử thanh toán"
              >
                <History className="size-3" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
              onClick={() => onDelete(loan)}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

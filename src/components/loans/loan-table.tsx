"use client";

import { useState } from "react";
import { Pencil, Trash2, CheckCircle, Banknote, History } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatVND, formatDate } from "@/lib/formatters";
import type { LoanWithPayments } from "@/types";

interface LoanTableProps {
  loans: LoanWithPayments[];
  onEdit: (loan: LoanWithPayments) => void;
  onMarkPaid: (loan: LoanWithPayments) => void;
  onDelete: (loan: LoanWithPayments) => void;
  onAddPayment: (loan: LoanWithPayments) => void;
  onViewHistory: (loan: LoanWithPayments) => void;
  isLoading: boolean;
  hideFilters?: boolean;
}

export function LoanTable({
  loans,
  onEdit,
  onMarkPaid,
  onDelete,
  onAddPayment,
  onViewHistory,
  isLoading,
  hideFilters = false,
}: LoanTableProps) {
  const [typeFilter, setTypeFilter] = useState<"all" | "borrowing" | "lending">(
    "all"
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "outstanding" | "partial" | "paid"
  >("all");

  const filteredLoans = hideFilters
    ? loans
    : loans.filter((loan) => {
        if (typeFilter !== "all" && loan.loan_type !== typeFilter) return false;
        if (statusFilter !== "all" && loan.status !== statusFilter) return false;
        return true;
      });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {!hideFilters && (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={typeFilter}
          onValueChange={(v) =>
            setTypeFilter(v as "all" | "borrowing" | "lending")
          }
        >
          <TabsList>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="borrowing">Đang vay</TabsTrigger>
            <TabsTrigger value="lending">Cho vay</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select
          value={statusFilter}
          onValueChange={(v) =>
            setStatusFilter(v as "all" | "outstanding" | "partial" | "paid")
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="outstanding">Chưa trả</SelectItem>
            <SelectItem value="partial">Trả 1 phần</SelectItem>
            <SelectItem value="paid">Đã trả</SelectItem>
          </SelectContent>
        </Select>
      </div>
      )}

      {/* Table */}
      {filteredLoans.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-md border text-muted-foreground">
          Không có khoản vay nào
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead className="text-right">Số tiền (VND)</TableHead>
              <TableHead>Tiến độ</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Đối tác</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLoans.map((loan) => (
              <TableRow key={loan.loan_id}>
                <TableCell className="font-medium">{loan.title}</TableCell>
                <TableCell className="text-right">
                  {loan.status === "partial" ? (
                    <div>
                      <div className="font-medium">{formatVND(loan.remaining_amount)}</div>
                      <div className="text-xs text-muted-foreground line-through">{formatVND(loan.amount)}</div>
                    </div>
                  ) : (
                    formatVND(loan.amount)
                  )}
                </TableCell>
                <TableCell>
                  {loan.paid_amount > 0 ? (
                    <div className="w-24 space-y-0.5">
                      <Progress value={loan.payment_percentage} className="h-1.5" />
                      <span className="text-[10px] text-muted-foreground">
                        {loan.payment_percentage}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>{formatDate(loan.date)}</TableCell>
                <TableCell>
                  {loan.loan_type === "borrowing" ? (
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">
                      Vay
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                      Cho vay
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {loan.status === "partial" ? (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
                      Trả 1 phần
                    </Badge>
                  ) : loan.status === "outstanding" ? (
                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400">
                      Chưa trả
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                      Đã trả
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{loan.counterparty}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onEdit(loan)}
                      title="Chỉnh sửa"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    {loan.status !== "paid" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onAddPayment(loan)}
                          title="Thanh toán"
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Banknote className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onMarkPaid(loan)}
                          title="Trả hết"
                          className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                        >
                          <CheckCircle className="size-3.5" />
                        </Button>
                      </>
                    )}
                    {loan.paid_amount > 0 && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onViewHistory(loan)}
                        title="Lịch sử thanh toán"
                      >
                        <History className="size-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onDelete(loan)}
                      title="Xóa"
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Summary footer */}
      <div className="text-sm text-muted-foreground">
        Hiển thị {filteredLoans.length} / {loans.length} khoản vay
      </div>
    </div>
  );
}

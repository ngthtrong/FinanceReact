"use client";

import { useState, useMemo } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Plus, LayoutGrid, List, Users, Search, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoanSummaryCards } from "@/components/loans/loan-summary-cards";
import { LoanTable } from "@/components/loans/loan-table";
import { LoanCard } from "@/components/loans/loan-card";
import { LoanForm } from "@/components/loans/loan-form";
import { PaymentForm } from "@/components/loans/payment-form";
import { PaymentHistory } from "@/components/loans/payment-history";
import { BalanceBanner } from "@/components/shared/balance-banner";
import { formatVND } from "@/lib/formatters";
import { usePersistedState } from "@/hooks/use-persisted-state";
import type { LoanWithPayments } from "@/types";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ViewMode = "cards" | "table" | "grouped";
type SortBy = "date" | "amount" | "counterparty";

export default function KhoanVayPage() {
  const {
    data: loans,
    mutate,
    isLoading,
  } = useSWR<LoanWithPayments[]>("/api/loans", fetcher);
  const { mutate: globalMutate } = useSWRConfig();

  const [formOpen, setFormOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<LoanWithPayments | undefined>(undefined);
  const [viewMode, setViewMode] = usePersistedState<ViewMode>("finance:loan-view-mode", "cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = usePersistedState<"all" | "borrowing" | "lending">(
    "finance:loan-type-filter",
    "all"
  );
  const [statusFilter, setStatusFilter] = usePersistedState<
    "all" | "outstanding" | "partial" | "paid"
  >("finance:loan-status-filter", "all");
  const [sortBy, setSortBy] = usePersistedState<SortBy>("finance:loan-sort-by", "date");

  // Payment dialogs
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanWithPayments | null>(null);

  const loanList = loans ?? [];

  // Filter and sort
  const filteredLoans = useMemo(() => {
    let result = loanList;

    if (typeFilter !== "all") {
      result = result.filter((l) => l.loan_type === typeFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((l) => l.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.counterparty.toLowerCase().includes(q) ||
          (l.related_tags && l.related_tags.toLowerCase().includes(q))
      );
    }

    result = [...result].sort((a, b) => {
      if (sortBy === "date") return b.date.localeCompare(a.date);
      if (sortBy === "amount") return b.amount - a.amount;
      return a.counterparty.localeCompare(b.counterparty);
    });

    return result;
  }, [loanList, typeFilter, statusFilter, searchQuery, sortBy]);

  // Group by counterparty
  const groupedLoans = useMemo(() => {
    const groups: Record<string, LoanWithPayments[]> = {};
    filteredLoans.forEach((loan) => {
      if (!groups[loan.counterparty]) groups[loan.counterparty] = [];
      groups[loan.counterparty].push(loan);
    });
    return Object.entries(groups).sort(([, a], [, b]) => {
      const totalA = a
        .filter((l) => l.status !== "paid")
        .reduce((s, l) => s + l.remaining_amount, 0);
      const totalB = b
        .filter((l) => l.status !== "paid")
        .reduce((s, l) => s + l.remaining_amount, 0);
      return totalB - totalA;
    });
  }, [filteredLoans]);

  const handleAdd = () => {
    setEditingLoan(undefined);
    setFormOpen(true);
  };

  const handleEdit = (loan: LoanWithPayments) => {
    setEditingLoan(loan);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    mutate();
    globalMutate("/api/balance");
    toast.success(
      editingLoan
        ? "Cập nhật khoản vay thành công"
        : "Thêm khoản vay thành công"
    );
  };

  const handleMarkPaid = async (loan: LoanWithPayments) => {
    if (!confirm(`Xác nhận đã thanh toán toàn bộ "${loan.title}"?`)) return;
    try {
      const res = await fetch(`/api/loans/${loan.loan_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...loan, status: "paid" }),
      });
      if (!res.ok) throw new Error("Lỗi khi cập nhật trạng thái");
      mutate();
      globalMutate("/api/balance");
      toast.success(`Đã đánh dấu "${loan.title}" là đã trả`);
    } catch {
      toast.error("Không thể cập nhật trạng thái khoản vay");
    }
  };

  const handleDelete = async (loan: LoanWithPayments) => {
    if (!confirm(`Bạn có chắc muốn xóa khoản vay "${loan.title}"?`)) return;
    try {
      const res = await fetch(`/api/loans/${loan.loan_id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Lỗi khi xóa khoản vay");
      mutate();
      globalMutate("/api/balance");
      toast.success(`Đã xóa khoản vay "${loan.title}"`);
    } catch {
      toast.error("Không thể xóa khoản vay");
    }
  };

  const handleAddPayment = (loan: LoanWithPayments) => {
    setSelectedLoan(loan);
    setPaymentFormOpen(true);
  };

  const handleViewHistory = (loan: LoanWithPayments) => {
    setSelectedLoan(loan);
    setHistoryOpen(true);
  };

  const handlePaymentSuccess = () => {
    mutate();
    globalMutate("/api/balance");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <BalanceBanner />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <BalanceBanner />

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold md:text-2xl">Quản lý khoản vay</h1>
        <Button onClick={handleAdd} size="sm" className="h-8 text-xs md:h-9 md:text-sm">
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">Thêm khoản vay</span>
          <span className="sm:hidden">Thêm</span>
        </Button>
      </div>

      {/* Summary cards */}
      <LoanSummaryCards loans={loanList} />

      {/* Filters + Search + View Toggle */}
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm khoản vay..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex items-center rounded-lg border p-1 gap-0.5">
              {(
                [
                  { mode: "cards" as const, icon: LayoutGrid, label: "Thẻ" },
                  { mode: "table" as const, icon: List, label: "Bảng" },
                  {
                    mode: "grouped" as const,
                    icon: Users,
                    label: "Đối tác",
                  },
                ] as const
              ).map(({ mode, icon: Icon, label }) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-xs gap-1"
                  onClick={() => setViewMode(mode)}
                  title={label}
                >
                  <Icon className="size-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Tabs
            value={typeFilter}
            onValueChange={(v) =>
              setTypeFilter(v as "all" | "borrowing" | "lending")
            }
          >
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs px-2.5 h-6">Tất cả</TabsTrigger>
              <TabsTrigger value="borrowing" className="text-xs px-2.5 h-6">Đang vay</TabsTrigger>
              <TabsTrigger value="lending" className="text-xs px-2.5 h-6">Cho vay</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(v as "all" | "outstanding" | "partial" | "paid")
              }
            >
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="outstanding">Chưa trả</SelectItem>
                <SelectItem value="partial">Trả 1 phần</SelectItem>
                <SelectItem value="paid">Đã trả</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortBy)}
            >
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <ArrowUpDown className="size-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Theo ngày</SelectItem>
                <SelectItem value="amount">Theo số tiền</SelectItem>
                <SelectItem value="counterparty">Theo đối tác</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredLoans.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-lg border text-muted-foreground">
          Không tìm thấy khoản vay nào
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLoans.map((loan) => (
            <LoanCard
              key={loan.loan_id}
              loan={loan}
              onEdit={handleEdit}
              onMarkPaid={handleMarkPaid}
              onDelete={handleDelete}
              onAddPayment={handleAddPayment}
              onViewHistory={handleViewHistory}
            />
          ))}
        </div>
      ) : viewMode === "table" ? (
        <LoanTable
          loans={filteredLoans}
          onEdit={handleEdit}
          onMarkPaid={handleMarkPaid}
          onDelete={handleDelete}
          onAddPayment={handleAddPayment}
          onViewHistory={handleViewHistory}
          isLoading={false}
          hideFilters
        />
      ) : (
        <div className="space-y-6">
          {groupedLoans.map(([counterparty, cLoans]) => {
            const active = cLoans.filter((l) => l.status !== "paid");
            const totalRemaining = active.reduce(
              (s, l) => s + l.remaining_amount,
              0
            );
            const hasBorrowing = cLoans.some(
              (l) => l.loan_type === "borrowing" && l.status !== "paid"
            );
            const hasLending = cLoans.some(
              (l) => l.loan_type === "lending" && l.status !== "paid"
            );

            return (
              <Card key={counterparty}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-10 items-center justify-center rounded-full text-sm font-bold text-white",
                          hasBorrowing && !hasLending
                            ? "bg-red-500"
                            : hasLending && !hasBorrowing
                              ? "bg-green-500"
                              : "bg-blue-500"
                        )}
                      >
                        {counterparty.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {counterparty}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {active.length} khoản chưa trả / {cLoans.length}{" "}
                          tổng
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          totalRemaining > 0
                            ? hasBorrowing
                              ? "text-red-600"
                              : "text-green-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatVND(totalRemaining)}
                      </p>
                      <div className="flex items-center gap-1 justify-end">
                        {hasBorrowing && (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[10px] px-1.5">
                            Vay
                          </Badge>
                        )}
                        {hasLending && (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] px-1.5">
                            Cho vay
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {cLoans.map((loan) => (
                      <LoanCard
                        key={loan.loan_id}
                        loan={loan}
                        onEdit={handleEdit}
                        onMarkPaid={handleMarkPaid}
                        onDelete={handleDelete}
                        onAddPayment={handleAddPayment}
                        onViewHistory={handleViewHistory}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary footer */}
      <div className="text-sm text-muted-foreground">
        Hiển thị {filteredLoans.length} / {loanList.length} khoản vay
      </div>

      {/* Form dialog */}
      <LoanForm
        open={formOpen}
        onOpenChange={setFormOpen}
        loan={editingLoan}
        onSuccess={handleFormSuccess}
      />

      {/* Payment form dialog */}
      <PaymentForm
        open={paymentFormOpen}
        onOpenChange={setPaymentFormOpen}
        loan={selectedLoan}
        onSuccess={handlePaymentSuccess}
      />

      {/* Payment history sheet */}
      <PaymentHistory
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        loan={selectedLoan}
        onPaymentDeleted={() => { mutate(); globalMutate("/api/balance"); }}
      />
    </div>
  );
}

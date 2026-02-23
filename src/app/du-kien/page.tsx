"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  CalendarRange,
  LayoutList,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BalanceBanner } from "@/components/shared/balance-banner";
import { PlannedForm } from "@/components/planned/planned-form";
import { PlannedTable } from "@/components/planned/planned-table";
import { FutureBalanceChart } from "@/components/planned/future-balance-chart";
import { usePlannedTransactions } from "@/hooks/use-planned-transactions";
import { useBalance } from "@/hooks/use-balance";
import { formatVND } from "@/lib/formatters";
import type { PlannedTransaction } from "@/types";
import { cn } from "@/lib/utils";

type FilterType = "all" | "income" | "expense";
type FilterRecurrence = "all" | "once" | "monthly" | "yearly";

export default function DuKienPage() {
  const { data: items, isLoading, update, remove } = usePlannedTransactions();
  const { balance, isLoading: balanceLoading } = useBalance();

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlannedTransaction | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [recurrenceFilter, setRecurrenceFilter] = useState<FilterRecurrence>("all");
  const [tab, setTab] = useState<"list" | "chart">("chart");

  const currentBalance = balance ?? 0;

  // Filtered items for the table
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (recurrenceFilter !== "all" && item.recurrence !== recurrenceFilter) return false;
      return true;
    });
  }, [items, typeFilter, recurrenceFilter]);

  // Summary stats
  const stats = useMemo(() => {
    const active = items.filter((i) => i.is_active);
    const monthlyIncome = active
      .filter((i) => i.type === "income" && i.recurrence === "monthly")
      .reduce((s, i) => s + i.amount, 0);
    const monthlyExpense = active
      .filter((i) => i.type === "expense" && i.recurrence === "monthly")
      .reduce((s, i) => s + i.amount, 0);
    const oneTimeIncome = active
      .filter((i) => i.type === "income" && i.recurrence === "once")
      .reduce((s, i) => s + i.amount, 0);
    const oneTimeExpense = active
      .filter((i) => i.type === "expense" && i.recurrence === "once")
      .reduce((s, i) => s + i.amount, 0);
    return { monthlyIncome, monthlyExpense, oneTimeIncome, oneTimeExpense };
  }, [items]);

  function openCreate() {
    setEditingItem(undefined);
    setFormOpen(true);
  }

  function openEdit(item: PlannedTransaction) {
    setEditingItem(item);
    setFormOpen(true);
  }

  async function handleSuccess() {
    toast.success(editingItem ? "Đã cập nhật khoản dự kiến." : "Đã thêm khoản dự kiến.");
  }

  async function handleDelete(id: number) {
    try {
      await remove(id);
      toast.success("Đã xóa khoản dự kiến.");
    } catch {
      toast.error("Không thể xóa. Vui lòng thử lại.");
    }
  }

  async function handleToggle(item: PlannedTransaction) {
    try {
      await update(item.id, { is_active: !item.is_active });
      toast.success(item.is_active ? "Đã tắt khoản dự kiến." : "Đã bật khoản dự kiến.");
    } catch {
      toast.error("Không thể cập nhật. Vui lòng thử lại.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Balance banner */}
      <BalanceBanner />

      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarRange className="size-6 text-primary" />
            Dự thu / Dự chi
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Lên kế hoạch các khoản thu nhập và chi tiêu trong tương lai để dự báo số dư.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" />
          Thêm khoản dự kiến
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          title="Thu hàng tháng"
          amount={stats.monthlyIncome}
          icon={<TrendingUp className="size-4 text-green-600" />}
          color="green"
          loading={isLoading}
          suffix="/tháng"
        />
        <SummaryCard
          title="Chi hàng tháng"
          amount={stats.monthlyExpense}
          icon={<TrendingDown className="size-4 text-red-600" />}
          color="red"
          loading={isLoading}
          suffix="/tháng"
        />
        <SummaryCard
          title="Thu nhập một lần"
          amount={stats.oneTimeIncome}
          icon={<TrendingUp className="size-4 text-green-600" />}
          color="green"
          loading={isLoading}
        />
        <SummaryCard
          title="Chi tiêu một lần"
          amount={stats.oneTimeExpense}
          icon={<TrendingDown className="size-4 text-red-600" />}
          color="red"
          loading={isLoading}
        />
      </div>

      {/* Tabs: Chart vs List */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "list" | "chart")}>
        <TabsList>
          <TabsTrigger value="chart" className="gap-1.5">
            <Activity className="size-4" /> Biểu đồ dự báo
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-1.5">
            <LayoutList className="size-4" /> Danh sách
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Chart tab */}
      {tab === "chart" && (
        <div className="space-y-4">
          {balanceLoading || isLoading ? (
            <Skeleton className="h-115 w-full rounded-xl" />
          ) : (
            <FutureBalanceChart
              currentBalance={currentBalance}
              items={items}
            />
          )}
          <p className="text-xs text-muted-foreground text-center">
            Biểu đồ dựa trên số dư hiện tại và các khoản dự kiến đang hoạt động.
            Số dư thực tế có thể khác do giao dịch phát sinh.
          </p>
        </div>
      )}

      {/* List tab */}
      {tab === "list" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1">
              {(["all", "income", "expense"] as FilterType[]).map((t) => (
                <Button
                  key={t}
                  variant={typeFilter === t ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setTypeFilter(t)}
                >
                  {t === "all" ? "Tất cả" : t === "income" ? "💰 Dự thu" : "💸 Dự chi"}
                </Button>
              ))}
            </div>
            <div className="flex gap-1">
              {(["all", "once", "monthly", "yearly"] as FilterRecurrence[]).map((r) => (
                <Button
                  key={r}
                  variant={recurrenceFilter === r ? "secondary" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setRecurrenceFilter(r)}
                >
                  {r === "all"
                    ? "Mọi chu kỳ"
                    : r === "once"
                    ? "Một lần"
                    : r === "monthly"
                    ? "Hàng tháng"
                    : "Hàng năm"}
                </Button>
              ))}
            </div>
            <Badge variant="outline" className="ml-auto self-center text-xs">
              {filteredItems.length} khoản
            </Badge>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <PlannedTable
              items={filteredItems}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          )}
        </div>
      )}

      <PlannedForm
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editingItem}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

// --- Helper component ---

function SummaryCard({
  title,
  amount,
  icon,
  color,
  loading,
  suffix = "",
}: {
  title: string;
  amount: number;
  icon: React.ReactNode;
  color: "green" | "red";
  loading: boolean;
  suffix?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {loading ? (
          <Skeleton className="h-7 w-3/4" />
        ) : (
          <p
            className={cn(
              "text-lg font-bold",
              color === "green" ? "text-green-600" : "text-red-600"
            )}
          >
            {formatVND(amount)}
            {suffix && (
              <span className="text-xs font-normal text-muted-foreground ml-1">{suffix}</span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

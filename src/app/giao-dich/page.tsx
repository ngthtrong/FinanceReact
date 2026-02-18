"use client";

import { useState, useCallback, useMemo } from "react";
import { useSWRConfig } from "swr";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExportButton } from "@/components/shared/export-button";
import { QuickAddForm } from "@/components/transactions/quick-add-form";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { TransactionFormDialog } from "@/components/transactions/transaction-form";
import { BalanceBanner } from "@/components/shared/balance-banner";
import { useTransactions } from "@/hooks/use-transactions";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { Transaction, TransactionFilters as TFilters } from "@/types";

type SortField = NonNullable<TFilters["sort_by"]>;

const DEFAULT_PER_PAGE = 20;

type PersistedFilters = Omit<TFilters, "page">;

export default function GiaoDichPage() {
  const [savedFilters, setSavedFilters] = usePersistedState<PersistedFilters>(
    "finance:transaction-filters",
    { per_page: DEFAULT_PER_PAGE }
  );
  const [page, setPage] = useState(1);

  const filters = useMemo<TFilters>(
    () => ({ ...savedFilters, page }),
    [savedFilters, page]
  );

  const setFilters = useCallback(
    (value: TFilters | ((prev: TFilters) => TFilters)) => {
      if (typeof value === "function") {
        setSavedFilters((prev) => {
          const next = value({ ...prev, page });
          const { page: newPage, ...rest } = next;
          setPage(newPage ?? 1);
          return rest;
        });
      } else {
        const { page: newPage, ...rest } = value;
        setPage(newPage ?? 1);
        setSavedFilters(rest);
      }
    },
    [setSavedFilters, page]
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const { mutate: globalMutate } = useSWRConfig();
  const { data, isLoading, mutate } = useTransactions(filters);

  const transactions = data?.data ?? [];
  const total = data?.total ?? 0;
  const currentPage = data?.page ?? 1;

  const handleFilterChange = useCallback((newFilters: TFilters) => {
    setFilters(newFilters);
  }, []);

  const handlePageChange = useCallback(
    (p: number) => {
      setPage(p);
    },
    []
  );

  const handleSort = useCallback(
    (field: SortField) => {
      setFilters((prev) => {
        const isSameField = prev.sort_by === field;
        const nextOrder = isSameField && prev.sort_order === "desc" ? "asc" : isSameField && prev.sort_order === "asc" ? undefined : "desc";
        return {
          ...prev,
          sort_by: nextOrder ? field : undefined,
          sort_order: nextOrder,
          page: 1,
        };
      });
    },
    []
  );

  const handleEdit = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(() => {
    mutate();
    globalMutate("/api/balance");
  }, [mutate, globalMutate]);

  const handleFormSuccess = useCallback(() => {
    mutate();
    globalMutate("/api/balance");
    setEditingTransaction(null);
  }, [mutate, globalMutate]);

  const handleQuickAddSuccess = useCallback(() => {
    mutate();
    globalMutate("/api/balance");
  }, [mutate, globalMutate]);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingTransaction(null);
    }
  }, []);

  const handleNewTransaction = useCallback(() => {
    setEditingTransaction(null);
    setDialogOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      <BalanceBanner />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Giao dịch</h1>
        <div className="flex items-center gap-2">
          <ExportButton filters={filters} />
          <Button onClick={handleNewTransaction}>
            <Plus className="size-4" />
            Thêm giao dịch
          </Button>
        </div>
      </div>

      {/* Quick Add Form */}
      <QuickAddForm onSuccess={handleQuickAddSuccess} />

      {/* Filters */}
      <TransactionFilters
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Table */}
      <Card>
        <CardContent>
          <TransactionTable
            transactions={transactions}
            total={total}
            page={currentPage}
            perPage={filters.per_page ?? DEFAULT_PER_PAGE}
            onPageChange={handlePageChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
            sortBy={filters.sort_by}
            sortOrder={filters.sort_order}
            onSort={handleSort}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        transaction={editingTransaction}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { Pencil, Trash2, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { formatDate } from "@/lib/formatters";
import { getGroupColor } from "@/lib/constants";
import { Transaction, TransactionFilters } from "@/types";

type SortField = NonNullable<TransactionFilters["sort_by"]>;

interface TransactionTableProps {
  transactions: Transaction[];
  total: number;
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: number) => void;
  isLoading: boolean;
  sortBy?: SortField;
  sortOrder?: "asc" | "desc";
  onSort?: (field: SortField) => void;
}

function SortIcon({ field, currentSort, currentOrder }: { field: SortField; currentSort?: SortField; currentOrder?: "asc" | "desc" }) {
  if (currentSort !== field) {
    return <ArrowUpDown className="size-3 text-muted-foreground/50" />;
  }
  return currentOrder === "asc"
    ? <ArrowUp className="size-3" />
    : <ArrowDown className="size-3" />;
}

export function TransactionTable({
  transactions,
  total,
  page,
  perPage,
  onPageChange,
  onEdit,
  onDelete,
  isLoading,
  sortBy,
  sortOrder,
  onSort,
}: TransactionTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalPages = Math.ceil(total / perPage);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Xóa giao dịch thành công");
      onDelete(deleteTarget.id);
    } catch {
      toast.error("Có lỗi xảy ra khi xóa giao dịch");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-2">
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-4 w-[70px]" />
            <Skeleton className="h-4 w-[60px]" />
            <Skeleton className="h-4 w-[60px]" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">Không tìm thấy giao dịch nào</p>
        <p className="text-sm mt-1">
          Thử thay đổi bộ lọc hoặc thêm giao dịch mới
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer select-none hover:bg-muted/50"
              onClick={() => onSort?.("date")}
            >
              <span className="flex items-center gap-1">
                Ngày
                <SortIcon field="date" currentSort={sortBy} currentOrder={sortOrder} />
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hover:bg-muted/50"
              onClick={() => onSort?.("title")}
            >
              <span className="flex items-center gap-1">
                Tiêu đề
                <SortIcon field="title" currentSort={sortBy} currentOrder={sortOrder} />
              </span>
            </TableHead>
            <TableHead
              className="text-right cursor-pointer select-none hover:bg-muted/50"
              onClick={() => onSort?.("amount")}
            >
              <span className="flex items-center justify-end gap-1">
                Số tiền
                <SortIcon field="amount" currentSort={sortBy} currentOrder={sortOrder} />
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hover:bg-muted/50"
              onClick={() => onSort?.("category")}
            >
              <span className="flex items-center gap-1">
                Danh mục
                <SortIcon field="category" currentSort={sortBy} currentOrder={sortOrder} />
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hover:bg-muted/50"
              onClick={() => onSort?.("category_group")}
            >
              <span className="flex items-center gap-1">
                Nhóm
                <SortIcon field="category_group" currentSort={sortBy} currentOrder={sortOrder} />
              </span>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hover:bg-muted/50"
              onClick={() => onSort?.("transaction_type")}
            >
              <span className="flex items-center gap-1">
                Loại
                <SortIcon field="transaction_type" currentSort={sortBy} currentOrder={sortOrder} />
              </span>
            </TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="text-muted-foreground">
                {formatDate(tx.date)}
              </TableCell>
              <TableCell className="font-medium max-w-[200px] truncate">
                {tx.title}
                {tx.special_tag && (
                  <Badge variant="outline" className="ml-2 text-[10px]">
                    {tx.special_tag}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <CurrencyDisplay
                  amount={tx.transaction_type === "expense" ? -tx.amount : tx.amount}
                  colorCode
                />
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={`${getGroupColor(tx.category_group).bg} ${getGroupColor(tx.category_group).text} border ${getGroupColor(tx.category_group).border}`}
                >
                  {tx.category}
                </Badge>
              </TableCell>
              <TableCell>
                <span className={`text-sm font-medium ${getGroupColor(tx.category_group).text}`}>
                  {tx.category_group}
                </span>
              </TableCell>
              <TableCell>
                {tx.transaction_type === "income" ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    Thu
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                    Chi
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onEdit(tx)}
                    title="Sửa"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setDeleteTarget(tx)}
                    title="Xóa"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-4">
          <p className="text-sm text-muted-foreground">
            Hiển thị {(page - 1) * perPage + 1}-
            {Math.min(page * perPage, total)} / {total} giao dịch
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="size-4" />
              Trước
            </Button>
            <span className="text-sm font-medium px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Sau
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa giao dịch &ldquo;{deleteTarget?.title}&rdquo;?
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

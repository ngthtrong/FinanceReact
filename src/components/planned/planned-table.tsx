"use client";

import { useState, useMemo } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, ToggleLeft, ToggleRight, ChevronUp, ChevronDown, ChevronsUpDown, Copy } from "lucide-react";
import { formatVND, formatDate } from "@/lib/formatters";
import type { PlannedTransaction } from "@/types";
import { cn } from "@/lib/utils";

const RECURRENCE_LABEL: Record<string, string> = {
  once: "Một lần",
  monthly: "Hàng tháng",
  yearly: "Hàng năm",
};

const RECURRENCE_ORDER: Record<string, number> = { once: 0, monthly: 1, yearly: 2 };

type SortKey = "title" | "type" | "amount" | "planned_date" | "recurrence" | "category" | "is_active";
type SortDir = "asc" | "desc";

function SortableHead({
  label,
  sortKey,
  current,
  dir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = current === sortKey;
  return (
    <TableHead
      className={cn("cursor-pointer select-none whitespace-nowrap group", className)}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          dir === "asc" ? (
            <ChevronUp className="size-3.5 text-primary" />
          ) : (
            <ChevronDown className="size-3.5 text-primary" />
          )
        ) : (
          <ChevronsUpDown className="size-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
        )}
      </span>
    </TableHead>
  );
}

interface PlannedTableProps {
  items: PlannedTransaction[];
  onEdit: (item: PlannedTransaction) => void;
  onDelete: (id: number) => Promise<void>;
  onToggle: (item: PlannedTransaction) => Promise<void>;
  onDuplicate: (item: PlannedTransaction) => Promise<void>;
}

export function PlannedTable({ items, onEdit, onDelete, onToggle, onDuplicate }: PlannedTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<PlannedTransaction | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("planned_date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "title":       cmp = a.title.localeCompare(b.title, "vi"); break;
        case "type":        cmp = a.type.localeCompare(b.type); break;
        case "amount":      cmp = a.amount - b.amount; break;
        case "planned_date": cmp = a.planned_date.localeCompare(b.planned_date); break;
        case "recurrence":  cmp = (RECURRENCE_ORDER[a.recurrence] ?? 0) - (RECURRENCE_ORDER[b.recurrence] ?? 0); break;
        case "category":    cmp = a.category.localeCompare(b.category, "vi"); break;
        case "is_active":   cmp = Number(b.is_active) - Number(a.is_active); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [items, sortKey, sortDir]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setPending(deleteTarget.id);
    try {
      await onDelete(deleteTarget.id);
    } finally {
      setPending(null);
      setDeleteTarget(null);
    }
  }

  async function handleToggle(item: PlannedTransaction) {
    setPending(item.id);
    try {
      await onToggle(item);
    } finally {
      setPending(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <span className="text-4xl">📋</span>
        <p className="text-sm">Chưa có khoản dự kiến nào.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead label="Mô tả"       sortKey="title"        current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortableHead label="Loại"        sortKey="type"         current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortableHead label="Số tiền"     sortKey="amount"       current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
              <SortableHead label="Ngày / Bắt đầu" sortKey="planned_date" current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortableHead label="Chu kỳ"      sortKey="recurrence"   current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortableHead label="Danh mục"    sortKey="category"     current={sortKey} dir={sortDir} onSort={handleSort} />
              <SortableHead label="Trạng thái"  sortKey="is_active"    current={sortKey} dir={sortDir} onSort={handleSort} />
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((item) => (
              <TableRow
                key={item.id}
                className={cn(!item.is_active && "opacity-50")}
              >
                <TableCell className="font-medium max-w-45 truncate">
                  {item.title}
                  {item.note && (
                    <p className="text-xs text-muted-foreground truncate">{item.note}</p>
                  )}
                </TableCell>
                <TableCell>
                  {item.type === "income" ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      💰 Dự thu
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      💸 Dự chi
                    </Badge>
                  )}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono font-semibold",
                    item.type === "income" ? "text-green-600" : "text-red-600"
                  )}
                >
                  {item.type === "income" ? "+" : "-"}
                  {formatVND(item.amount)}
                </TableCell>
                <TableCell className="text-sm">{formatDate(item.planned_date)}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {RECURRENCE_LABEL[item.recurrence] ?? item.recurrence}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.category || "—"}
                </TableCell>
                <TableCell>
                  {item.is_active ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200">Hoạt động</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">Tắt</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={pending === item.id}
                      onClick={() => handleToggle(item)}
                      title={item.is_active ? "Tắt khoản dự kiến" : "Bật khoản dự kiến"}
                    >
                      {item.is_active ? (
                        <ToggleRight className="size-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="size-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={pending === item.id}
                      onClick={() => onDuplicate(item)}
                      title="Nhân đôi khoản dự kiến"
                    >
                      <Copy className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => onEdit(item)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa khoản dự kiến?</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa &ldquo;{deleteTarget?.title}&rdquo;? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Hủy</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

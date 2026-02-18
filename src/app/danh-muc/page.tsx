"use client";

import { useState, FormEvent } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories } from "@/hooks/use-categories";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { Category } from "@/types";
import { cn } from "@/lib/utils";
import { getGroupColor } from "@/lib/constants";

const EXPENSE_GROUPS = [
  "Ăn uống",
  "Sinh hoạt",
  "Xã hội",
  "Giải trí",
  "Thể thao",
  "Học tập",
  "Cá nhân",
  "Tài chính",
];

const INCOME_GROUPS = ["Thu nhập"];

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = usePersistedState<"expense" | "income">("finance:category-tab", "expense");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);

  const { categories, isLoading, mutate } = useCategories(activeTab);

  const handleAdd = () => {
    setEditingCategory(null);
    setDialogOpen(true);
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setDialogOpen(true);
  };

  const handleDelete = async (cat: Category) => {
    try {
      const res = await fetch(
        `/api/categories/${encodeURIComponent(cat.abbreviation)}?type=${cat.category_type}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete");
      toast.success(`Đã xóa danh mục "${cat.full_name}"`);
      mutate();
      setDeleteConfirm(null);
    } catch {
      toast.error("Có lỗi xảy ra khi xóa danh mục");
    }
  };

  const handleFormSuccess = () => {
    setDialogOpen(false);
    mutate();
  };

  // Group categories by their group field
  const grouped: Record<string, Category[]> = {};
  (categories ?? []).forEach((cat) => {
    if (!grouped[cat.group]) grouped[cat.group] = [];
    grouped[cat.group].push(cat);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
        <div className="flex items-center gap-3">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "expense" | "income")}
          >
            <TabsList>
              <TabsTrigger value="expense">Chi tiêu</TabsTrigger>
              <TabsTrigger value="income">Thu nhập</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={handleAdd} size="default">
            <Plus className="size-4" />
            Thêm danh mục
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-lg border bg-muted animate-pulse" />
          ))}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              Chưa có danh mục nào cho loại {activeTab === "expense" ? "chi tiêu" : "thu nhập"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b, "vi"))
            .map(([group, cats]) => (
              <Card key={group}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        getGroupColor(group).bg,
                        getGroupColor(group).text,
                        getGroupColor(group).border
                      )}
                    >
                      {group}
                    </Badge>
                    <span className="text-muted-foreground font-normal">
                      {cats.length} danh mục
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Viết tắt</TableHead>
                        <TableHead>Tên đầy đủ</TableHead>
                        <TableHead>Tên tiếng Anh</TableHead>
                        <TableHead className="w-[100px] text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cats.map((cat) => (
                        <TableRow key={`${cat.abbreviation}-${cat.category_type}`}>
                          <TableCell className="font-mono text-sm font-medium">
                            {cat.abbreviation}
                          </TableCell>
                          <TableCell>{cat.full_name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {cat.english_name}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => handleEdit(cat)}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleteConfirm(cat)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
        activeType={activeTab}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa danh mục &ldquo;{deleteConfirm?.full_name}&rdquo;?
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  activeType,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  activeType: "income" | "expense";
  onSuccess: () => void;
}) {
  const isEditing = !!category;

  const [abbreviation, setAbbreviation] = useState("");
  const [fullName, setFullName] = useState("");
  const [englishName, setEnglishName] = useState("");
  const [categoryType, setCategoryType] = useState<"income" | "expense">(activeType);
  const [group, setGroup] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      if (category) {
        setAbbreviation(category.abbreviation);
        setFullName(category.full_name);
        setEnglishName(category.english_name || "");
        setCategoryType(category.category_type);
        setGroup(category.group);
      } else {
        setAbbreviation("");
        setFullName("");
        setEnglishName("");
        setCategoryType(activeType);
        setGroup("");
      }
    }
    onOpenChange(isOpen);
  };

  // Sync when open changes externally
  if (open && !isSubmitting) {
    // Handled by handleOpenChange
  }

  const groups = categoryType === "expense" ? EXPENSE_GROUPS : INCOME_GROUPS;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!abbreviation.trim()) {
      toast.error("Vui lòng nhập viết tắt");
      return;
    }

    if (!fullName.trim()) {
      toast.error("Vui lòng nhập tên đầy đủ");
      return;
    }

    if (!group) {
      toast.error("Vui lòng chọn nhóm");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing) {
        const res = await fetch(
          `/api/categories/${encodeURIComponent(category.abbreviation)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              abbreviation: abbreviation.trim(),
              full_name: fullName.trim(),
              english_name: englishName.trim(),
              category_type: categoryType,
              group,
              original_type: category.category_type,
            }),
          }
        );
        if (!res.ok) throw new Error("Failed to update");
        toast.success("Cập nhật danh mục thành công");
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            abbreviation: abbreviation.trim(),
            full_name: fullName.trim(),
            english_name: englishName.trim(),
            category_type: categoryType,
            group,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create");
        }
        toast.success("Thêm danh mục thành công");
      }
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Sửa danh mục" : "Thêm danh mục mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Chỉnh sửa thông tin danh mục"
              : "Điền thông tin để tạo danh mục mới"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Loại</Label>
            <div className="flex rounded-md border overflow-hidden h-9">
              <button
                type="button"
                className={cn(
                  "flex-1 text-sm font-medium transition-colors",
                  categoryType === "expense"
                    ? "bg-red-500 text-white"
                    : "bg-background text-muted-foreground hover:bg-muted"
                )}
                onClick={() => {
                  setCategoryType("expense");
                  setGroup("");
                }}
              >
                Chi tiêu
              </button>
              <button
                type="button"
                className={cn(
                  "flex-1 text-sm font-medium transition-colors",
                  categoryType === "income"
                    ? "bg-green-500 text-white"
                    : "bg-background text-muted-foreground hover:bg-muted"
                )}
                onClick={() => {
                  setCategoryType("income");
                  setGroup("");
                }}
              >
                Thu nhập
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-abbr">Viết tắt</Label>
            <Input
              id="cat-abbr"
              placeholder="VD: AC, AV, DC..."
              value={abbreviation}
              onChange={(e) => setAbbreviation(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-fullname">Tên đầy đủ</Label>
            <Input
              id="cat-fullname"
              placeholder="VD: Ăn chính, Ăn vặt..."
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-english">Tên tiếng Anh (tùy chọn)</Label>
            <Input
              id="cat-english"
              placeholder="VD: Main meals, Snacks..."
              value={englishName}
              onChange={(e) => setEnglishName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label>Nhóm</Label>
            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn nhóm" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Đang lưu..."
                : isEditing
                  ? "Cập nhật"
                  : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

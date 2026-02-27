"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, X, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionFilters as TFilters } from "@/types";
import { getGroupColor } from "@/lib/constants";
import { useCategories } from "@/hooks/use-categories";

const CATEGORY_GROUPS = [
  "Ăn uống",
  "Sinh hoạt",
  "Giải trí",
  "Thể thao",
  "Xã hội",
  "Cá nhân",
  "Học tập",
  "Tài chính",
  "Thu nhập",
];

function getDateRange(preset: string): { from: string; to: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  switch (preset) {
    case "today": {
      const s = fmt(today);
      return { from: s, to: s };
    }
    case "yesterday": {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      const s = fmt(d);
      return { from: s, to: s };
    }
    case "this_week": {
      const day = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((day + 6) % 7));
      return { from: fmt(monday), to: fmt(today) };
    }
    case "last_week": {
      const day = today.getDay();
      const thisMonday = new Date(today);
      thisMonday.setDate(today.getDate() - ((day + 6) % 7));
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);
      const lastSunday = new Date(thisMonday);
      lastSunday.setDate(thisMonday.getDate() - 1);
      return { from: fmt(lastMonday), to: fmt(lastSunday) };
    }
    case "this_month": {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: fmt(first), to: fmt(today) };
    }
    case "last_month": {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: fmt(first), to: fmt(last) };
    }
    default:
      return { from: "", to: "" };
  }
}

interface DatePreset {
  key: string;
  label: string;
}

const DATE_PRESETS: DatePreset[] = [
  { key: "today", label: "Hôm nay" },
  { key: "yesterday", label: "Hôm qua" },
  { key: "this_week", label: "Tuần này" },
  { key: "last_week", label: "Tuần trước" },
  { key: "this_month", label: "Tháng này" },
  { key: "last_month", label: "Tháng trước" },
];

interface TransactionFiltersProps {
  filters: TFilters;
  onFilterChange: (filters: TFilters) => void;
}

export function TransactionFilters({
  filters,
  onFilterChange,
}: TransactionFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const [isOpen, setIsOpen] = useState(true);
  const [activeDatePreset, setActiveDatePreset] = useState<string | null>(null);

  const categoryType =
    filters.transaction_type === "income"
      ? "income"
      : filters.transaction_type === "expense"
      ? "expense"
      : undefined;
  const { categories } = useCategories(categoryType);

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    if (filters.category_group) {
      return categories.filter((c) => c.group === filters.category_group);
    }
    return categories;
  }, [categories, filters.category_group]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filters.search ?? "")) {
        onFilterChange({ ...filters, search: searchInput || undefined, page: 1 });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGroupChange = useCallback(
    (value: string) => {
      onFilterChange({
        ...filters,
        category_group: value === "__all__" ? undefined : value,
        category: undefined,
        page: 1,
      });
    },
    [filters, onFilterChange]
  );

  const handleCategoryChange = useCallback(
    (value: string) => {
      onFilterChange({
        ...filters,
        category: value === "__all__" ? undefined : value,
        page: 1,
      });
    },
    [filters, onFilterChange]
  );

  const handleDateFromChange = useCallback(
    (value: string) => {
      setActiveDatePreset(null);
      onFilterChange({
        ...filters,
        date_from: value || undefined,
        page: 1,
      });
    },
    [filters, onFilterChange]
  );

  const handleDateToChange = useCallback(
    (value: string) => {
      setActiveDatePreset(null);
      onFilterChange({
        ...filters,
        date_to: value || undefined,
        page: 1,
      });
    },
    [filters, onFilterChange]
  );

  const handleClearFilters = useCallback(() => {
    setSearchInput("");
    setActiveDatePreset(null);
    onFilterChange({
      page: 1,
      per_page: filters.per_page,
    });
  }, [filters.per_page, onFilterChange]);

  const handleTypeChange = useCallback(
    (value: string) => {
      onFilterChange({
        ...filters,
        transaction_type: value as TFilters["transaction_type"],
        category: undefined,
        page: 1,
      });
    },
    [filters, onFilterChange]
  );

  const handleDatePreset = useCallback(
    (presetKey: string) => {
      if (activeDatePreset === presetKey) {
        // Toggle off
        setActiveDatePreset(null);
        onFilterChange({
          ...filters,
          date_from: undefined,
          date_to: undefined,
          page: 1,
        });
        return;
      }
      const range = getDateRange(presetKey);
      setActiveDatePreset(presetKey);
      onFilterChange({
        ...filters,
        date_from: range.from,
        date_to: range.to,
        page: 1,
      });
    },
    [activeDatePreset, filters, onFilterChange]
  );

  const hasActiveFilters =
    !!filters.search ||
    (!!filters.transaction_type && filters.transaction_type !== "all") ||
    !!filters.category_group ||
    !!filters.category ||
    !!filters.date_from ||
    !!filters.date_to;

  return (
    <Card>
      <div
        className="flex items-center justify-between px-6 pt-4 cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Bộ lọc</h3>
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              !
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </div>

      {isOpen && (
        <CardContent className="space-y-3">
          {/* Quick Date Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Nhanh:</span>
            {DATE_PRESETS.map((preset) => (
              <Button
                key={preset.key}
                type="button"
                variant={activeDatePreset === preset.key ? "default" : "outline"}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDatePreset(preset.key);
                }}
                className="h-7 text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-2 sm:gap-3">
            {/* Search */}
            <div className="w-full sm:flex-1 sm:min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm giao dịch..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Type */}
            <div className="flex-1 min-w-[100px] sm:w-[140px] sm:flex-none">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Loại
              </label>
              <Select
                value={filters.transaction_type ?? "all"}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="income">Thu nhập</SelectItem>
                  <SelectItem value="expense">Chi tiêu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Group */}
            <div className="flex-1 min-w-[120px] sm:w-[160px] sm:flex-none">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Nhóm danh mục
              </label>
              <Select
                value={filters.category_group ?? "__all__"}
                onValueChange={handleGroupChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tất cả</SelectItem>
                  {CATEGORY_GROUPS.map((group) => (
                    <SelectItem key={group} value={group}>
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${getGroupColor(group).dot}`}
                        />
                        {group}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="flex-1 min-w-[140px] sm:w-[190px] sm:flex-none">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Danh mục
              </label>
              <Select
                value={filters.category ?? "__all__"}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tất cả</SelectItem>
                  {filteredCategories.map((cat) => (
                    <SelectItem key={`${cat.abbreviation}-${cat.category_type}`} value={cat.full_name}>
                      {cat.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date from */}
            <div className="flex-1 min-w-[120px] sm:w-[150px] sm:flex-none">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Từ ngày
              </label>
              <Input
                type="date"
                value={filters.date_from ?? ""}
                onChange={(e) => handleDateFromChange(e.target.value)}
              />
            </div>

            {/* Date to */}
            <div className="flex-1 min-w-[120px] sm:w-[150px] sm:flex-none">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Đến ngày
              </label>
              <Input
                type="date"
                value={filters.date_to ?? ""}
                onChange={(e) => handleDateToChange(e.target.value)}
              />
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearFilters();
                }}
                className="text-muted-foreground w-full sm:w-auto"
              >
                <X className="size-4" />
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

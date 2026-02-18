"use client";

import { useCategories } from "@/hooks/use-categories";
import { getGroupColor } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategorySelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  type?: "income" | "expense";
  placeholder?: string;
  className?: string;
}

export function CategorySelect({
  value,
  onValueChange,
  type,
  placeholder = "Ch\u1ECDn danh m\u1EE5c",
  className,
}: CategorySelectProps) {
  const { categories, isLoading } = useCategories(type);

  const grouped = (categories ?? []).reduce<
    Record<string, { abbreviation: string; full_name: string }[]>
  >((acc, cat) => {
    const group = cat.group;
    if (!acc[group]) acc[group] = [];
    acc[group].push({
      abbreviation: cat.abbreviation,
      full_name: cat.full_name,
    });
    return acc;
  }, {});

  return (
    <Select value={value} onValueChange={onValueChange} disabled={isLoading}>
      <SelectTrigger className={className}>
        <SelectValue
          placeholder={isLoading ? "\u0110ang t\u1EA3i..." : placeholder}
        />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(grouped).map(([group, cats]) => (
          <SelectGroup key={group}>
            <SelectLabel className="flex items-center gap-1.5">
              <span
                className={`inline-block h-2 w-2 rounded-full ${getGroupColor(group).dot}`}
              />
              <span className={getGroupColor(group).text}>{group}</span>
            </SelectLabel>
            {cats.map((cat) => (
              <SelectItem key={cat.abbreviation} value={cat.abbreviation}>
                {cat.full_name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

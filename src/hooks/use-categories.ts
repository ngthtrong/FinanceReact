"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Category } from "@/types";

export function useCategories(type?: "income" | "expense") {
  const params = new URLSearchParams();
  if (type) params.set("type", type);

  const { data, error, isLoading, mutate } = useSWR<Category[]>(
    `/api/categories?${params.toString()}`,
    fetcher
  );

  return { categories: data, error, isLoading, mutate };
}

"use client";

import useSWR from "swr";
import { Category } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useCategories(type?: "income" | "expense") {
  const params = new URLSearchParams();
  if (type) params.set("type", type);

  const { data, error, isLoading, mutate } = useSWR<Category[]>(
    `/api/categories?${params.toString()}`,
    fetcher
  );

  return { categories: data, error, isLoading, mutate };
}

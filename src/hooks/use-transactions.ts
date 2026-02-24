"use client";

import useSWR from "swr";
import { Transaction, TransactionFilters, PaginatedResponse } from "@/types";
import { fetcher } from "@/lib/fetcher";

export function useTransactions(filters: TransactionFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== "all") params.set(k, String(v));
  });

  const { data, error, isLoading, mutate } = useSWR<
    PaginatedResponse<Transaction>
  >(`/api/transactions?${params.toString()}`, fetcher);

  return { data, error, isLoading, mutate };
}

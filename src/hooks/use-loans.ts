"use client";

import useSWR from "swr";
import { Loan, LoanFilters } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useLoans(filters: LoanFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== "all") params.set(k, String(v));
  });

  const { data, error, isLoading, mutate } = useSWR<Loan[]>(
    `/api/loans?${params.toString()}`,
    fetcher
  );

  return { data, error, isLoading, mutate };
}

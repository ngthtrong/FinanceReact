"use client";

import useSWR from "swr";
import { MonthlyReport } from "@/types";
import { fetcher } from "@/lib/fetcher";

export function useMonthlyReport(year?: number, month?: number) {
  const params = new URLSearchParams();
  if (year !== undefined) params.set("year", String(year));
  if (month !== undefined) params.set("month", String(month));

  const { data, error, isLoading, mutate } = useSWR<MonthlyReport>(
    `/api/bao-cao?${params.toString()}`,
    fetcher
  );

  return { data, error, isLoading, mutate };
}

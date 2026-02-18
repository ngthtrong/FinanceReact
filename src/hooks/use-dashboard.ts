"use client";

import useSWR from "swr";
import { DashboardData } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useDashboard(year?: number, month?: number, dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams();
  if (year !== undefined) params.set("year", String(year));
  if (month !== undefined) params.set("month", String(month));
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);

  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    `/api/dashboard?${params.toString()}`,
    fetcher
  );

  return { data, error, isLoading, mutate };
}

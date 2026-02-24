"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useBalance() {
  const { data, error, isLoading, mutate } = useSWR<{ currentBalance: number }>(
    "/api/balance",
    fetcher
  );

  return {
    balance: data?.currentBalance,
    error,
    isLoading,
    mutate,
  };
}

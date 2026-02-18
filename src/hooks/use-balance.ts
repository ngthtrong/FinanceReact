"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

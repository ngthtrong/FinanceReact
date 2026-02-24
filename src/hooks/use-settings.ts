"use client";

import useSWR from "swr";
import { AppSettings } from "@/types";
import { fetcher } from "@/lib/fetcher";

export function useSettings() {
  const { data, error, isLoading, mutate } = useSWR<AppSettings>(
    "/api/settings",
    fetcher
  );

  const updateSettings = async (updates: Partial<AppSettings>) => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update settings");
    const updated = await res.json();
    mutate(updated, false);
    return updated;
  };

  return { settings: data, error, isLoading, mutate, updateSettings };
}

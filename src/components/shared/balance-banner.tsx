"use client";

import { useState, useCallback, useEffect } from "react";
import { Landmark, Banknote, Building2, ChevronDown, ChevronUp, Save, Check } from "lucide-react";
import useSWR from "swr";
import { useBalance } from "@/hooks/use-balance";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { formatVND } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatInputDisplay(value: number): string {
  if (value === 0) return "";
  return new Intl.NumberFormat("vi-VN").format(value);
}

function useDbMoneyInput(serverValue: number) {
  const [value, setValue] = useState(serverValue);
  const [focused, setFocused] = useState(false);
  const [rawInput, setRawInput] = useState("");
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!synced && serverValue !== undefined) {
      setValue(serverValue);
      setSynced(true);
    }
  }, [serverValue, synced]);

  const displayValue = focused ? rawInput : formatInputDisplay(value);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setRawInput(raw);
    setValue(raw ? parseInt(raw, 10) : 0);
  }, []);

  const onFocus = useCallback(() => {
    setFocused(true);
    setRawInput(value === 0 ? "" : String(value));
  }, [value]);

  const onBlur = useCallback(() => {
    setFocused(false);
  }, []);

  return { value, displayValue, onChange, onFocus, onBlur };
}

export function BalanceBanner() {
  const { balance, isLoading } = useBalance();
  const [expanded, setExpanded] = usePersistedState<boolean>("finance:banner-expanded", false);

  const { data: configData, isLoading: configLoading, mutate: mutateConfig } =
    useSWR<{ cash: number; bank: number }>("/api/balance/config", fetcher);

  const serverCash = configData?.cash ?? 0;
  const serverBank = configData?.bank ?? 0;

  const cashInput = useDbMoneyInput(serverCash);
  const bankInput = useDbMoneyInput(serverBank);

  const isDirty = cashInput.value !== serverCash || bankInput.value !== serverBank;
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveConfig = useCallback(async () => {
    setSaving(true);
    await fetch("/api/balance/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cash: cashInput.value, bank: bankInput.value }),
    });
    mutateConfig({ cash: cashInput.value, bank: bankInput.value }, false);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [cashInput.value, bankInput.value, mutateConfig]);

  const actualTotal = cashInput.value + bankInput.value;
  const diff = balance !== undefined ? actualTotal - balance : 0;
  const hasManualEntry = cashInput.value > 0 || bankInput.value > 0;

  return (
    <div className="sticky top-0 z-10 -mx-3 -mt-3 mb-4 md:-mx-6 md:-mt-6 md:mb-6">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {/* Main row */}
        <div className="flex items-center justify-between px-4 py-2.5 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Landmark className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Hệ thống</span>
              <div>
                {isLoading || balance === undefined ? (
                  <Skeleton className="h-6 w-28" />
                ) : (
                  <span
                    className={`text-lg font-bold tracking-tight ${
                      balance >= 0 ? "text-primary" : "text-red-600"
                    }`}
                  >
                    {formatVND(balance)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Compact actual summary when collapsed */}
            {!expanded && hasManualEntry && balance !== undefined && (
              <div className="hidden items-center gap-2 text-sm sm:flex">
                <span className="text-muted-foreground">Thực tế:</span>
                <span className="font-semibold">{formatVND(actualTotal)}</span>
                <span
                  className={`text-xs font-medium ${
                    diff === 0
                      ? "text-green-600"
                      : diff > 0
                        ? "text-blue-600"
                        : "text-red-600"
                  }`}
                >
                  ({diff >= 0 ? "+" : ""}{formatVND(diff).replace("₫", "").trim()}₫)
                </span>
              </div>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Expanded: manual entry */}
        {expanded && (
          <div className="border-t px-4 py-2.5 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              {/* Cash input */}
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 shrink-0 text-green-600" />
                <span className="w-14 shrink-0 text-xs text-muted-foreground">Tiền mặt</span>
                {configLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cashInput.displayValue}
                    onChange={cashInput.onChange}
                    onBlur={cashInput.onBlur}
                    onFocus={cashInput.onFocus}
                    placeholder="0"
                    className="h-8 w-32 rounded-md border bg-background px-2 text-sm font-medium tabular-nums text-right focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                )}
              </div>

              {/* Bank input */}
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0 text-blue-600" />
                <span className="w-14 shrink-0 text-xs text-muted-foreground">Ngân hàng</span>
                {configLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={bankInput.displayValue}
                    onChange={bankInput.onChange}
                    onBlur={bankInput.onBlur}
                    onFocus={bankInput.onFocus}
                    placeholder="0"
                    className="h-8 w-32 rounded-md border bg-background px-2 text-sm font-medium tabular-nums text-right focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                )}
              </div>

              {/* Save button */}
              <button
                onClick={saveConfig}
                disabled={!isDirty || saving || configLoading}
                className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors ${
                  saved
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : isDirty
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "cursor-not-allowed bg-muted text-muted-foreground"
                }`}
              >
                {saved ? (
                  <><Check className="h-3.5 w-3.5" />Đã lưu</>
                ) : saving ? (
                  <><Save className="h-3.5 w-3.5 animate-pulse" />Đang lưu...</>
                ) : (
                  <><Save className="h-3.5 w-3.5" />Lưu</>
                )}
              </button>

              <Separator orientation="vertical" className="hidden h-6 sm:block" />

              {/* Totals */}
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Thực tế</span>
                  <p className="font-bold tabular-nums">{formatVND(actualTotal)}</p>
                </div>
                {balance !== undefined && (
                  <div>
                    <span className="text-xs text-muted-foreground">Chênh lệch</span>
                    <p
                      className={`font-bold tabular-nums ${
                        diff === 0
                          ? "text-green-600"
                          : diff > 0
                            ? "text-blue-600"
                            : "text-red-600"
                      }`}
                    >
                      {diff >= 0 ? "+" : ""}{formatVND(diff)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

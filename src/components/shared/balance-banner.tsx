"use client";

import { useState, useCallback } from "react";
import { Landmark, Banknote, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { useBalance } from "@/hooks/use-balance";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { formatVND } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

function parseInputNumber(value: string): number {
  const cleaned = value.replace(/[^0-9]/g, "");
  return cleaned ? parseInt(cleaned, 10) : 0;
}

function formatInputDisplay(value: number): string {
  if (value === 0) return "";
  return new Intl.NumberFormat("vi-VN").format(value);
}

function useMoneyInput(persistKey: string) {
  const [value, setValue] = usePersistedState<number>(persistKey, 0);
  const [focused, setFocused] = useState(false);
  const [rawInput, setRawInput] = useState("");

  const displayValue = focused ? rawInput : formatInputDisplay(value);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9]/g, "");
      setRawInput(raw);
      setValue(raw ? parseInt(raw, 10) : 0);
    },
    [setValue]
  );

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
  const cashInput = useMoneyInput("finance:manual-cash");
  const bankInput = useMoneyInput("finance:manual-bank");
  const [expanded, setExpanded] = usePersistedState<boolean>("finance:banner-expanded", false);

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
              </div>

              {/* Bank input */}
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0 text-blue-600" />
                <span className="w-14 shrink-0 text-xs text-muted-foreground">Ngân hàng</span>
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
              </div>

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

"use client";

import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  amount: number;
  showSign?: boolean;
  colorCode?: boolean;
  className?: string;
}

const formatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function CurrencyDisplay({
  amount,
  showSign = false,
  colorCode = false,
  className,
}: CurrencyDisplayProps) {
  const absFormatted = formatter.format(Math.abs(amount));
  let display: string;

  if (showSign) {
    const sign = amount >= 0 ? "+" : "-";
    display = `${sign}${absFormatted}`;
  } else {
    display = formatter.format(amount);
  }

  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        colorCode && amount > 0 && "text-green-600",
        colorCode && amount < 0 && "text-red-600",
        className
      )}
    >
      {display}
    </span>
  );
}

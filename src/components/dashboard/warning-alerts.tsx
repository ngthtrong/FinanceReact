"use client";

import { AlertTriangle, Info } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { formatVND } from "@/lib/formatters";
import type { SpendingWarning } from "@/types";

interface WarningAlertsProps {
  warnings: SpendingWarning[];
}

function getAlertStyles(severity: SpendingWarning["severity"]) {
  switch (severity) {
    case "critical":
      return {
        className: "border-red-500/50 bg-red-50/50 dark:bg-red-950/20",
        icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
      };
    case "warning":
      return {
        className: "border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20",
        icon: <AlertTriangle className="h-4 w-4 text-orange-600" />,
      };
    case "info":
      return {
        className: "border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20",
        icon: <Info className="h-4 w-4 text-blue-600" />,
      };
  }
}

export function WarningAlerts({ warnings }: WarningAlertsProps) {
  const visibleWarnings = warnings.slice(0, 5);

  if (visibleWarnings.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border p-6">
        <div className="text-center">
          <Info className="mx-auto mb-2 h-8 w-8 text-green-500" />
          <p className="text-sm font-medium text-green-600">
            Không có cảnh báo nào
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Chi tiêu của bạn đang trong giới hạn cho phép
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">Cảnh báo</h3>
      {visibleWarnings.map((warning) => {
        const styles = getAlertStyles(warning.severity);
        return (
          <Alert
            key={warning.id}
            variant={warning.severity === "critical" ? "destructive" : "default"}
            className={styles.className}
          >
            {styles.icon}
            <AlertTitle className="text-sm">{warning.title}</AlertTitle>
            <AlertDescription>
              <p>{warning.message}</p>
              {warning.currentAmount > 0 && warning.thresholdAmount > 0 && (
                <p className="mt-1 text-xs">
                  {formatVND(warning.currentAmount)} /{" "}
                  {formatVND(warning.thresholdAmount)}
                  {warning.percentageOver > 0 && (
                    <span className="ml-1 font-medium text-red-600">
                      (+{warning.percentageOver.toFixed(0)}%)
                    </span>
                  )}
                </p>
              )}
            </AlertDescription>
          </Alert>
        );
      })}
      {warnings.length > 5 && (
        <p className="text-center text-xs text-muted-foreground">
          Và {warnings.length - 5} cảnh báo khác...
        </p>
      )}
    </div>
  );
}

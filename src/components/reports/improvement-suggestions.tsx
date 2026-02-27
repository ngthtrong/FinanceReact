"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImprovementSuggestion } from "@/types";
import { formatVND } from "@/lib/formatters";
import { Lightbulb, ChevronRight } from "lucide-react";

interface Props {
  suggestions: ImprovementSuggestion[];
}

const PRIORITY_CONFIG = {
  high: {
    label: "Ưu tiên cao",
    badge: "destructive" as const,
    border: "border-red-200 dark:border-red-800",
    bg: "bg-red-50/50 dark:bg-red-950/20",
  },
  medium: {
    label: "Trung bình",
    badge: "secondary" as const,
    border: "border-yellow-200 dark:border-yellow-800",
    bg: "bg-yellow-50/50 dark:bg-yellow-950/20",
  },
  low: {
    label: "Tham khảo",
    badge: "outline" as const,
    border: "border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50/50 dark:bg-blue-950/20",
  },
};

export function ImprovementSuggestions({ suggestions }: Props) {
  if (suggestions.length === 0) return null;

  const totalPotentialSaving = suggestions.reduce((s, sg) => s + sg.potentialSaving, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="size-5 text-yellow-500" />
          Gợi ý cải thiện
          {totalPotentialSaving > 0 && (
            <span className="ml-auto text-sm font-normal text-green-600 dark:text-green-400">
              Tiềm năng tiết kiệm: {formatVND(totalPotentialSaving)}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestions.map((suggestion) => {
            const config = PRIORITY_CONFIG[suggestion.priority];
            return (
              <div
                key={suggestion.id}
                className={`rounded-lg border p-4 ${config.border} ${config.bg}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{suggestion.icon}</span>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{suggestion.title}</span>
                      <Badge variant={config.badge} className="text-xs">
                        {config.label}
                      </Badge>
                      {suggestion.potentialSaving > 0 && (
                        <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400">
                          ~{formatVND(suggestion.potentialSaving)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    {suggestion.actionItems.length > 0 && (
                      <ul className="space-y-1">
                        {suggestion.actionItems.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <ChevronRight className="size-3 mt-0.5 shrink-0 text-primary" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

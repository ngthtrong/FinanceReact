"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getHealthLabel } from "@/lib/constants";
import type { HealthScore as HealthScoreType } from "@/types";

interface HealthScoreCardProps {
  healthScore: HealthScoreType;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 50) return "#eab308";
  if (score >= 30) return "#f97316";
  return "#ef4444";
}

function CircularProgress({ score }: { score: number }) {
  const radius = 60;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="144" height="144" viewBox="0 0 144 144">
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          transform="rotate(-90 72 72)"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

export function HealthScoreCard({ healthScore }: HealthScoreCardProps) {
  const [expanded, setExpanded] = useState(false);
  const label = getHealthLabel(healthScore.overall);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Sức khoẻ tài chính</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <CircularProgress score={healthScore.overall} />
        <span className={`text-sm font-semibold ${label.color}`}>
          {label.label}
        </span>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? "Ẩn chi tiết" : "Xem chi tiết"}
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {expanded && (
          <div className="w-full space-y-3">
            {healthScore.breakdown.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">
                    {item.score}/{item.maxScore}
                  </span>
                </div>
                <Progress
                  value={(item.score / item.maxScore) * 100}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

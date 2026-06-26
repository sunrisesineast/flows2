"use client";

import { useId, type ReactNode } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { cn, GLASS_SURFACE } from "@/lib/utils";

type Trend = "up" | "down" | "neutral";

const TREND_COLOR: Record<Trend, string> = {
  up: "#10b981",
  down: "#ef4444",
  neutral: "var(--ink-3)",
};

function Sparkline({
  data,
  color,
  className,
}: {
  data: number[];
  color: string;
  className?: string;
}) {
  const gradientId = useId();
  const points = data.map((v, i) => ({ i, v }));

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            fill={`url(#${gradientId})`}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MetricCard({
  title,
  value,
  valueSuffix,
  subValue,
  trendValue,
  trendLabel,
  statusLabel,
  statusValue,
  chartData,
  trend = "up",
  accentColor,
  statusColor,
  compact = false,
  className,
}: {
  title: string;
  value: string;
  valueSuffix?: ReactNode;
  subValue?: string;
  trendValue?: string | number;
  trendLabel?: string;
  statusLabel?: string;
  statusValue?: string;
  chartData: number[];
  trend?: Trend;
  accentColor?: string;
  statusColor?: string;
  compact?: boolean;
  className?: string;
}) {
  const chartColor = accentColor ?? TREND_COLOR[trend];
  const lineColor = statusColor ?? chartColor;

  if (compact) {
    return (
      <Card className={cn(GLASS_SURFACE, "py-0", className)}>
        <CardContent className="flex h-full flex-col p-4">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            {value}
            {valueSuffix && <span className="ml-1 text-lg text-amber-400">{valueSuffix}</span>}
          </p>
          <div className="mt-3 flex items-end justify-between gap-2">
            <div className="min-w-0">
              {statusLabel && <p className="text-xs text-muted-foreground">{statusLabel}</p>}
              {statusValue && (
                <p className="text-sm font-medium" style={{ color: lineColor }}>
                  {statusValue}
                </p>
              )}
            </div>
            <Sparkline data={chartData} color={chartColor} className="h-10 w-16 shrink-0" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(GLASS_SURFACE, "py-0", className)}>
      <CardContent className="flex items-stretch gap-4 p-5">
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {value}
            {valueSuffix}
          </p>
          {subValue && <p className="text-sm text-muted-foreground">{subValue}</p>}
          {(trendValue != null || trendLabel) && (
            <p className="mt-1 text-sm">
              {trendValue != null && (
                <span style={{ color: lineColor }} className="font-medium">
                  {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
                </span>
              )}
              {trendLabel && (
                <span className="text-muted-foreground">
                  {trendValue != null ? " " : ""}
                  {trendLabel}
                </span>
              )}
            </p>
          )}
        </div>
        <Sparkline data={chartData} color={chartColor} className="h-[72px] w-[140px] shrink-0 self-end" />
      </CardContent>
    </Card>
  );
}

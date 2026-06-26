"use client";

import Link from "next/link";
import { Fragment, useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, GLASS_SURFACE } from "@/lib/utils";

export type OccupancyLevel = "available" | "low" | "medium" | "high" | "full";

const LEVEL_BG: Record<OccupancyLevel, string> = {
  available: "#bbf7d0",
  low: "#fef08a",
  medium: "#fed7aa",
  high: "#fb923c",
  full: "#fca5a5",
};

const LEGEND: { level: OccupancyLevel; label: string }[] = [
  { level: "available", label: "Available" },
  { level: "low", label: "Low (1–11%)" },
  { level: "medium", label: "Medium (12–60%)" },
  { level: "high", label: "High (61–90%)" },
  { level: "full", label: "Full (91–100%)" },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

// ponytail: preview subset — full room list on dedicated calendar view
const MOCK_ROOMS = ["101", "102", "103", "104", "105", "106"];

const MOCK_OCCUPANCY: OccupancyLevel[][] = [
  ["full", "full", "full", "high", "medium", "low", "available"],
  ["full", "full", "high", "high", "medium", "available", "available"],
  ["medium", "medium", "high", "full", "full", "full", "high"],
  ["available", "low", "medium", "medium", "high", "full", "full"],
  ["full", "full", "full", "full", "medium", "low", "available"],
  ["high", "high", "medium", "low", "available", "available", "low"],
];

const MOCK_WEEK_START = new Date(2024, 5, 24);

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function formatDayHeader(date: Date) {
  return (
    <>
      <span className="block text-[11px] font-medium leading-none text-foreground">{date.getDate()}</span>
      <span className="mt-0.5 block text-[9px] leading-none text-muted-foreground">
        {DAY_NAMES[date.getDay()]}
      </span>
    </>
  );
}

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}

export function OccupancyHeatMap({
  rooms = MOCK_ROOMS,
  occupancy = MOCK_OCCUPANCY,
  weekStart = MOCK_WEEK_START,
  viewAllHref = "#",
  className,
}: {
  rooms?: string[];
  occupancy?: OccupancyLevel[][];
  weekStart?: Date;
  viewAllHref?: string;
  className?: string;
}) {
  const [weekOffset, setWeekOffset] = useState(0);

  const activeWeekStart = useMemo(
    () => addDays(weekStart, weekOffset * 7),
    [weekStart, weekOffset]
  );

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(activeWeekStart, i)),
    [activeWeekStart]
  );

  const goPrevWeek = () => setWeekOffset((w) => w - 1);
  const goNextWeek = () => setWeekOffset((w) => w + 1);

  return (
    <Card className={cn(GLASS_SURFACE, "h-fit gap-0 overflow-hidden py-0", className)}>
      <CardHeader className="grid-rows-1 items-center border-b px-3 py-3">
        <CardTitle className="truncate text-sm font-semibold leading-none">
          Occupancy Calendar (Heat Map)
        </CardTitle>
        <CardAction>
          <Link
            href={viewAllHref}
            className={cn(
              buttonVariants({ variant: "link", size: "sm" }),
              "h-auto shrink-0 p-0 text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            )}
          >
            View full calendar
          </Link>
        </CardAction>
      </CardHeader>

      <CardContent className="flex items-center justify-between border-b px-3 py-1.5">
        <div className="flex items-center gap-0.5">
          <NavButton label="Previous week" onClick={goPrevWeek}>
            <ChevronLeft className="size-3.5" strokeWidth={2.25} />
          </NavButton>
          <span className="min-w-[5.5rem] text-center text-xs font-medium text-foreground">
            {formatMonthYear(activeWeekStart)}
          </span>
          <NavButton label="Next week" onClick={goNextWeek}>
            <ChevronRight className="size-3.5" strokeWidth={2.25} />
          </NavButton>
        </div>
        <NavButton label="Next week" onClick={goNextWeek}>
          <ChevronRight className="size-3.5" strokeWidth={2.25} />
        </NavButton>
      </CardContent>

      <CardContent className="overflow-x-auto p-0">
        <div
          className="grid w-full min-w-0"
          style={{ gridTemplateColumns: `2rem repeat(${days.length}, minmax(0.875rem, 1fr))` }}
        >
          <div className="border-b border-r bg-muted/30 px-1.5 py-1.5 text-[10px] font-medium text-muted-foreground">
            Room
          </div>
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="border-b px-0.5 py-1 text-center"
            >
              {formatDayHeader(day)}
            </div>
          ))}

          {rooms.map((room, rowIndex) => (
            <Fragment key={room}>
              <div className="flex min-h-6 items-center border-b border-r bg-muted/20 px-1.5 text-[10px] font-medium text-foreground">
                {room}
              </div>
              {(occupancy[rowIndex] ?? Array(7).fill("available" as OccupancyLevel)).map(
                (level, colIndex) => (
                  <div
                    key={`${room}-${colIndex}`}
                    className="min-h-6 border-b border-r border-border/30"
                    style={{ backgroundColor: LEVEL_BG[level] }}
                    title={`Room ${room} · ${days[colIndex].getDate()} ${DAY_NAMES[days[colIndex].getDay()]} · ${LEGEND.find((l) => l.level === level)?.label}`}
                  />
                )
              )}
            </Fragment>
          ))}
        </div>
      </CardContent>

      <CardContent className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t px-3 py-2">
        {LEGEND.map(({ level, label }) => (
          <div key={level} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span
              className="size-2.5 shrink-0 rounded-sm ring-1 ring-border/40"
              style={{ backgroundColor: LEVEL_BG[level] }}
              aria-hidden
            />
            {label}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

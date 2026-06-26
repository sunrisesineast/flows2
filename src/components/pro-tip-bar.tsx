"use client";

import Link from "next/link";
import { Lightbulb, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProTipBar({
  occupancy = 68,
  message,
  actionHref = "#",
  actionLabel = "Create Offer Now",
  className,
}: {
  occupancy?: number;
  message?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}) {
  const tipMessage =
    message ??
    `Your occupancy is ${occupancy}%. Consider launching a last-minute offer for this week to reach your goal!`;

  return (
    <Alert
      className={cn(
        "flex flex-col gap-3 rounded-xl border-violet-200/80 bg-violet-50/95 px-4 py-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:flex-row sm:items-center sm:justify-between sm:gap-4 dark:border-violet-500/20 dark:bg-violet-500/15",
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3 sm:items-center">
        <span className="relative mt-0.5 flex size-8 shrink-0 items-center justify-center sm:mt-0">
          <Lightbulb
            className="size-5 fill-amber-300 text-amber-400"
            strokeWidth={1.75}
          />
          <Sparkles
            className="absolute -top-0.5 -right-0.5 size-3 text-amber-500"
            strokeWidth={2}
          />
        </span>
        <div className="min-w-0 space-y-0.5">
          <AlertTitle className="inline text-sm font-semibold text-violet-950 dark:text-violet-100">
            Pro Tip:
          </AlertTitle>{" "}
          <AlertDescription className="inline text-sm leading-snug text-violet-800/90 dark:text-violet-200/90">
            {tipMessage}
          </AlertDescription>
        </div>
      </div>
      <Button
        size="sm"
        className="w-full shrink-0 bg-violet-600 text-white hover:bg-violet-700 sm:w-auto"
        render={<Link href={actionHref} />}
      >
        {actionLabel}
      </Button>
    </Alert>
  );
}

"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Item,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Progress, ProgressValue } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type ChannelPerformanceItem = {
  id: string;
  name: string;
  iconColor: string;
  iconContent: ReactNode;
  barColor: string;
  amount: number;
  percentage: number;
};

export const MOCK_CHANNEL_PERFORMANCE: ChannelPerformanceItem[] = [
  {
    id: "booking",
    name: "Booking.com",
    iconColor: "#003580",
    iconContent: "B",
    barColor: "#2563eb",
    amount: 95400,
    percentage: 45,
  },
  {
    id: "agoda",
    name: "Agoda",
    iconColor: "#ffffff",
    iconContent: "A",
    barColor: "#ef4444",
    amount: 62300,
    percentage: 30,
  },
  {
    id: "gozayaan",
    name: "Gozayaan",
    iconColor: "#111827",
    iconContent: "G",
    barColor: "#f59e0b",
    amount: 28700,
    percentage: 14,
  },
  {
    id: "direct",
    name: "Direct / Website",
    iconColor: "#16a34a",
    iconContent: <Globe className="size-3.5" strokeWidth={2.25} />,
    barColor: "#22c55e",
    amount: 15200,
    percentage: 7,
  },
  {
    id: "meta",
    name: "Meta / Social",
    iconColor: "#1877F2",
    iconContent: "∞",
    barColor: "#60a5fa",
    amount: 8900,
    percentage: 4,
  },
];

function formatAmount(amount: number) {
  return `৳ ${amount.toLocaleString("en-US")}`;
}

function ChannelIcon({ channel }: { channel: ChannelPerformanceItem }) {
  const isAgoda = channel.id === "agoda";

  return (
    <Avatar
      className={cn(
        "size-7 rounded-md after:rounded-md after:border-transparent",
        isAgoda && "ring-1 ring-border"
      )}
    >
      <AvatarFallback
        className={cn(
          "rounded-md text-[11px] font-bold",
          isAgoda ? "bg-white text-rose-600" : "text-white"
        )}
        style={{ backgroundColor: isAgoda ? undefined : channel.iconColor }}
      >
        {channel.iconContent}
      </AvatarFallback>
    </Avatar>
  );
}

function ChannelRow({ channel }: { channel: ChannelPerformanceItem }) {
  return (
    <Item className="flex-nowrap items-center gap-2.5 border-transparent px-0 py-0 sm:gap-3">
      <ItemMedia variant="image" className="size-7 shrink-0 rounded-md">
        <ChannelIcon channel={channel} />
      </ItemMedia>
      <ItemTitle className="w-[5.5rem] shrink-0 font-normal sm:w-28">
        {channel.name}
      </ItemTitle>
      <Progress
        value={channel.percentage}
        style={{ "--bar-color": channel.barColor } as CSSProperties}
        className={cn(
          "grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-2 gap-y-0 sm:gap-x-3",
          "[&_[data-slot=progress-track]]:col-start-1 [&_[data-slot=progress-track]]:row-start-1 [&_[data-slot=progress-track]]:h-2",
          "[&_[data-slot=progress-indicator]]:bg-[var(--bar-color)]"
        )}
      >
        <span className="col-start-2 row-start-1 w-[4.75rem] shrink-0 text-right text-sm tabular-nums text-foreground sm:w-20">
          {formatAmount(channel.amount)}
        </span>
        <ProgressValue className="col-start-3 row-start-1 ml-0 w-9 shrink-0 text-right">
          {() => `${channel.percentage}%`}
        </ProgressValue>
      </Progress>
    </Item>
  );
}

export function ChannelPerformance({
  channels = MOCK_CHANNEL_PERFORMANCE,
  viewReportHref = "#",
  className,
}: {
  channels?: ChannelPerformanceItem[];
  viewReportHref?: string;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 overflow-hidden py-0", className)}>
      <CardHeader className="grid-rows-1 items-center border-b px-3 py-3">
        <CardTitle className="text-base font-semibold leading-none">
          Channel Performance (This Month)
        </CardTitle>
        <CardAction>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            render={<Link href={viewReportHref} />}
          >
            View report
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-3 py-4 sm:px-4">
        <ItemGroup className="gap-4">
          {channels.map((channel) => (
            <ChannelRow key={channel.id} channel={channel} />
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}

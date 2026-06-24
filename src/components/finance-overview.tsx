"use client";

import Link from "next/link";
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
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { cn } from "@/lib/utils";

export type FinanceOverviewData = {
  roomRevenue: number;
  otherIncome: number;
  totalIncome: number;
  expenses: number;
  netProfit: number;
};

export const MOCK_FINANCE_OVERVIEW: FinanceOverviewData = {
  roomRevenue: 18750,
  otherIncome: 2300,
  totalIncome: 21050,
  expenses: 6750,
  netProfit: 14300,
};

function formatAmount(amount: number) {
  return `₺ ${amount.toLocaleString("en-US")}`;
}

function FinanceRow({
  label,
  amount,
  emphasis = false,
  profit = false,
}: {
  label: string;
  amount: number;
  emphasis?: boolean;
  profit?: boolean;
}) {
  return (
    <Item className="items-center justify-between border-transparent px-0 py-0">
      <ItemTitle className={cn("font-normal", emphasis && "font-semibold")}>
        {label}
      </ItemTitle>
      <ItemActions className="gap-0">
        <span
          className={cn(
            "text-sm tabular-nums text-foreground",
            emphasis && "font-semibold",
            profit && "font-semibold text-emerald-600 dark:text-emerald-400"
          )}
        >
          {formatAmount(amount)}
        </span>
      </ItemActions>
    </Item>
  );
}

export function FinanceOverview({
  data = MOCK_FINANCE_OVERVIEW,
  viewDetailsHref = "#",
  className,
}: {
  data?: FinanceOverviewData;
  viewDetailsHref?: string;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 overflow-hidden py-0", className)}>
      <CardHeader className="grid-rows-1 items-center border-b px-3 py-3">
        <CardTitle className="text-base font-semibold leading-none">
          Finance Overview (Today)
        </CardTitle>
        <CardAction>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
            render={<Link href={viewDetailsHref} />}
          >
            View details
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-3 py-4 sm:px-4">
        <ItemGroup className="gap-3">
          <FinanceRow label="Room Revenue" amount={data.roomRevenue} />
          <FinanceRow label="Other Income" amount={data.otherIncome} />
          <ItemSeparator />
          <FinanceRow label="Total Income" amount={data.totalIncome} emphasis />
          <FinanceRow label="Expenses" amount={data.expenses} />
          <ItemSeparator />
          <FinanceRow label="Net Profit" amount={data.netProfit} emphasis profit />
        </ItemGroup>
      </CardContent>
    </Card>
  );
}

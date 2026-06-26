"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Label, Pie, PieChart } from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Item,
  ItemActions,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { cn, GLASS_SURFACE } from "@/lib/utils";

export type ExpenseCategory = {
  id: string;
  name: string;
  amount: number;
};

export type ExpensesVsBudgetData = {
  categories: ExpenseCategory[];
  budget: number;
};

export const MOCK_EXPENSES_VS_BUDGET: ExpensesVsBudgetData = {
  categories: [
    { id: "payroll", name: "Payroll", amount: 32000 },
    { id: "maintenance", name: "Maintenance", amount: 15500 },
    { id: "utilities", name: "Utilities", amount: 10200 },
    { id: "marketing", name: "Marketing", amount: 8800 },
    { id: "other", name: "Other", amount: 12000 },
  ],
  budget: 90000,
};

const chartConfig = {
  amount: {
    label: "Amount",
  },
  payroll: {
    label: "Payroll",
    color: "#2563eb",
  },
  maintenance: {
    label: "Maintenance",
    color: "#f97316",
  },
  utilities: {
    label: "Utilities",
    color: "#22c55e",
  },
  marketing: {
    label: "Marketing",
    color: "#8b5cf6",
  },
  other: {
    label: "Other",
    color: "#9ca3af",
  },
} satisfies ChartConfig;

const CATEGORY_COLORS: Record<string, string> = {
  payroll: chartConfig.payroll.color,
  maintenance: chartConfig.maintenance.color,
  utilities: chartConfig.utilities.color,
  marketing: chartConfig.marketing.color,
  other: chartConfig.other.color,
};

function formatAmount(amount: number) {
  return `৳ ${amount.toLocaleString("en-US")}`;
}

function CategoryLegendItem({ category }: { category: ExpenseCategory }) {
  const color = CATEGORY_COLORS[category.id];

  return (
    <Item className="items-center justify-between border-transparent px-0 py-0">
      <ItemMedia variant="default" className="gap-2">
        <span
          className="size-2.5 shrink-0 rounded-sm"
          style={{ backgroundColor: color }}
        />
        <ItemTitle className="font-normal">{category.name}</ItemTitle>
      </ItemMedia>
      <ItemActions className="gap-0">
        <span className="text-sm tabular-nums text-foreground">
          {formatAmount(category.amount)}
        </span>
      </ItemActions>
    </Item>
  );
}

export function ExpensesVsBudget({
  data = MOCK_EXPENSES_VS_BUDGET,
  viewBudgetHref = "#",
  className,
}: {
  data?: ExpensesVsBudgetData;
  viewBudgetHref?: string;
  className?: string;
}) {
  const totalExpenses = useMemo(
    () => data.categories.reduce((sum, category) => sum + category.amount, 0),
    [data.categories]
  );

  const budgetUsedPercent = Math.round((totalExpenses / data.budget) * 100);

  const chartData = useMemo(
    () =>
      data.categories.map((category) => ({
        category: category.id,
        amount: category.amount,
        fill: `var(--color-${category.id})`,
      })),
    [data.categories]
  );

  return (
    <Card className={cn(GLASS_SURFACE, "gap-0 overflow-hidden py-0", className)}>
      <CardHeader className="grid-rows-1 items-center border-b px-3 py-3">
        <CardTitle className="text-base font-semibold leading-none">
          Expenses vs Budget (This Month)
        </CardTitle>
        <CardAction>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            render={<Link href={viewBudgetHref} />}
          >
            View budget
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-3 py-4 sm:px-4">
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square w-full max-h-[168px] min-h-[140px]"
            initialDimension={{ width: 168, height: 168 }}
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="category" />}
              />
              <Pie
                data={chartData}
                dataKey="amount"
                nameKey="category"
                innerRadius={48}
                outerRadius={72}
                strokeWidth={4}
                stroke="var(--color-card)"
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) - 6}
                            className="fill-foreground text-base font-bold"
                          >
                            {formatAmount(totalExpenses)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) + 14}
                            className="fill-muted-foreground text-[11px]"
                          >
                            Total Expenses
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>

          <ItemGroup className="gap-2.5">
            {data.categories.map((category) => (
              <CategoryLegendItem key={category.id} category={category} />
            ))}
          </ItemGroup>
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t px-3 py-3 sm:px-4">
        <span className="text-sm font-semibold text-foreground">
          Budget: {formatAmount(data.budget)}
        </span>
        <p className="text-sm text-foreground">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {budgetUsedPercent}%
          </span>{" "}
          of budget used
        </p>
      </CardFooter>
    </Card>
  );
}

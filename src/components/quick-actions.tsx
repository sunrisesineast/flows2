"use client";

import Link from "next/link";
import {
  ChevronRight,
  FileBarChart,
  Megaphone,
  Plus,
  Tag,
  UserCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Item,
  ItemActions,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { cn } from "@/lib/utils";

export type QuickAction = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  iconVariant?: "solid" | "outline" | "accent";
};

export const MOCK_QUICK_ACTIONS: QuickAction[] = [
  {
    id: "new-booking",
    label: "New Booking (Walk-in)",
    href: "#",
    icon: Plus,
    iconVariant: "solid",
  },
  {
    id: "check-in",
    label: "Check-in Guest",
    href: "#",
    icon: UserCheck,
    iconVariant: "outline",
  },
  {
    id: "add-expense",
    label: "Add Expense",
    href: "#",
    icon: Wallet,
    iconVariant: "outline",
  },
  {
    id: "create-offer",
    label: "Create Offer",
    href: "#",
    icon: Tag,
    iconVariant: "outline",
  },
  {
    id: "send-campaign",
    label: "Send Campaign",
    href: "#",
    icon: Megaphone,
    iconVariant: "outline",
  },
  {
    id: "daily-report",
    label: "Daily Report",
    href: "#",
    icon: FileBarChart,
    iconVariant: "accent",
  },
];

const ICON_VARIANT_CLASS = {
  solid: "bg-violet-600 text-white",
  outline: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  accent: "bg-amber-500 text-white",
} as const;

function QuickActionRow({ action }: { action: QuickAction }) {
  const Icon = action.icon;
  const iconVariant = action.iconVariant ?? "outline";

  return (
    <Item
      render={<Link href={action.href} />}
      className="items-center justify-between rounded-lg border-transparent bg-violet-50/80 px-3 py-2.5 transition-colors hover:bg-violet-100/90 dark:bg-violet-500/10 dark:hover:bg-violet-500/15"
    >
      <ItemMedia variant="default" className="gap-2.5">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            ICON_VARIANT_CLASS[iconVariant]
          )}
        >
          <Icon className="size-4" strokeWidth={iconVariant === "solid" ? 2.5 : 2} />
        </span>
        <ItemTitle className="font-medium text-violet-950 dark:text-violet-100">
          {action.label}
        </ItemTitle>
      </ItemMedia>
      <ItemActions className="gap-0">
        <ChevronRight className="size-4 text-violet-300 dark:text-violet-400" strokeWidth={2} />
      </ItemActions>
    </Item>
  );
}

export function QuickActions({
  actions = MOCK_QUICK_ACTIONS,
  className,
}: {
  actions?: QuickAction[];
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 overflow-hidden py-0", className)}>
      <CardHeader className="border-b px-3 py-3">
        <CardTitle className="text-base font-semibold leading-none text-violet-950 dark:text-violet-100">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 py-4 sm:px-4">
        <ItemGroup className="gap-2">
          {actions.map((action) => (
            <QuickActionRow key={action.id} action={action} />
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}

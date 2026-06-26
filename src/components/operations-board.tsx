"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { cn, GLASS_SURFACE } from "@/lib/utils";

export type OperationTaskStatus = "triage" | "in_progress" | "blocked" | "done";

export type OperationTask = {
  id: string;
  title: string;
  location: string;
  department: string;
  assigneeName: string;
  assigneeAvatar: string;
  status: OperationTaskStatus;
  priorityDot: "red" | "blue" | "green";
  timeAgo: string;
};

type FilterKey = "all" | OperationTaskStatus;

const STATUS_LABEL: Record<OperationTaskStatus, string> = {
  triage: "Triage",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
};

const STATUS_BADGE: Record<OperationTaskStatus, string> = {
  triage:
    "border-transparent bg-red-50 text-red-600 hover:bg-red-50 dark:bg-red-500/15 dark:text-red-300",
  in_progress:
    "border-transparent bg-blue-50 text-blue-600 hover:bg-blue-50 dark:bg-blue-500/15 dark:text-blue-300",
  blocked:
    "border-transparent bg-violet-50 text-violet-600 hover:bg-violet-50 dark:bg-violet-500/15 dark:text-violet-300",
  done: "border-transparent bg-emerald-50 text-emerald-600 hover:bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300",
};

const PRIORITY_DOT: Record<OperationTask["priorityDot"], string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-emerald-500",
};

// ponytail: mock data — wire to real ops/tasks API when backend exists
export const MOCK_OPERATION_TASKS: OperationTask[] = [
  {
    id: "1",
    title: "AC not working in Room 105",
    location: "Room 105",
    department: "Maintenance",
    assigneeName: "Hasan",
    assigneeAvatar: "https://i.pravatar.cc/80?img=12",
    status: "triage",
    priorityDot: "red",
    timeAgo: "10m ago",
  },
  {
    id: "2",
    title: "Extra towel request",
    location: "Room 302",
    department: "Housekeeping",
    assigneeName: "Maya",
    assigneeAvatar: "https://i.pravatar.cc/80?img=47",
    status: "in_progress",
    priorityDot: "blue",
    timeAgo: "15m ago",
  },
  {
    id: "3",
    title: "WiFi not working",
    location: "Room 208",
    department: "IT",
    assigneeName: "Rasel",
    assigneeAvatar: "https://i.pravatar.cc/80?img=33",
    status: "blocked",
    priorityDot: "red",
    timeAgo: "30m ago",
  },
  {
    id: "4",
    title: "Toilet flush issue",
    location: "Room 105",
    department: "Maintenance",
    assigneeName: "Hasan",
    assigneeAvatar: "https://i.pravatar.cc/80?img=12",
    status: "in_progress",
    priorityDot: "blue",
    timeAgo: "45m ago",
  },
  {
    id: "5",
    title: "Early check-in request",
    location: "Room 412",
    department: "Front Desk",
    assigneeName: "Sumi",
    assigneeAvatar: "https://i.pravatar.cc/80?img=26",
    status: "done",
    priorityDot: "green",
    timeAgo: "1h ago",
  },
];

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "triage", label: "Triage" },
  { key: "in_progress", label: "In Progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
];

// ponytail: static totals from design mock — not derived from preview rows
const MOCK_FILTER_COUNTS: Record<FilterKey, number> = {
  all: 18,
  triage: 4,
  in_progress: 7,
  blocked: 2,
  done: 5,
};

function StatusBadge({ status }: { status: OperationTaskStatus }) {
  return (
    <Badge
      variant="secondary"
      className={cn("h-6 justify-center px-3 text-xs font-medium", STATUS_BADGE[status])}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}

function AssigneeCell({ name, avatar }: { name: string; avatar: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <Avatar size="sm" className="after:border-transparent">
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback className="text-[10px] font-medium">{initials}</AvatarFallback>
      </Avatar>
      <span className="text-sm leading-5 text-foreground">{name}</span>
    </div>
  );
}

export function OperationsBoard({
  tasks = MOCK_OPERATION_TASKS,
  viewAllHref = "#",
  className,
}: {
  tasks?: OperationTask[];
  viewAllHref?: string;
  className?: string;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const visibleTasks =
    filter === "all" ? tasks : tasks.filter((task) => task.status === filter);

  return (
    <Card className={cn(GLASS_SURFACE, "gap-0 overflow-hidden py-0", className)}>
      <CardHeader className="grid-rows-1 items-center gap-0 border-b px-3 py-3">
        <CardTitle className="text-base font-semibold leading-none">Operations Board</CardTitle>
        <CardAction>
          <Link
            href={viewAllHref}
            className={cn(
              buttonVariants({ variant: "link", size: "sm" }),
              "h-auto p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            )}
          >
            View all tasks
          </Link>
        </CardAction>
      </CardHeader>

      <CardContent className="border-b px-3 py-2">
        <div className="flex flex-wrap gap-1.5">
          {FILTER_TABS.map(({ key, label }) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                  active
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {label} ({MOCK_FILTER_COUNTS[key]})
              </button>
            );
          })}
        </div>
      </CardContent>

      <CardContent className="p-0">
        <Table>
          <TableBody>
            {visibleTasks.map((task) => (
              <TableRow key={task.id} className="hover:bg-muted/30">
                <TableCell className="whitespace-normal px-3 py-2.5 align-middle sm:w-[38%]">
                  <div className="flex min-w-0 items-start gap-2">
                    <span
                      className={cn("mt-1.5 size-2 shrink-0 rounded-full", PRIORITY_DOT[task.priorityDot])}
                      aria-hidden
                    />
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-sm font-semibold leading-5 text-foreground">
                        {task.title}
                      </p>
                      <p className="truncate text-xs leading-4 text-muted-foreground">
                        {task.location} | {task.department}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden whitespace-normal px-1 py-2.5 align-middle sm:table-cell sm:w-[30%]">
                  <AssigneeCell name={task.assigneeName} avatar={task.assigneeAvatar} />
                </TableCell>
                <TableCell className="whitespace-normal px-3 py-2.5 align-middle sm:w-[32%]">
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <div className="min-w-0 sm:hidden">
                      <AssigneeCell name={task.assigneeName} avatar={task.assigneeAvatar} />
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <StatusBadge status={task.status} />
                      <span className="text-xs leading-4 text-muted-foreground">{task.timeAgo}</span>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

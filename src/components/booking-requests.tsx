"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { cn } from "@/lib/utils";

export type BookingRequestStatus = "new" | "confirmed" | "pending";

export type BookingRequest = {
  id: string;
  source: string;
  sourceColor: string;
  sourceInitial?: string;
  sourceIcon?: ReactNode;
  roomType: string;
  dateRange: string;
  nights: number;
  guestName: string;
  guestCount: number;
  status: BookingRequestStatus;
  timeAgo: string;
};

const STATUS_BADGE: Record<BookingRequestStatus, string> = {
  new: "border-transparent bg-blue-50 text-blue-600 hover:bg-blue-50 dark:bg-blue-500/15 dark:text-blue-300",
  confirmed:
    "border-transparent bg-emerald-50 text-emerald-600 hover:bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300",
  pending:
    "border-transparent bg-orange-50 text-orange-600 hover:bg-orange-50 dark:bg-orange-500/15 dark:text-orange-300",
};

export const MOCK_BOOKING_REQUESTS: BookingRequest[] = [
  {
    id: "1",
    source: "Booking.com",
    sourceColor: "#003580",
    sourceInitial: "B",
    roomType: "Deluxe Double Room",
    dateRange: "26 Jun – 28 Jun",
    nights: 2,
    guestName: "John Doe",
    guestCount: 2,
    status: "new",
    timeAgo: "5m ago",
  },
  {
    id: "2",
    source: "Agoda",
    sourceColor: "#E51937",
    sourceInitial: "A",
    roomType: "Standard Twin Room",
    dateRange: "25 Jun – 26 Jun",
    nights: 1,
    guestName: "Sarah Lee",
    guestCount: 2,
    status: "new",
    timeAgo: "15m ago",
  },
  {
    id: "3",
    source: "Gozayaan",
    sourceColor: "#111827",
    sourceInitial: "G",
    roomType: "Deluxe Double Room",
    dateRange: "27 Jun – 29 Jun",
    nights: 2,
    guestName: "Ali Rahman",
    guestCount: 1,
    status: "new",
    timeAgo: "30m ago",
  },
  {
    id: "4",
    source: "Direct (Website)",
    sourceColor: "#16a34a",
    sourceIcon: <Home className="size-4" strokeWidth={2.25} />,
    roomType: "Deluxe Single Room",
    dateRange: "24 Jun – 25 Jun",
    nights: 1,
    guestName: "Nusrat Jahan",
    guestCount: 1,
    status: "confirmed",
    timeAgo: "1h ago",
  },
  {
    id: "5",
    source: "Facebook/Meta",
    sourceColor: "#1877F2",
    sourceInitial: "f",
    roomType: "Standard Double Room",
    dateRange: "28 Jun – 30 Jun",
    nights: 2,
    guestName: "Rafiq Ahmed",
    guestCount: 2,
    status: "pending",
    timeAgo: "2h ago",
  },
];

function SourceAvatar({ req }: { req: BookingRequest }) {
  return (
    <Avatar
      className="size-8 shrink-0 rounded-[10px] after:rounded-[10px] after:border-transparent"
    >
      <AvatarFallback
        className="rounded-[10px] bg-transparent text-[11px] font-bold text-white"
        style={{ backgroundColor: req.sourceColor }}
      >
        {req.sourceIcon ?? req.sourceInitial}
      </AvatarFallback>
    </Avatar>
  );
}

function StatusBadge({ status }: { status: BookingRequestStatus }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <Badge
      variant="secondary"
      className={cn("h-5 justify-center px-2 text-[11px] font-medium", STATUS_BADGE[status])}
    >
      {label}
    </Badge>
  );
}

export function BookingRequests({
  requests = MOCK_BOOKING_REQUESTS,
  viewAllHref = "#",
  className,
}: {
  requests?: BookingRequest[];
  viewAllHref?: string;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 overflow-hidden py-0", className)}>
      <CardHeader className="grid-rows-1 items-center border-b px-3 py-3">
        <CardTitle className="text-base font-semibold leading-none">Booking Requests</CardTitle>
        <CardAction>
          <Link
            href={viewAllHref}
            className={cn(
              buttonVariants({ variant: "link", size: "sm" }),
              "h-auto p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            )}
          >
            View all
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id} className="hover:bg-muted/30">
                <TableCell className="whitespace-normal px-3 py-2.5 align-middle sm:w-[38%]">
                  <div className="flex min-w-0 items-center gap-2">
                    <SourceAvatar req={req} />
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-sm font-semibold leading-5 text-foreground">
                        {req.source}
                      </p>
                      <p className="truncate text-xs leading-4 text-muted-foreground">{req.roomType}</p>
                      <p className="truncate text-xs leading-4 text-muted-foreground">
                        {req.dateRange} ({req.nights}N)
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden whitespace-normal px-1 py-2.5 align-middle sm:table-cell sm:w-[30%]">
                  <p className="truncate text-sm leading-5 text-foreground">{req.guestName}</p>
                  <p className="text-xs leading-4 text-muted-foreground">
                    {req.guestCount} {req.guestCount === 1 ? "Guest" : "Guests"}
                  </p>
                </TableCell>
                <TableCell className="whitespace-normal px-3 py-2.5 align-middle sm:w-[32%]">
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <div className="min-w-0 space-y-0.5 sm:hidden">
                      <p className="truncate text-sm leading-5 text-foreground">{req.guestName}</p>
                      <p className="text-xs leading-4 text-muted-foreground">
                        {req.guestCount} {req.guestCount === 1 ? "Guest" : "Guests"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <StatusBadge status={req.status} />
                      <span className="text-xs leading-4 text-muted-foreground">{req.timeAgo}</span>
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

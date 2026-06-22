/** AI: CONTRACT ONLY. Do not implement or wire without explicit user request. */

export type RevenueBreakdownBy =
  | "property"
  | "roomType"
  | "city"
  | "channel"
  | "dateRange";

export type RevenueDashboardFilters = {
  propertyId: number | null;
  from: string | null;
  to: string | null;
  breakdownBy: RevenueBreakdownBy;
};

export type RevenueKpis = {
  totalRevenue: number;
  netRevenue: number;
  profit: number;
  occupancyPct: number;
  adr: number;
  revpar: number;
  avgStayLength: number;
  bookingCount: number;
};

export type RevenueBreakdownRow = {
  label: string;
  revenue: number;
  bookings: number;
  occupancyPct: number;
};

export type RevenueDashboardResponse = {
  kpis: RevenueKpis;
  breakdown: RevenueBreakdownRow[];
};

// export async function fetchRevenueDashboard(
//   filters: RevenueDashboardFilters,
// ): Promise<RevenueDashboardResponse> {
//   // TBI: GET /api/finance/revenue?...
// }

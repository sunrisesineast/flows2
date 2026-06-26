import type { Property } from "@/lib/types";

export const FALLBACK_PLATFORM_COLOR = "#6B7280";

export const PLATFORM_PRESETS: ReadonlyArray<{ slug: string; displayName: string; color: string }> = [
  { slug: "airbnb", displayName: "Airbnb", color: "#FF385C" },
  { slug: "booking", displayName: "Booking.com", color: "#003580" },
  { slug: "vrbo", displayName: "Vrbo", color: "#245ABC" },
  { slug: "expedia", displayName: "Expedia", color: "#FFC72C" },
  { slug: "hostaway", displayName: "Hostaway", color: "#2E5BFF" },
  { slug: "lodgify", displayName: "Lodgify", color: "#00B5AD" },
  { slug: "hospitable", displayName: "Hospitable", color: "#1B5E20" },
  { slug: "smoobu", displayName: "Smoobu", color: "#4A148C" },
  { slug: "houfy", displayName: "Houfy", color: "#D84315" },
  { slug: "plumguide", displayName: "Plum Guide", color: "#2E1065" },
  { slug: "whimstay", displayName: "Whimstay", color: "#FF7043" },
  { slug: "direct", displayName: "Direct", color: FALLBACK_PLATFORM_COLOR },
];

const PRESET_BY_SLUG = new Map(PLATFORM_PRESETS.map((p) => [p.slug, p]));

export function platformDisplayName(slug: string): string {
  return PRESET_BY_SLUG.get(slug)?.displayName ?? slug;
}

export function platformColor(slug: string): string {
  return PRESET_BY_SLUG.get(slug)?.color ?? FALLBACK_PLATFORM_COLOR;
}

export interface CalendarEvent {
  id: number;
  platform: string;
  uid?: string;
  summary: string;
  startDate: string;
  endDate: string;
}

export interface UnifiedStay {
  start: Date;
  end: Date;
  name: string;
  platform: string;
  reservationId?: number;
}

export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isGenericIcalName(summary: string): boolean {
  if (!summary) return true;
  const s = summary.toLowerCase().trim();
  return (
    s === "reserved" ||
    s === "closed" ||
    s.includes("not available") ||
    s.includes("blocked") ||
    s.includes("closed - not available")
  );
}

export function friendlyIcalName(summary: string | null | undefined, platform: string): string {
  if (!summary || isGenericIcalName(summary)) return platformDisplayName(platform);
  return summary;
}

export function buildUnifiedStays(p: Property, events: CalendarEvent[]): UnifiedStay[] {
  const linkedUids = new Set(
    p.reservations.map((r) => r.linkedEventUid).filter((u): u is string => !!u)
  );
  const reservationDateKeys = new Set<string>();
  for (const r of p.reservations) {
    const start = toLocalDateStr(new Date(r.checkIn));
    const end = toLocalDateStr(new Date(r.checkOut));
    reservationDateKeys.add(`${start}|${end}`);
  }
  const stays: UnifiedStay[] = [];
  for (const r of p.reservations) {
    const start = new Date(r.checkIn);
    start.setHours(0, 0, 0, 0);
    const end = new Date(r.checkOut);
    end.setHours(0, 0, 0, 0);
    stays.push({
      start,
      end,
      name: r.name,
      platform: r.platform || "direct",
      reservationId: r.id,
    });
  }
  for (const ev of events) {
    if (ev.uid && linkedUids.has(ev.uid)) continue;
    if (ev.platform === "airbnb" && (ev.summary?.includes("Not available") || ev.summary?.includes("Blocked"))) continue;
    const dateKey = `${ev.startDate}|${ev.endDate}`;
    if (reservationDateKeys.has(dateKey) && isGenericIcalName(ev.summary || "")) continue;
    const start = new Date(ev.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(ev.endDate);
    end.setHours(0, 0, 0, 0);
    stays.push({ start, end, name: friendlyIcalName(ev.summary, ev.platform), platform: ev.platform });
  }

  const collapsed: UnifiedStay[] = [];
  const byRange = new Map<string, UnifiedStay>();
  for (const s of stays) {
    const key = `${toLocalDateStr(s.start)}|${toLocalDateStr(s.end)}`;
    const existing = byRange.get(key);
    if (!existing) {
      byRange.set(key, s);
      collapsed.push(s);
      continue;
    }
    if (isGenericIcalName(existing.name) && !isGenericIcalName(s.name)) {
      existing.name = s.name;
      existing.platform = s.platform;
      if (s.reservationId) existing.reservationId = s.reservationId;
    }
  }

  collapsed.sort((a, b) => a.start.getTime() - b.start.getTime());
  return collapsed;
}

export function detectDoubleBookings(stays: UnifiedStay[], today: Date): Array<{
  aName: string;
  bName: string;
  overlapStart: Date;
  overlapEnd: Date;
}> {
  const out: Array<{ aName: string; bName: string; overlapStart: Date; overlapEnd: Date }> = [];
  for (let i = 0; i < stays.length; i++) {
    for (let j = i + 1; j < stays.length; j++) {
      const a = stays[i];
      const b = stays[j];
      if (a.start < b.end && b.start < a.end) {
        const overlapStart = a.start > b.start ? a.start : b.start;
        const overlapEnd = a.end < b.end ? a.end : b.end;
        if (overlapEnd > today) {
          out.push({ aName: a.name, bName: b.name, overlapStart, overlapEnd });
        }
      }
    }
  }
  return out;
}

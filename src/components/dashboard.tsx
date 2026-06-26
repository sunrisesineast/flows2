"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { DateSlider } from "@/components/date-slider";
import { CleaningSchedule, type CleanerAssignmentInfo } from "@/components/cleaning-schedule";
import { DashboardOnboarding } from "@/components/dashboard-onboarding";
import { BookingRequests } from "@/components/booking-requests";
import { OperationsBoard } from "@/components/operations-board";
import { OccupancyHeatMap } from "@/components/occupancy-heat-map";
import { ChannelPerformance } from "@/components/channel-performance";
import { FinanceOverview } from "@/components/finance-overview";
import { ExpensesVsBudget } from "@/components/expenses-vs-budget";
import { QuickActions } from "@/components/quick-actions";
import { ProTipBar } from "@/components/pro-tip-bar";
import { MetricCard } from "@/components/metric-card";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";
import type { Property, CalendarLink, DateOverride } from "@/lib/types";
import {
  PLATFORM_PRESETS,
  buildUnifiedStays,
  detectDoubleBookings,
  friendlyIcalName,
  platformColor,
  platformDisplayName,
  toLocalDateStr,
  type CalendarEvent,
} from "@/lib/reservation-display";
import { GLASS_PANEL } from "@/lib/utils";

interface CopyShape {
  dateLocale: string;
  reservationsCount: (count: number) => string;
  reservationsAcross: (resCount: number, propCount: number) => string;
  needsAttention: string;
  doubleBooking: string;
  moreCount: (n: number) => string;
  cleanerConflict: string;
  moreCountSuffix: (n: number) => string;
  openCleaning: string;
  noCalendars: string;
  connectCalendars: string;
  reservationLabel: string;
  availableLabel: string;
  nextLabel: string;
  noUpcoming: string;
  bookingsCountShort: string;
  minNightsLabel: (n: number) => string;
  syncShort: string;
  searchPlaceholder: string;
  foundLabel: string;
  currentlyStaying: string;
  daysShort: string;
  guestShort: string;
  untilNightsLeft: (date: string, nights: number) => string;
  inDays: (date: string, days: number) => string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    dateLocale: "en-GB",
    reservationsCount: (count) => `${count} ${count === 1 ? "reservation" : "reservations"}`,
    reservationsAcross: (resCount, propCount) =>
      `${resCount} reservations across ${propCount} ${propCount === 1 ? "property" : "properties"}`,
    needsAttention: "Needs attention",
    doubleBooking: "Double booking:",
    moreCount: (n) => `+ ${n} more`,
    cleanerConflict: "Cleaner conflict:",
    moreCountSuffix: (n) => ` + ${n} more`,
    openCleaning: "Open cleaning →",
    noCalendars: "No calendars connected:",
    connectCalendars: "Connect calendars",
    reservationLabel: "Reservation",
    availableLabel: "Available",
    nextLabel: "Next:",
    noUpcoming: "No upcoming bookings",
    bookingsCountShort: "bookings",
    minNightsLabel: (n) => `min ${n}n`,
    syncShort: "Sync",
    searchPlaceholder: "Search by guest name...",
    foundLabel: "found",
    currentlyStaying: "Currently staying",
    daysShort: "d",
    guestShort: "g",
    untilNightsLeft: (date, nights) =>
      `until ${date} · ${nights} ${nights === 1 ? "night" : "nights"} left`,
    inDays: (date, days) => `${date} (in ${days}d)`,
  },
  ru: {
    dateLocale: "ru-RU",
    reservationsCount: (count) =>
      `${count} ${count === 1 ? "бронирование" : count < 5 ? "бронирования" : "бронирований"}`,
    reservationsAcross: (resCount, propCount) =>
      `${resCount} бронирований в ${propCount} ${propCount === 1 ? "объекте" : "объектах"}`,
    needsAttention: "Требует внимания",
    doubleBooking: "Двойное бронирование:",
    moreCount: (n) => `+ ещё ${n}`,
    cleanerConflict: "Конфликт уборщиков:",
    moreCountSuffix: (n) => ` + ещё ${n}`,
    openCleaning: "Открыть уборки →",
    noCalendars: "Календари не подключены:",
    connectCalendars: "Подключить",
    reservationLabel: "Бронь",
    availableLabel: "Свободно",
    nextLabel: "Далее:",
    noUpcoming: "Нет предстоящих броней",
    bookingsCountShort: "бронир.",
    minNightsLabel: (n) => `мин. ${n}н.`,
    syncShort: "Синхр.",
    searchPlaceholder: "Поиск по имени гостя...",
    foundLabel: "найдено",
    currentlyStaying: "Сейчас в гостях",
    daysShort: "д",
    guestShort: "г",
    untilNightsLeft: (date, nights) =>
      `до ${date} · ${nights} ${nights === 1 ? "ночь" : nights < 5 ? "ночи" : "ноч."}`,
    inDays: (date, days) => `${date} (через ${days} д.)`,
  },
  de: {
    dateLocale: "de-DE",
    reservationsCount: (count) => `${count} ${count === 1 ? "Buchung" : "Buchungen"}`,
    reservationsAcross: (resCount, propCount) =>
      `${resCount} Buchungen in ${propCount} ${propCount === 1 ? "Unterkunft" : "Unterkünften"}`,
    needsAttention: "Erfordert Aufmerksamkeit",
    doubleBooking: "Doppelbuchung:",
    moreCount: (n) => `+ ${n} weitere`,
    cleanerConflict: "Reinigungskonflikt:",
    moreCountSuffix: (n) => ` + ${n} weitere`,
    openCleaning: "Reinigung öffnen →",
    noCalendars: "Keine Kalender verbunden:",
    connectCalendars: "Kalender verbinden",
    reservationLabel: "Buchung",
    availableLabel: "Frei",
    nextLabel: "Nächste:",
    noUpcoming: "Keine bevorstehenden Buchungen",
    bookingsCountShort: "Buchungen",
    minNightsLabel: (n) => `min. ${n} N.`,
    syncShort: "Sync",
    searchPlaceholder: "Nach Gastnamen suchen...",
    foundLabel: "gefunden",
    currentlyStaying: "Aktuell im Haus",
    daysShort: "T",
    guestShort: "G",
    untilNightsLeft: (date, nights) =>
      `bis ${date} · noch ${nights} ${nights === 1 ? "Nacht" : "Nächte"}`,
    inDays: (date, days) => `${date} (in ${days} T.)`,
  },
  fr: {
    dateLocale: "fr-FR",
    reservationsCount: (count) => `${count} ${count === 1 ? "réservation" : "réservations"}`,
    reservationsAcross: (resCount, propCount) =>
      `${resCount} réservations sur ${propCount} ${propCount === 1 ? "logement" : "logements"}`,
    needsAttention: "À traiter",
    doubleBooking: "Double réservation :",
    moreCount: (n) => `+ ${n} autres`,
    cleanerConflict: "Conflit d’agent de ménage :",
    moreCountSuffix: (n) => ` + ${n} autres`,
    openCleaning: "Ouvrir le ménage →",
    noCalendars: "Aucun calendrier connecté :",
    connectCalendars: "Connecter des calendriers",
    reservationLabel: "Réservation",
    availableLabel: "Disponible",
    nextLabel: "Suivante :",
    noUpcoming: "Aucune réservation à venir",
    bookingsCountShort: "rés.",
    minNightsLabel: (n) => `min ${n} n`,
    syncShort: "Sync",
    searchPlaceholder: "Rechercher par nom de voyageur…",
    foundLabel: "trouvés",
    currentlyStaying: "Sur place",
    daysShort: "j",
    guestShort: "v",
    untilNightsLeft: (date, nights) =>
      `jusqu’au ${date} · ${nights} ${nights === 1 ? "nuit" : "nuits"} restantes`,
    inDays: (date, days) => `${date} (dans ${days} j)`,
  },
  es: {
    dateLocale: "es-ES",
    reservationsCount: (count) => `${count} ${count === 1 ? "reserva" : "reservas"}`,
    reservationsAcross: (resCount, propCount) =>
      `${resCount} reservas en ${propCount} ${propCount === 1 ? "alojamiento" : "alojamientos"}`,
    needsAttention: "Requiere atención",
    doubleBooking: "Doble reserva:",
    moreCount: (n) => `+ ${n} más`,
    cleanerConflict: "Conflicto de limpieza:",
    moreCountSuffix: (n) => ` + ${n} más`,
    openCleaning: "Abrir limpieza →",
    noCalendars: "Sin calendarios conectados:",
    connectCalendars: "Conectar calendarios",
    reservationLabel: "Reserva",
    availableLabel: "Disponible",
    nextLabel: "Siguiente:",
    noUpcoming: "No hay reservas próximas",
    bookingsCountShort: "reservas",
    minNightsLabel: (n) => `mín. ${n}n`,
    syncShort: "Sync",
    searchPlaceholder: "Buscar por nombre del huésped…",
    foundLabel: "encontradas",
    currentlyStaying: "Alojados ahora",
    daysShort: "d",
    guestShort: "h",
    untilNightsLeft: (date, nights) =>
      `hasta ${date} · ${nights} ${nights === 1 ? "noche" : "noches"} restantes`,
    inDays: (date, days) => `${date} (en ${days} d)`,
  },
};

interface DashboardProps {
  properties: Property[];
  /**
   * True while the parent is fetching the properties list. Used to
   * suppress the zero-property onboarding wizard during the loading
   * window — without it, a returning user (who DOES have properties)
   * sees an empty list for ~100–500ms after page mount and gets the
   * "Name your first property" wizard, which creates a duplicate
   * property if they start typing before the fetch resolves.
   */
  loadingProperties?: boolean;
  selectedProperty: Property | null;
  onSelectProperty: (id: number) => void;
  onSelectReservation: (id: number) => void;
  onAddReservation: (data: {
    name: string;
    checkIn: string;
    checkOut: string;
    platform: string;
    propertyId: number;
  }) => void;
  onAddProperty?: (name: string) => Promise<void> | void;
  /** Rename a property in place. Lets the host rename from the
   *  dashboard header without opening Sync settings. Optional so
   *  callers that never show a selected property can skip it. */
  onUpdateProperty?: (id: number, data: { name?: string }) => Promise<void> | void;
  /** Re-fetch properties on the parent. The new in-dashboard
   *  onboarding wizard calls /api/properties and /api/calendar/links
   *  directly, so the parent has no idea anything changed until this
   *  fires. Optional so existing callers don't need to pass it. */
  onRefresh?: () => Promise<void> | void;
}

export function Dashboard({
  properties,
  loadingProperties = false,
  selectedProperty,
  onSelectProperty,
  onSelectReservation,
  onAddReservation,
  onAddProperty,
  onUpdateProperty,
  onRefresh,
}: DashboardProps) {
  const { t, locale } = useI18n();
  const c = COPY[locale];
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPropertyId, setFormPropertyId] = useState<number | "">(
    selectedProperty?.id || (properties.length > 0 ? properties[0].id : "")
  );
  const [formPlatform, setFormPlatform] = useState("airbnb");
  const [formCheckIn, setFormCheckIn] = useState("");
  const [formCheckOut, setFormCheckOut] = useState("");
  const [allSyncedEvents, setAllSyncedEvents] = useState<Record<number, CalendarEvent[]>>({});
  const [allLinks, setAllLinks] = useState<Record<number, CalendarLink[]>>({});
  const [allOverrides, setAllOverrides] = useState<Record<number, DateOverride[]>>({});
  const [loadingCalendarData, setLoadingCalendarData] = useState(false);
  // Inline property rename from the dashboard header (pencil next to
  // the title). Mirrors the rename in Sync settings — same PATCH.
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);
  // RT-25.6 tick 2 — distinct platform slugs across the user's CalendarLinks.
  // Populated regardless of selectedProperty so the form pills always reflect
  // the user's real platform set (Airbnb + Booking + any custom platforms).
  const [linkedPlatformSlugs, setLinkedPlatformSlugs] = useState<string[]>([]);
  // RT-25.10 tick 3 — per-property cleaner-assignment data, threaded
  // into <CleaningSchedule> for cleaner-conflict detection. Populated
  // from /api/cleaners?withAssignments=1 in dashboard mode only.
  const [cleanerAssignments, setCleanerAssignments] = useState<Record<number, CleanerAssignmentInfo[]>>({});
  const [assignmentsFetched, setAssignmentsFetched] = useState(false);
  const [cleanerConflictDates, setCleanerConflictDates] = useState<string[]>([]);

  // Fetch synced events, links, and overrides for all properties (for cleaning schedule)
  const fetchAllCalendarData = useCallback(async () => {
    if (selectedProperty || properties.length === 0) return;
    setLoadingCalendarData(true);
    try {
      const results = await Promise.all(
        properties.map(async (p) => {
          const [syncRes, linksRes, ovRes] = await Promise.all([
            fetch(`/api/calendar/sync?propertyId=${p.id}&limit=200`).then(r => r.json()),
            fetch(`/api/calendar/links?propertyId=${p.id}`).then(r => r.json()),
            fetch(`/api/date-overrides?propertyId=${p.id}`).then(r => r.json()),
          ]);
          return { id: p.id, events: syncRes.events || [], links: linksRes || [], overrides: ovRes || [] };
        })
      ).catch(() => []);
      const evMap: Record<number, CalendarEvent[]> = {};
      const lnMap: Record<number, CalendarLink[]> = {};
      const ovMap: Record<number, DateOverride[]> = {};
      for (const r of results) {
        evMap[r.id] = r.events;
        lnMap[r.id] = r.links;
        ovMap[r.id] = r.overrides;
      }
      setAllSyncedEvents(evMap);
      setAllLinks(lnMap);
      setAllOverrides(ovMap);
    } finally {
      setLoadingCalendarData(false);
    }
  }, [properties, selectedProperty]);

  useEffect(() => {
    fetchAllCalendarData();
  }, [fetchAllCalendarData]);

  // RT-25.6 tick 2 — fetch the user's full link inventory once on mount
  // (single call, no per-property fan-out) so the platform pills are
  // accurate even in per-property mode where fetchAllCalendarData
  // early-exits.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/calendar/links`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: CalendarLink[]) => {
        if (cancelled || !Array.isArray(rows)) return;
        const slugs = Array.from(new Set(rows.map((r) => r.platform).filter(Boolean)));
        setLinkedPlatformSlugs(slugs);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // RT-25.10 tick 3 — fetch the host's cleaner pool with assignments so
  // CleaningSchedule can detect cleaner conflicts across properties.
  // Only meaningful in dashboard mode (multi-property); per-property
  // mode has its own fetch in PropertyCleaningView. Skip until at least
  // one property exists.
  useEffect(() => {
    if (selectedProperty || properties.length === 0) {
      setCleanerAssignments({});
      return;
    }
    let cancelled = false;
    fetch(`/api/cleaners?withAssignments=1`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Array<{ id: number; name: string; assignments?: Array<{ propertyId: number; priority: number }> }>) => {
        if (cancelled || !Array.isArray(rows)) return;
        const map: Record<number, CleanerAssignmentInfo[]> = {};
        for (const c of rows) {
          for (const a of c.assignments ?? []) {
            const list = map[a.propertyId] ?? (map[a.propertyId] = []);
            list.push({ identityKey: `p:${c.id}`, name: c.name, priority: a.priority });
          }
        }
        for (const list of Object.values(map)) list.sort((a, b) => a.priority - b.priority);
        setCleanerAssignments(map);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAssignmentsFetched(true);
      });
    return () => { cancelled = true; };
  }, [selectedProperty, properties.length]);

  // Platform pills shown in the Add-Reservation form. Order:
  //   1. Slugs the user has linked (in PLATFORM_PRESETS sort order, then alpha)
  //   2. "direct" — always offered as the manual-add channel
  // If the user has no links yet, fall back to airbnb + booking + direct
  // so a brand-new account doesn't see an empty toggle.
  const formPlatformOptions = useMemo<string[]>(() => {
    const linked = linkedPlatformSlugs.length > 0 ? linkedPlatformSlugs : ["airbnb", "booking"];
    const ordered: string[] = [];
    for (const preset of PLATFORM_PRESETS) {
      if (preset.slug === "direct") continue;
      if (linked.includes(preset.slug)) ordered.push(preset.slug);
    }
    // Custom slugs that aren't in the bundled presets: tail in alpha order.
    const known = new Set(PLATFORM_PRESETS.map((p) => p.slug));
    for (const slug of [...linked].sort()) {
      if (!known.has(slug)) ordered.push(slug);
    }
    ordered.push("direct");
    return ordered;
  }, [linkedPlatformSlugs]);

  // Keep formPlatform in the available set; if it drops out (rare —
  // user removed the only link of that type), reset to the first option.
  useEffect(() => {
    if (formPlatformOptions.length === 0) return;
    if (!formPlatformOptions.includes(formPlatform)) {
      setFormPlatform(formPlatformOptions[0]);
    }
  }, [formPlatformOptions, formPlatform]);

  useEffect(() => {
    if (selectedProperty) {
      setFormPropertyId(selectedProperty.id);
    }
  }, [selectedProperty]);

  // The old WelcomeModal is replaced by DashboardOnboarding (an
  // in-place empty-state takeover). Modal state hooks intentionally
  // removed.

  // Per-property mode: keep the original "newest booking first" sort
  // (the per-property reservation list is more about audit-trail than
  // daily-ops planning). Global mode: sort upcoming-first so a returning
  // host sees what's happening today + this week at the top of the page.
  // RT-25.6 tick 3.
  const allReservations = selectedProperty
    ? selectedProperty.reservations
        .map((r) => ({ ...r, propertyName: selectedProperty.name, propertyId: selectedProperty.id }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : properties
        .flatMap((p) =>
          p.reservations.map((r) => ({
            ...r,
            propertyName: p.name,
            propertyId: p.id,
          }))
        );

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  // RT-25.6 tick 5 — today's check-ins / check-outs across all
  // properties. Drives the "Today" strip at the top of the global
  // dashboard so a returning host can scan today's events without
  // hunting through the upcoming-week list. Hidden when both buckets
  // are empty so the strip doesn't add noise on quiet days.
  const { todayCheckIns, todayCheckOuts } = useMemo(() => {
    if (selectedProperty) {
      return { todayCheckIns: [], todayCheckOuts: [] as typeof allReservations };
    }
    const ins: typeof allReservations = [];
    const outs: typeof allReservations = [];
    for (const r of allReservations) {
      if (r.checkIn === todayStr) ins.push(r);
      if (r.checkOut === todayStr) outs.push(r);
    }
    return { todayCheckIns: ins, todayCheckOuts: outs };
  }, [allReservations, selectedProperty, todayStr]);

  const hasCleanerConflictToday = useMemo(
    () => cleanerConflictDates.includes(todayStr),
    [cleanerConflictDates, todayStr]
  );

  // Double-booking + no-cleaner alerts. Surfaced in the Alerts strip
  // above the property cards so the host sees structural problems
  // before scanning individual properties. Only computed in dashboard
  // mode (where the strip renders).
  const dashboardAlerts = useMemo(() => {
    if (selectedProperty) {
      return {
        doubleBookings: [] as Array<{ propertyName: string; aName: string; bName: string; overlapStart: Date; overlapEnd: Date }>,
        propertiesWithoutCalendar: [] as Array<{ id: number; name: string }>,
      };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const doubleBookings: Array<{ propertyName: string; aName: string; bName: string; overlapStart: Date; overlapEnd: Date }> = [];
    // Properties that haven't connected any iCal feed AND don't have any
    // manual reservations either — these need the host's attention because
    // the dashboard is empty for them. We flag both conditions together
    // because a property with manual reservations doesn't need a sync to
    // be useful (some hosts don't list on Airbnb / Booking at all).
    const propertiesWithoutCalendar: Array<{ id: number; name: string }> = [];
    for (const p of properties) {
      const stays = buildUnifiedStays(p, allSyncedEvents[p.id] || []);
      const overlaps = detectDoubleBookings(stays, today);
      for (const o of overlaps) {
        doubleBookings.push({ propertyName: p.name, ...o });
      }
      const links = allLinks[p.id];
      const hasLinks = Array.isArray(links) && links.length > 0;
      const hasReservations = p.reservations.length > 0;
      if (!hasLinks && !hasReservations) {
        propertiesWithoutCalendar.push({ id: p.id, name: p.name });
      }
    }
    return { doubleBookings, propertiesWithoutCalendar };
  }, [properties, allSyncedEvents, allLinks, selectedProperty]);

  const displayReservations = selectedProperty ? allReservations : [];

  // RT-25.6 tick 7 — in-form conflict warning. Surfaces overlapping
  // range BEFORE the host hits "Create Reservation". Addresses a slice
  // of the tick 2 deferred "show what's already booked" item without
  // touching DateSlider's internals (a separate larger lift).
  // Touching dates (checkout === next checkin) are NOT counted as
  // overlap to match the same-day-turnover convention used elsewhere.
  // Synced events come from allSyncedEvents (populated in dashboard
  // mode); in selectedProperty mode the warning relies on the
  // property's Reservation rows alone, which is acceptable since most
  // synced bookings ARE represented as reservations or via the
  // calendar's own conflict UI in that view.
  const formConflicts = useMemo(() => {
    if (!formPropertyId || !formCheckIn || !formCheckOut) return [];
    if (formCheckIn >= formCheckOut) return [];
    const pid = Number(formPropertyId);
    const property = properties.find((p) => p.id === pid);
    type Conflict = { key: string; name: string; platform: string; from: string; to: string };
    const out: Conflict[] = [];
    if (property) {
      for (const res of property.reservations) {
        if (res.checkIn < formCheckOut && res.checkOut > formCheckIn) {
          out.push({
            key: `r-${res.id}`,
            name: res.name,
            platform: res.platform,
            from: res.checkIn,
            to: res.checkOut,
          });
        }
      }
    }
    const events = allSyncedEvents[pid] || [];
    for (const ev of events) {
      if (ev.startDate < formCheckOut && ev.endDate > formCheckIn) {
        out.push({
          key: `e-${ev.id}`,
          name: friendlyIcalName(ev.summary, ev.platform),
          platform: ev.platform,
          from: ev.startDate,
          to: ev.endDate,
        });
      }
    }
    return out;
  }, [formPropertyId, formCheckIn, formCheckOut, properties, allSyncedEvents]);

  // RT-25.6 tick 8 — booked-dates set for the in-form date picker.
  // Same data sources as the conflict warning (tick 7) — Reservation
  // rows + allSyncedEvents — but rolled out into a Set<dateString> so
  // CalendarGrid can mark each occupied day with a small amber dot.
  // Convention: a booking [checkIn, checkOut) occupies the nights from
  // checkIn (inclusive) through the day BEFORE checkOut (exclusive),
  // matching the "touching dates aren't a conflict" rule the rest of
  // the app uses (same-day turnovers are allowed). Recomputes only
  // when the picked property's data actually changes; the form being
  // hidden costs nothing at runtime.
  const bookedDates = useMemo(() => {
    const set = new Set<string>();
    if (!formPropertyId) return set;
    const pid = Number(formPropertyId);
    const property = properties.find((p) => p.id === pid);
    const addRange = (from: string, to: string) => {
      if (!from || !to || from >= to) return;
      const start = new Date(from + "T00:00:00");
      const end = new Date(to + "T00:00:00");
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        set.add(`${y}-${m}-${day}`);
      }
    };
    if (property) {
      for (const res of property.reservations) {
        addRange(res.checkIn, res.checkOut);
      }
    }
    const events = allSyncedEvents[pid] || [];
    for (const ev of events) {
      addRange(ev.startDate, ev.endDate);
    }
    return set;
  }, [formPropertyId, properties, allSyncedEvents]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCheckIn || !formCheckOut || !formPropertyId) return;
    onAddReservation({
      name: formName.trim(),
      checkIn: formCheckIn,
      checkOut: formCheckOut,
      platform: formPlatform,
      propertyId: Number(formPropertyId),
    });
    setFormName("");
    setFormCheckIn("");
    setFormCheckOut("");
    setShowForm(false);
  };

  const handleRowClick = (propertyId: number, reservationId: number) => {
    onSelectProperty(propertyId);
    setTimeout(() => onSelectReservation(reservationId), 50);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(c.dateLocale, { day: "2-digit", month: "short" });

  const dayCount = (checkIn: string, checkOut: string) => {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const title = selectedProperty ? selectedProperty.name : t("dashboard.title");
  const resCount = selectedProperty
    ? displayReservations.length
    : allReservations.filter((r) => r.checkOut > todayStr).length;
  const subtitle = selectedProperty
    ? c.reservationsCount(resCount)
    : c.reservationsAcross(resCount, properties.length);

  // Zero-property first-screen — the dashboard's main column becomes
  // the onboarding wizard until the user has named one property AND
  // saved at least one calendar feed (or used the sample-property
  // escape, or chose to add reservations manually).
  //
  // The `!loadingProperties` gate matters: without it, a returning
  // user who already has properties sees the wizard for the ~100-500ms
  // it takes the parent to fetch /api/properties (initial state is
  // []). If they start typing before the fetch resolves, the wizard
  // creates a duplicate "My first property" alongside their real
  // properties.
  const isZeroProperties =
    !loadingProperties && !selectedProperty && properties.length === 0;

  const handleSaveName = async () => {
    if (!selectedProperty || !onUpdateProperty) return;
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === selectedProperty.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      await onUpdateProperty(selectedProperty.id, { name: trimmed });
      setEditingName(false);
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="-mx-3 sm:-mx-6 lg:-mx-8">
    <div className="mx-auto max-w-[1760px] space-y-6 px-3 sm:px-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          {selectedProperty && editingName ? (
            <div className="flex items-center gap-1.5">
              <input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") setEditingName(false);
                }}
                autoFocus
                disabled={savingName}
                className="min-w-0 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 py-0.5 text-2xl font-bold text-[var(--ink)] outline-none focus:border-[var(--ink)] disabled:opacity-60"
              />
              <button
                onClick={handleSaveName}
                disabled={savingName}
                aria-label={t("common.save")}
                title={t("common.save")}
                className="rounded-md p-1.5 text-emerald-500 hover:bg-emerald-500/10 disabled:opacity-50"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </button>
              <button
                onClick={() => setEditingName(false)}
                disabled={savingName}
                aria-label={t("common.cancel")}
                title={t("common.cancel")}
                className="rounded-md p-1.5 text-[var(--ink-4)] hover:bg-[var(--line-2)] hover:text-[var(--ink)] disabled:opacity-50"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--ink)]">
              {title}
              {loadingCalendarData && (
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-[var(--line-2)] border-t-[#58a6ff]" />
              )}
              {selectedProperty && onUpdateProperty && (
                <button
                  onClick={() => {
                    setNameValue(selectedProperty.name);
                    setEditingName(true);
                  }}
                  aria-label={t("common.edit")}
                  title={t("common.edit")}
                  className="rounded-md p-1 text-[var(--ink-4)] transition-colors hover:bg-[var(--line-2)] hover:text-[var(--ink)]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM19.5 7.125L16.875 4.5" />
                  </svg>
                </button>
              )}
            </h1>
          )}
          {!isZeroProperties && (
            <p className="mt-1 text-sm text-[var(--ink-4)]">{subtitle}</p>
          )}
        </div>
        {/* Per-property "+ Reservation" CTAs live inside each
            property card now, so the global header CTA is gone. In
            per-property mode the user is already on the property and
            can use the Calendar tab. */}
        {selectedProperty && (
          <Link
            href={`/dashboard?property=${selectedProperty.id}&view=calendar`}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--m-accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--m-accent-2)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t("dashboard.newReservation")}
          </Link>
        )}
      </div>

      {/* ponytail: mock data — wire to real metrics when backend exists */}
      {!isZeroProperties && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            compact
            title="Occupancy Today"
            value="68%"
            statusLabel="15 / 22 Rooms"
            statusValue="↑ 12%"
            accentColor="#10b981"
            statusColor="#10b981"
            chartData={[42, 48, 45, 52, 58, 55, 62, 68]}
          />
          <MetricCard
            compact
            title="Today's Revenue"
            value="₺ 18,750"
            statusLabel="vs yesterday"
            statusValue="↑ 8%"
            accentColor="#8b5cf6"
            statusColor="#10b981"
            chartData={[12, 14, 13, 15, 16, 17, 18, 19]}
          />
          <MetricCard
            compact
            title="Check-ins"
            value="4"
            statusLabel="Today"
            statusValue="2 Pending"
            accentColor="#3b82f6"
            chartData={[1, 2, 1, 3, 2, 4, 3, 4]}
          />
          <MetricCard
            compact
            title="Check-outs"
            value="3"
            statusLabel="Today"
            statusValue="1 Pending"
            accentColor="#f97316"
            chartData={[2, 1, 3, 2, 4, 3, 2, 3]}
          />
          <MetricCard
            compact
            title="Open Tasks"
            value="18"
            statusLabel="Total"
            statusValue="5 Overdue"
            accentColor="#ef4444"
            chartData={[10, 12, 11, 14, 15, 16, 17, 18]}
          />
          <MetricCard
            compact
            title="Guest Rating"
            value="4.6"
            valueSuffix="★"
            statusLabel="This month"
            statusValue="↑ 0.3"
            accentColor="#10b981"
            statusColor="#10b981"
            chartData={[4.2, 4.3, 4.4, 4.3, 4.5, 4.4, 4.5, 4.6]}
          />
        </div>
      )}

      {!isZeroProperties && (
        <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.82fr)]">
          <BookingRequests className="min-w-0" />
          <OperationsBoard className="min-w-0" />
          <OccupancyHeatMap className="min-w-0 self-start" />
        </div>
      )}

      {!isZeroProperties && (
        <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.82fr)]">
          <ChannelPerformance className="min-w-0" />
          <FinanceOverview className="min-w-0" />
          <ExpensesVsBudget className="min-w-0" />
        </div>
      )}

      {!isZeroProperties && (
        <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.82fr)]">
          <QuickActions className="min-w-0" />
        </div>
      )}

      {/* Zero-property onboarding — empty-state hijack. Replaces the
          earlier "Welcome modal + add-property hero" with an inline
          two-step wizard (property name → connect calendar) so the
          path forward is one focused surface. Auto-exits on first
          calendar save / sample-property creation / manual-reservation
          escape — onComplete refetches the parent's property list. */}
      {isZeroProperties && (
        <DashboardOnboarding
          onComplete={async () => {
            if (onRefresh) await onRefresh();
            else if (typeof window !== "undefined") window.location.reload();
          }}
        />
      )}

      {/* Today strip — check-ins + check-outs scheduled for today across
          all properties. Skipped on quiet days so the dashboard stays
          calm when nothing is happening. RT-25.6 tick 5. */}
      {!selectedProperty && properties.length > 0 && (todayCheckIns.length > 0 || todayCheckOuts.length > 0) && (
        <div className={`rounded-lg p-4 ${GLASS_PANEL}`}>
          <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-3)]">
              {t("dashboard.today")}
            </h2>
            <span className="text-xs text-[var(--ink-4)]">
              {new Date().toLocaleDateString(c.dateLocale, { weekday: "short", day: "2-digit", month: "short" })}
            </span>
            {hasCleanerConflictToday && (
              <a
                href="#cleaning-schedule"
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-amber-300 transition-colors hover:bg-amber-500/15"
                style={{ backgroundColor: "rgba(217,119,6,0.18)" }}
                title={t("dashboard.cleanerConflictHint")}
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                {t("dashboard.cleanerConflictBadge")}
              </a>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {todayCheckIns.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
                  {t("dashboard.todayCheckIn")} · {todayCheckIns.length}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {todayCheckIns.map((res) => (
                    <button
                      key={`in-${res.id}`}
                      type="button"
                      onClick={() => handleRowClick(res.propertyId, res.id)}
                      className="flex items-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--bg)] px-2.5 py-1.5 text-xs text-[var(--ink-2)] transition-colors hover:border-[var(--line-2)] hover:bg-[var(--bg-3)]"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: platformColor(res.platform) }}
                      />
                      <span className="font-medium text-[var(--ink)]">{res.name}</span>
                      <span className="text-[var(--ink-4)]">·</span>
                      <span>{res.propertyName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {todayCheckOuts.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
                  {t("dashboard.todayCheckOut")} · {todayCheckOuts.length}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {todayCheckOuts.map((res) => (
                    <button
                      key={`out-${res.id}`}
                      type="button"
                      onClick={() => handleRowClick(res.propertyId, res.id)}
                      className="flex items-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--bg)] px-2.5 py-1.5 text-xs text-[var(--ink-2)] transition-colors hover:border-[var(--line-2)] hover:bg-[var(--bg-3)]"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: platformColor(res.platform) }}
                      />
                      <span className="font-medium text-[var(--ink)]">{res.name}</span>
                      <span className="text-[var(--ink-4)]">·</span>
                      <span>{res.propertyName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alerts strip — only renders after BOTH events fetch and
          cleaner-assignments fetch complete so a partial-data state
          can't flash false positives (the dedup heuristic needs
          full event data to merge same-dates iCal twins; the
          no-cleaner-assigned check needs the assignments map).
          Running on partial data produced ghost "double bookings"
          and ghost no-cleaner alerts that disappeared once the
          fetches caught up — visible CLS. */}
      {!selectedProperty && !loadingCalendarData && assignmentsFetched && (dashboardAlerts.doubleBookings.length > 0 || cleanerConflictDates.length > 0 || dashboardAlerts.propertiesWithoutCalendar.length > 0) && (
        // Light-theme palette (amber-50 / amber-300 / amber-700) sits next
        // to the dark-theme palette (amber-500/5 + amber-300) via `dark:`
        // overrides. The previous all-dark amber-300 tokens were nearly
        // invisible against amber-500/5 in light mode.
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2.5 dark:border-amber-500/30 dark:bg-amber-500/5">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {c.needsAttention}
            </span>
          </div>
          {dashboardAlerts.doubleBookings.length > 0 && (
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-[var(--ink-2)]">
              <span className="font-medium text-rose-700 dark:text-rose-400">
                {c.doubleBooking}
              </span>
              {dashboardAlerts.doubleBookings.slice(0, 3).map((d, i) => (
                <span key={i} className="text-[var(--ink-2)]">
                  {d.propertyName} — {d.aName} & {d.bName} ({formatDate(toLocalDateStr(d.overlapStart))} → {formatDate(toLocalDateStr(d.overlapEnd))})
                  {i < Math.min(dashboardAlerts.doubleBookings.length, 3) - 1 ? "," : ""}
                </span>
              ))}
              {dashboardAlerts.doubleBookings.length > 3 && (
                <span className="text-[var(--ink-3)]">
                  {c.moreCount(dashboardAlerts.doubleBookings.length - 3)}
                </span>
              )}
            </div>
          )}
          {cleanerConflictDates.length > 0 && (
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-[var(--ink-2)]">
              <span className="font-medium text-amber-800 dark:text-amber-300">
                {c.cleanerConflict}
              </span>
              <span>
                {cleanerConflictDates.slice(0, 3).map((d) => formatDate(d)).join(", ")}
                {cleanerConflictDates.length > 3 && c.moreCountSuffix(cleanerConflictDates.length - 3)}
              </span>
              <a
                href="?view=cleaning"
                className="text-[11px] text-amber-700 underline hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
              >
                {c.openCleaning}
              </a>
            </div>
          )}
          {dashboardAlerts.propertiesWithoutCalendar.length > 0 && (
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-[var(--ink-2)]">
              <span className="font-medium text-amber-800 dark:text-amber-300">
                {c.noCalendars}
              </span>
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {dashboardAlerts.propertiesWithoutCalendar.map((p, i) => (
                  <span key={p.id} className="inline-flex items-center gap-1.5">
                    <Link
                      href={`/dashboard?property=${p.id}&view=property-settings`}
                      className="font-medium text-amber-800 underline-offset-2 hover:text-amber-900 hover:underline dark:text-amber-300 dark:hover:text-amber-200"
                    >
                      {p.name}
                    </Link>
                    {i < dashboardAlerts.propertiesWithoutCalendar.length - 1 && (
                      <span className="text-[var(--ink-4)]">·</span>
                    )}
                  </span>
                ))}
                <Link
                  href={`/dashboard?property=${dashboardAlerts.propertiesWithoutCalendar[0].id}&view=property-settings`}
                  className="ml-1 inline-flex items-center gap-1 rounded-md bg-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-900 transition-colors hover:bg-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:hover:bg-amber-500/25"
                >
                  {c.connectCalendars}
                  <span aria-hidden>→</span>
                </Link>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Per-property reservation list (guests view fallback) */}
      {selectedProperty && displayReservations.length > 0 ? (
        <div className={`rounded-lg ${GLASS_PANEL}`}>
          <div className="border-b border-[var(--line)] px-4 py-3">
            <h2 className="text-xs font-medium text-[var(--ink-3)]">
              {t("dashboard.reservations")}
            </h2>
          </div>
          <div>
            {displayReservations.map((res, i) => (
              <ReservationRow
                key={res.id}
                res={res}
                isLast={i === displayReservations.length - 1}
                hideProperty
                formatDate={formatDate}
                dayCount={dayCount}
                locale={locale}
                onClick={() => handleRowClick(res.propertyId, res.id)}
                muted={false}
              />
            ))}
          </div>
        </div>
      ) : selectedProperty ? (
        <div className="rounded-lg border border-dashed border-[var(--line)] py-16 text-center">
          <p className="text-sm text-[var(--ink-4)]">{t("dashboard.noReservations")}</p>
        </div>
      ) : null}

      {/* Cleaning has its own dedicated tab — no inline schedule on
          the dashboard. We still mount a HIDDEN CleaningSchedule
          purely so the cleaner-conflict detection logic runs and
          feeds the Today / Next-7-days conflict badges + the alerts
          strip via onCleanerConflictDatesChange. The visible
          schedule lives at activeView === "cleaning" inside
          GlobalCleaningView. */}
      {!selectedProperty && properties.length > 0 && Object.keys(allSyncedEvents).length > 0 && (
        <div className="hidden" aria-hidden="true">
          <CleaningSchedule
            properties={properties}
            syncedEvents={allSyncedEvents}
            links={allLinks}
            overrides={allOverrides}
            mode="dashboard"
            onOverrideChanged={fetchAllCalendarData}
            cleanerAssignments={cleanerAssignments}
            onCleanerConflictDatesChange={setCleanerConflictDates}
          />
        </div>
      )}

      {!isZeroProperties && <ProTipBar />}
    </div>
    </div>
  );
}

interface ReservationRowProps {
  res: {
    id: number;
    name: string;
    platform: string;
    checkIn: string;
    checkOut: string;
    propertyName: string;
    propertyId: number;
    _count?: { guests: number };
  };
  isLast: boolean;
  hideProperty: boolean;
  formatDate: (d: string) => string;
  dayCount: (a: string, b: string) => number;
  locale: string;
  onClick: () => void;
  muted: boolean;
}

function ReservationRow({ res, isLast, hideProperty, formatDate, dayCount, locale, onClick, muted }: ReservationRowProps) {
  const c = COPY[locale as Locale];
  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-3 px-3 py-3 transition-colors hover:bg-[var(--bg-3)] sm:gap-4 sm:px-4 ${
        !isLast ? "border-b border-[var(--line)]/50" : ""
      } ${muted ? "opacity-60" : ""}`}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: platformColor(res.platform) }}
      />

      {/* Two-line stack on mobile (name above, dates below) so the
          row collapses to ~140px content width — the flat horizontal
          layout used to push name/dates/platform/day-count/guest-count
          all on one line, and at 375px the guest name was truncating
          to 2-3 letters behind the platform pill. The sm+ row keeps
          the original side-by-side layout. */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-[var(--ink)]">{res.name}</span>
          {!hideProperty && (
            <span className="hidden truncate text-sm text-[var(--ink-3)] sm:block">
              {res.propertyName}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--ink-4)] sm:hidden">
          <span className="truncate">
            {formatDate(res.checkIn)} — {formatDate(res.checkOut)}
          </span>
          <span aria-hidden>·</span>
          <span>{dayCount(res.checkIn, res.checkOut)}{c.daysShort}</span>
        </div>
      </div>

      {/* Brand pill — solid platform color + white text, matches the
          date-actions popover and Reports's Top-source pill so the
          chromatic language stays uniform across surfaces. Hidden on
          mobile because the color dot at the row start already
          identifies the source. */}
      <span
        className="hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white sm:inline"
        style={{ backgroundColor: platformColor(res.platform) }}
      >
        {platformDisplayName(res.platform)}
      </span>

      <span className="hidden shrink-0 text-sm text-[var(--ink-3)] sm:inline">
        {formatDate(res.checkIn)} — {formatDate(res.checkOut)}
      </span>

      <span className="hidden shrink-0 w-10 text-right text-xs text-[var(--ink-4)] sm:inline">
        {dayCount(res.checkIn, res.checkOut)}{c.daysShort}
      </span>

      <span className="hidden shrink-0 w-10 text-right text-xs text-[var(--ink-4)] sm:inline">
        {res._count?.guests || 0}
        <span className="ml-0.5 text-[var(--ink-4)]">{c.guestShort}</span>
      </span>

      <svg className="h-4 w-4 shrink-0 text-[var(--ink-4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { CleaningSchedule, type CleanerAssignmentInfo } from "@/components/cleaning-schedule";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";
import type { Property, CalendarLink, DateOverride } from "@/lib/types";
import {
  buildUnifiedStays,
  platformColor,
  platformDisplayName,
  toLocalDateStr,
  type CalendarEvent,
  type UnifiedStay,
} from "@/lib/reservation-display";

interface CopyShape {
  dateLocale: string;
  reservationsAcross: (resCount: number, propCount: number) => string;
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
    reservationsAcross: (resCount, propCount) =>
      `${resCount} reservations across ${propCount} ${propCount === 1 ? "property" : "properties"}`,
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
    reservationsAcross: (resCount, propCount) =>
      `${resCount} бронирований в ${propCount} ${propCount === 1 ? "объекте" : "объектах"}`,
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
    reservationsAcross: (resCount, propCount) =>
      `${resCount} Buchungen in ${propCount} ${propCount === 1 ? "Unterkunft" : "Unterkünften"}`,
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
    reservationsAcross: (resCount, propCount) =>
      `${resCount} réservations sur ${propCount} ${propCount === 1 ? "logement" : "logements"}`,
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
      `jusqu'au ${date} · ${nights} ${nights === 1 ? "nuit" : "nuits"} restantes`,
    inDays: (date, days) => `${date} (dans ${days} j)`,
  },
  es: {
    dateLocale: "es-ES",
    reservationsAcross: (resCount, propCount) =>
      `${resCount} reservas en ${propCount} ${propCount === 1 ? "alojamiento" : "alojamientos"}`,
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

interface ReservationsPanelProps {
  properties: Property[];
  onSelectProperty: (id: number) => void;
  onSelectReservation: (id: number) => void;
  onUpdateProperty?: (id: number, data: { name?: string }) => Promise<void> | void;
}

export function ReservationsPanel({
  properties,
  onSelectProperty,
  onSelectReservation,
  onUpdateProperty,
}: ReservationsPanelProps) {
  const { t, locale } = useI18n();
  const c = COPY[locale];

  const [allSyncedEvents, setAllSyncedEvents] = useState<Record<number, CalendarEvent[]>>({});
  const [allLinks, setAllLinks] = useState<Record<number, CalendarLink[]>>({});
  const [allOverrides, setAllOverrides] = useState<Record<number, DateOverride[]>>({});
  const [loadingCalendarData, setLoadingCalendarData] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [cardNameDraft, setCardNameDraft] = useState("");
  const [savingCardId, setSavingCardId] = useState<number | null>(null);
  const [cleanerAssignments, setCleanerAssignments] = useState<Record<number, CleanerAssignmentInfo[]>>({});
  const [cleanerConflictDates, setCleanerConflictDates] = useState<string[]>([]);
  const [showPast, setShowPast] = useState(false);

  const fetchAllCalendarData = useCallback(async () => {
    if (properties.length === 0) return;
    setLoadingCalendarData(true);
    try {
      const results = await Promise.all(
        properties.map(async (p) => {
          const [syncRes, linksRes, ovRes] = await Promise.all([
            fetch(`/api/calendar/sync?propertyId=${p.id}&limit=200`).then((r) => r.json()),
            fetch(`/api/calendar/links?propertyId=${p.id}`).then((r) => r.json()),
            fetch(`/api/date-overrides?propertyId=${p.id}`).then((r) => r.json()),
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
  }, [properties]);

  useEffect(() => {
    fetchAllCalendarData();
  }, [fetchAllCalendarData]);

  useEffect(() => {
    if (properties.length === 0) {
      setCleanerAssignments({});
      return;
    }
    let cancelled = false;
    fetch(`/api/cleaners?withAssignments=1`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: Array<{ id: number; name: string; assignments?: Array<{ propertyId: number; priority: number }> }>) => {
        if (cancelled || !Array.isArray(rows)) return;
        const map: Record<number, CleanerAssignmentInfo[]> = {};
        for (const cleaner of rows) {
          for (const a of cleaner.assignments ?? []) {
            const list = map[a.propertyId] ?? (map[a.propertyId] = []);
            list.push({ identityKey: `p:${cleaner.id}`, name: cleaner.name, priority: a.priority });
          }
        }
        for (const list of Object.values(map)) list.sort((a, b) => a.priority - b.priority);
        setCleanerAssignments(map);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [properties.length]);

  const allReservations = useMemo(
    () =>
      properties.flatMap((p) =>
        p.reservations.map((r) => ({
          ...r,
          propertyName: p.name,
          propertyId: p.id,
        }))
      ),
    [properties]
  );

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const sevenDaysOutStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const { active, next7, later, past } = useMemo(() => {
    const activeBucket: typeof allReservations = [];
    const next7Bucket: typeof allReservations = [];
    const laterBucket: typeof allReservations = [];
    const pastBucket: typeof allReservations = [];
    for (const r of allReservations) {
      if (r.checkOut <= todayStr) {
        pastBucket.push(r);
      } else if (r.checkIn <= todayStr) {
        activeBucket.push(r);
      } else if (r.checkIn < sevenDaysOutStr) {
        next7Bucket.push(r);
      } else {
        laterBucket.push(r);
      }
    }
    activeBucket.sort((a, b) => a.checkOut.localeCompare(b.checkOut));
    next7Bucket.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
    laterBucket.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
    pastBucket.sort((a, b) => b.checkOut.localeCompare(a.checkOut));
    return { active: activeBucket, next7: next7Bucket, later: laterBucket, past: pastBucket };
  }, [allReservations, todayStr, sevenDaysOutStr]);

  const hasCleanerConflictNext7 = useMemo(
    () => cleanerConflictDates.some((d) => d >= todayStr && d < sevenDaysOutStr),
    [cleanerConflictDates, todayStr, sevenDaysOutStr]
  );

  const propertyOccupancy = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const map = new Map<number, { current: UnifiedStay | null; next: UnifiedStay | null }>();
    for (const p of properties) {
      const stays = buildUnifiedStays(p, allSyncedEvents[p.id] || []);
      const current = stays.find((s) => s.start <= today && s.end > today) ?? null;
      const next = stays.find((s) => s.start > today) ?? null;
      map.set(p.id, { current, next });
    }
    return map;
  }, [properties, allSyncedEvents]);

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const sortedFlat = useMemo(() => [...next7, ...later, ...past], [next7, later, past]);
  const displayReservations = trimmedQuery
    ? sortedFlat.filter((r) => r.name.toLowerCase().includes(trimmedQuery))
    : sortedFlat;
  const useSections = !trimmedQuery && active.length + next7.length + later.length + past.length > 0;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(c.dateLocale, { day: "2-digit", month: "short" });

  const dayCount = (checkIn: string, checkOut: string) => {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleRowClick = (propertyId: number, reservationId: number) => {
    onSelectProperty(propertyId);
    setTimeout(() => onSelectReservation(reservationId), 50);
  };

  const handleSaveCardName = async (id: number, original: string) => {
    if (!onUpdateProperty) return;
    const trimmed = cardNameDraft.trim();
    if (!trimmed || trimmed === original) {
      setEditingCardId(null);
      return;
    }
    setSavingCardId(id);
    try {
      await onUpdateProperty(id, { name: trimmed });
      setEditingCardId(null);
    } finally {
      setSavingCardId(null);
    }
  };

  const resCount = allReservations.filter((r) => r.checkOut > todayStr).length;

  if (properties.length === 0) {
    return (
      <div className="mx-auto max-w-[1760px] space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink)]">{t("dashboard.reservations")}</h1>
          <p className="mt-1 text-sm text-[var(--ink-4)]">{t("dashboard.noReservationsGlobal")}</p>
        </div>
        <div className="rounded-lg border border-dashed border-[var(--line)] py-16 text-center">
          <p className="text-sm text-[var(--ink-4)]">{t("dashboard.noReservationsGlobal")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-3 sm:-mx-6 lg:-mx-8">
      <div className="mx-auto max-w-[1760px] space-y-6 px-3 sm:px-5">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--ink)]">
            {t("dashboard.reservations")}
            {loadingCalendarData && (
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-[var(--line-2)] border-t-[#58a6ff]" />
            )}
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-4)]">
            {c.reservationsAcross(resCount, properties.length)}
          </p>
        </div>

        {/* Property cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {properties.map((p) => {
            const occ = propertyOccupancy.get(p.id);
            const current = occ?.current ?? null;
            const next = occ?.next ?? null;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const nightsLeft = current ? Math.round((current.end.getTime() - today.getTime()) / 86400000) : 0;
            const daysUntilNext = next ? Math.round((next.start.getTime() - today.getTime()) / 86400000) : 0;
            const futureRes = p.reservations.filter((r) => new Date(r.checkOut) >= new Date());
            const links = allLinks[p.id];
            const failingLinks = Array.isArray(links) ? links.filter((l) => Boolean(l.lastError)) : [];
            const hasSyncError = failingLinks.length > 0;
            return (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectProperty(p.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectProperty(p.id);
                  }
                }}
                className="group cursor-pointer rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-5 text-left transition-all hover:border-[var(--line-2)] hover:bg-[var(--bg-3)]"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  {editingCardId === p.id ? (
                    <div
                      className="flex min-w-0 flex-1 items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        value={cardNameDraft}
                        onChange={(e) => setCardNameDraft(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter") handleSaveCardName(p.id, p.name);
                          if (e.key === "Escape") setEditingCardId(null);
                        }}
                        autoFocus
                        disabled={savingCardId === p.id}
                        className="min-w-0 flex-1 rounded-md border border-[var(--line-2)] bg-[var(--bg)] px-2 py-0.5 text-sm font-semibold text-[var(--ink)] outline-none focus:border-[var(--ink)] disabled:opacity-60"
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSaveCardName(p.id, p.name); }}
                        disabled={savingCardId === p.id}
                        aria-label={t("common.save")}
                        title={t("common.save")}
                        className="shrink-0 rounded-md p-1 text-emerald-500 hover:bg-emerald-500/10 disabled:opacity-50"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingCardId(null); }}
                        disabled={savingCardId === p.id}
                        aria-label={t("common.cancel")}
                        title={t("common.cancel")}
                        className="shrink-0 rounded-md p-1 text-[var(--ink-4)] hover:bg-[var(--line-2)] hover:text-[var(--ink)] disabled:opacity-50"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex min-w-0 items-center gap-1">
                      <h3 className="truncate text-sm font-semibold text-[var(--ink)] transition-colors">{p.name}</h3>
                      {onUpdateProperty && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCardNameDraft(p.name);
                            setEditingCardId(p.id);
                          }}
                          aria-label={t("common.edit")}
                          title={t("common.edit")}
                          className="shrink-0 rounded p-0.5 text-[var(--ink-4)] transition-colors hover:bg-[var(--line-2)] hover:text-[var(--ink)]"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM19.5 7.125L16.875 4.5" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                  <Link
                    href={`/dashboard?property=${p.id}&view=calendar`}
                    onClick={(e) => e.stopPropagation()}
                    title={t("dashboard.newReservation")}
                    aria-label={t("dashboard.newReservation")}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[var(--m-accent)] px-2 py-1 text-[11px] font-medium text-white transition-colors hover:bg-[var(--m-accent-2)]"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className="hidden sm:inline">{c.reservationLabel}</span>
                  </Link>
                </div>
                <div className="space-y-2">
                  <div className="flex min-h-[20px] items-baseline gap-2 text-sm">
                    {loadingCalendarData ? (
                      <div className="h-3 w-32 animate-pulse rounded bg-[var(--line-2)]/60" />
                    ) : current ? (
                      <>
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: platformColor(current.platform) }}
                        />
                        <span className="truncate font-semibold text-[var(--ink)]">{current.name}</span>
                        <span className="whitespace-nowrap text-[11px] text-[var(--ink-3)]">
                          {c.untilNightsLeft(formatDate(toLocalDateStr(current.end)), nightsLeft)}
                        </span>
                      </>
                    ) : (
                      <span className="text-[var(--ink-3)]">{c.availableLabel}</span>
                    )}
                  </div>
                  <div className="flex min-h-[16px] items-baseline gap-2 text-xs">
                    {loadingCalendarData ? (
                      <div className="h-2.5 w-24 animate-pulse rounded bg-[var(--line-2)]/40" />
                    ) : next ? (
                      <>
                        <span className="text-[var(--ink-4)]">{c.nextLabel}</span>
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: platformColor(next.platform) }}
                        />
                        <span className="truncate font-medium text-[var(--ink-2)]">{next.name}</span>
                        <span className="whitespace-nowrap text-[var(--ink-4)]">
                          {c.inDays(formatDate(toLocalDateStr(next.start)), daysUntilNext)}
                        </span>
                      </>
                    ) : (
                      <span className="text-[var(--ink-4)]">{c.noUpcoming}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-[var(--ink-4)]">
                    <span>{futureRes.length} {c.bookingsCountShort}</span>
                    <span>·</span>
                    <span>{c.minNightsLabel(p.minNights)}</span>
                    {hasSyncError && (
                      <>
                        <span>·</span>
                        <span
                          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium text-amber-300"
                          style={{ backgroundColor: "rgba(217,119,6,0.18)" }}
                          title={failingLinks.map((l) => `${platformDisplayName(l.platform)}: ${l.lastError}`).join("\n")}
                        >
                          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                          </svg>
                          {c.syncShort}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search */}
        {allReservations.length > 0 && (
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={c.searchPlaceholder}
              className="h-9 w-full rounded-md border border-[var(--line)] bg-[var(--bg-2)] pl-9 pr-8 text-sm text-[var(--ink)] placeholder-[var(--ink-4)] outline-none transition-colors focus:border-[var(--line-2)]"
            />
            <svg className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2M16.5 10.5a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--ink-4)] hover:text-[var(--ink)]"
                aria-label="Clear search"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Upcoming reservations list */}
        {displayReservations.length > 0 || (useSections && past.length > 0) ? (
          <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)]">
            <div className="border-b border-[var(--line)] px-4 py-3">
              <h2 className="text-xs font-medium text-[var(--ink-3)]">
                {t("dashboard.upcomingReservations")}
                {trimmedQuery && (
                  <span className="ml-2 text-[var(--ink-4)]">
                    · {displayReservations.length} {c.foundLabel}
                  </span>
                )}
              </h2>
            </div>
            {useSections ? (
              <div>
                {active.length > 0 && (
                  <>
                    <ReservationSectionHeader label={c.currentlyStaying} />
                    {active.map((res, i) => (
                      <ReservationRow
                        key={res.id}
                        res={res}
                        isLast={i === active.length - 1 && next7.length === 0 && later.length === 0 && (!showPast || past.length === 0)}
                        formatDate={formatDate}
                        dayCount={dayCount}
                        locale={locale}
                        onClick={() => handleRowClick(res.propertyId, res.id)}
                        muted={false}
                      />
                    ))}
                  </>
                )}
                {next7.length > 0 && (
                  <>
                    {(active.length > 0 || later.length > 0 || past.length > 0) && (
                      <ReservationSectionHeader
                        label={t("calendar.next7Days")}
                        badge={hasCleanerConflictNext7 ? (
                          <a
                            href="?view=cleaning"
                            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-amber-300 transition-colors hover:bg-amber-500/15"
                            style={{ backgroundColor: "rgba(217,119,6,0.18)" }}
                            title={t("dashboard.cleanerConflictHint")}
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            {t("dashboard.cleanerConflictBadge")}
                          </a>
                        ) : undefined}
                      />
                    )}
                    {next7.map((res, i) => (
                      <ReservationRow
                        key={res.id}
                        res={res}
                        isLast={i === next7.length - 1 && later.length === 0 && (!showPast || past.length === 0)}
                        formatDate={formatDate}
                        dayCount={dayCount}
                        locale={locale}
                        onClick={() => handleRowClick(res.propertyId, res.id)}
                        muted={false}
                      />
                    ))}
                  </>
                )}
                {later.length > 0 && (
                  <>
                    <ReservationSectionHeader label={t("calendar.later")} />
                    {later.map((res, i) => (
                      <ReservationRow
                        key={res.id}
                        res={res}
                        isLast={i === later.length - 1 && (!showPast || past.length === 0)}
                        formatDate={formatDate}
                        dayCount={dayCount}
                        locale={locale}
                        onClick={() => handleRowClick(res.propertyId, res.id)}
                        muted={false}
                      />
                    ))}
                  </>
                )}
                {past.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowPast((v) => !v)}
                      className="flex w-full items-center justify-between border-b border-[var(--line)]/50 bg-[var(--bg-3)]/40 px-4 py-1.5 text-left transition-colors hover:bg-[var(--bg-3)]/70"
                    >
                      <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
                        {showPast
                          ? t("dashboard.hidePast")
                          : t("dashboard.showPast").replace("{n}", String(past.length))}
                      </span>
                      <svg
                        className={`h-3.5 w-3.5 text-[var(--ink-4)] transition-transform ${showPast ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    {showPast &&
                      past.map((res, i) => (
                        <ReservationRow
                          key={res.id}
                          res={res}
                          isLast={i === past.length - 1}
                          formatDate={formatDate}
                          dayCount={dayCount}
                          locale={locale}
                          onClick={() => handleRowClick(res.propertyId, res.id)}
                          muted
                        />
                      ))}
                  </>
                )}
              </div>
            ) : (
              <div>
                {displayReservations.map((res, i) => (
                  <ReservationRow
                    key={res.id}
                    res={res}
                    isLast={i === displayReservations.length - 1}
                    formatDate={formatDate}
                    dayCount={dayCount}
                    locale={locale}
                    onClick={() => handleRowClick(res.propertyId, res.id)}
                    muted={false}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[var(--line)] py-16 text-center">
            <p className="text-sm text-[var(--ink-4)]">{t("dashboard.noReservationsGlobal")}</p>
          </div>
        )}

        {properties.length > 0 && Object.keys(allSyncedEvents).length > 0 && (
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
      </div>
    </div>
  );
}

function ReservationSectionHeader({ label, badge }: { label: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--line)]/50 bg-[var(--bg-3)]/40 px-4 py-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
        {label}
      </span>
      {badge}
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
  formatDate: (d: string) => string;
  dayCount: (a: string, b: string) => number;
  locale: string;
  onClick: () => void;
  muted: boolean;
}

function ReservationRow({ res, isLast, formatDate, dayCount, locale, onClick, muted }: ReservationRowProps) {
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
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-[var(--ink)]">{res.name}</span>
          <span className="hidden truncate text-sm text-[var(--ink-3)] sm:block">{res.propertyName}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--ink-4)] sm:hidden">
          <span className="truncate">
            {formatDate(res.checkIn)} — {formatDate(res.checkOut)}
          </span>
          <span aria-hidden>·</span>
          <span>{dayCount(res.checkIn, res.checkOut)}{c.daysShort}</span>
        </div>
      </div>
      <span
        className="hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white sm:inline"
        style={{ backgroundColor: platformColor(res.platform) }}
      >
        {platformDisplayName(res.platform)}
      </span>
      <span className="hidden shrink-0 text-sm text-[var(--ink-3)] sm:inline">
        {formatDate(res.checkIn)} — {formatDate(res.checkOut)}
      </span>
      <span className="hidden w-10 shrink-0 text-right text-xs text-[var(--ink-4)] sm:inline">
        {dayCount(res.checkIn, res.checkOut)}{c.daysShort}
      </span>
      <span className="hidden w-10 shrink-0 text-right text-xs text-[var(--ink-4)] sm:inline">
        {res._count?.guests || 0}
        <span className="ml-0.5 text-[var(--ink-4)]">{c.guestShort}</span>
      </span>
      <svg className="h-4 w-4 shrink-0 text-[var(--ink-4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </div>
  );
}

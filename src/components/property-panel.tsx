"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Calendar, ChevronLeft, Settings, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";
import { platformColor, platformDisplayName } from "@/lib/reservation-display";
import type { Property, RentalMode, Reservation } from "@/lib/types";
import { cn, GLASS_SURFACE } from "@/lib/utils";

interface CopyShape {
  title: string;
  subtitle: (count: number) => string;
  emptyState: string;
  back: string;
  upcomingCount: (count: number) => string;
  noUpcoming: string;
  currentlyStaying: string;
  secAtAGlance: string;
  minNights: (n: number) => string;
  checkIn: string;
  checkOut: string;
  rentalMode: (mode: RentalMode) => string;
  secUpcoming: string;
  noUpcomingBookings: string;
  secQuickLinks: string;
  linkCalendar: string;
  linkCleaning: string;
  linkSettings: string;
  dateLocale: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    title: "Property",
    subtitle: (count) =>
      `${count} ${count === 1 ? "property" : "properties"}`,
    emptyState: "Add a property to get started.",
    back: "All properties",
    upcomingCount: (count) =>
      `${count} upcoming ${count === 1 ? "booking" : "bookings"}`,
    noUpcoming: "No upcoming bookings",
    currentlyStaying: "Currently occupied",
    secAtAGlance: "At a glance",
    minNights: (n) => `Min. ${n} ${n === 1 ? "night" : "nights"}`,
    checkIn: "Check-in",
    checkOut: "Check-out",
    rentalMode: (mode) => (mode === "whole" ? "Entire property" : "Per room"),
    secUpcoming: "Upcoming",
    noUpcomingBookings: "No upcoming bookings for this property.",
    secQuickLinks: "Quick links",
    linkCalendar: "Calendar",
    linkCleaning: "Cleaning",
    linkSettings: "Settings",
    dateLocale: "en-GB",
  },
  ru: {
    title: "Объект",
    subtitle: (count) => `${count} объектов`,
    emptyState: "Добавьте объект, чтобы начать.",
    back: "Все объекты",
    upcomingCount: (count) => `${count} предстоящих броней`,
    noUpcoming: "Нет предстоящих броней",
    currentlyStaying: "Сейчас занято",
    secAtAGlance: "Кратко",
    minNights: (n) => `Мин. ${n} ноч.`,
    checkIn: "Заезд",
    checkOut: "Выезд",
    rentalMode: (mode) =>
      mode === "whole" ? "Весь объект" : "По комнатам",
    secUpcoming: "Предстоящие",
    noUpcomingBookings: "Нет предстоящих броней для этого объекта.",
    secQuickLinks: "Быстрые ссылки",
    linkCalendar: "Календарь",
    linkCleaning: "Уборка",
    linkSettings: "Настройки",
    dateLocale: "ru-RU",
  },
  de: {
    title: "Objekt",
    subtitle: (count) =>
      `${count} ${count === 1 ? "Unterkunft" : "Unterkünfte"}`,
    emptyState: "Fügen Sie eine Unterkunft hinzu, um zu beginnen.",
    back: "Alle Unterkünfte",
    upcomingCount: (count) =>
      `${count} bevorstehende ${count === 1 ? "Buchung" : "Buchungen"}`,
    noUpcoming: "Keine bevorstehenden Buchungen",
    currentlyStaying: "Aktuell belegt",
    secAtAGlance: "Auf einen Blick",
    minNights: (n) => `Min. ${n} ${n === 1 ? "Nacht" : "Nächte"}`,
    checkIn: "Check-in",
    checkOut: "Check-out",
    rentalMode: (mode) =>
      mode === "whole" ? "Gesamte Unterkunft" : "Pro Zimmer",
    secUpcoming: "Bevorstehend",
    noUpcomingBookings: "Keine bevorstehenden Buchungen für diese Unterkunft.",
    secQuickLinks: "Schnellzugriff",
    linkCalendar: "Kalender",
    linkCleaning: "Reinigung",
    linkSettings: "Einstellungen",
    dateLocale: "de-DE",
  },
  fr: {
    title: "Logement",
    subtitle: (count) => `${count} logements`,
    emptyState: "Ajoutez un logement pour commencer.",
    back: "Tous les logements",
    upcomingCount: (count) =>
      `${count} réservation${count === 1 ? "" : "s"} à venir`,
    noUpcoming: "Aucune réservation à venir",
    currentlyStaying: "Occupé actuellement",
    secAtAGlance: "En bref",
    minNights: (n) => `Min. ${n} ${n === 1 ? "nuit" : "nuits"}`,
    checkIn: "Arrivée",
    checkOut: "Départ",
    rentalMode: (mode) =>
      mode === "whole" ? "Logement entier" : "Par chambre",
    secUpcoming: "À venir",
    noUpcomingBookings: "Aucune réservation à venir pour ce logement.",
    secQuickLinks: "Accès rapide",
    linkCalendar: "Calendrier",
    linkCleaning: "Ménage",
    linkSettings: "Paramètres",
    dateLocale: "fr-FR",
  },
  es: {
    title: "Alojamiento",
    subtitle: (count) =>
      `${count} ${count === 1 ? "alojamiento" : "alojamientos"}`,
    emptyState: "Añada un alojamiento para empezar.",
    back: "Todos los alojamientos",
    upcomingCount: (count) =>
      `${count} reserva${count === 1 ? "" : "s"} próxima${count === 1 ? "" : "s"}`,
    noUpcoming: "No hay reservas próximas",
    currentlyStaying: "Ocupado ahora",
    secAtAGlance: "De un vistazo",
    minNights: (n) => `Mín. ${n} ${n === 1 ? "noche" : "noches"}`,
    checkIn: "Entrada",
    checkOut: "Salida",
    rentalMode: (mode) =>
      mode === "whole" ? "Alojamiento completo" : "Por habitación",
    secUpcoming: "Próximas",
    noUpcomingBookings: "No hay reservas próximas para este alojamiento.",
    secQuickLinks: "Accesos rápidos",
    linkCalendar: "Calendario",
    linkCleaning: "Limpieza",
    linkSettings: "Ajustes",
    dateLocale: "es-ES",
  },
};

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(hhmm: string, dateLocale: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(dateLocale, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateRange(
  checkIn: string,
  checkOut: string,
  dateLocale: string
): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(dateLocale, {
      day: "2-digit",
      month: "short",
    });
  return `${fmt(checkIn)} – ${fmt(checkOut)}`;
}

function getUpcomingReservations(
  reservations: Reservation[],
  today: string
): Reservation[] {
  return reservations
    .filter((r) => r.checkOut > today)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
}

interface PropertyPanelProps {
  properties: Property[];
  selectedPropertyId: number | null;
}

function PropertyDetail({
  property,
  c,
}: {
  property: Property;
  c: CopyShape;
}) {
  const today = useMemo(() => todayStr(), []);
  const upcoming = useMemo(
    () => getUpcomingReservations(property.reservations, today),
    [property.reservations, today]
  );
  const preview = upcoming.slice(0, 3);
  const isOccupied = upcoming.some(
    (r) => r.checkIn <= today && r.checkOut > today
  );

  const statusLine = isOccupied
    ? upcoming.length > 0
      ? `${c.currentlyStaying} · ${c.upcomingCount(upcoming.length)}`
      : c.currentlyStaying
    : upcoming.length > 0
      ? c.upcomingCount(upcoming.length)
      : c.noUpcoming;

  const quickLinks = [
    {
      href: `/dashboard?property=${property.id}&view=calendar`,
      label: c.linkCalendar,
      icon: Calendar,
    },
    {
      href: `/dashboard?property=${property.id}&view=cleaning`,
      label: c.linkCleaning,
      icon: Sparkles,
    },
    {
      href: `/dashboard?property=${property.id}&view=property-settings`,
      label: c.linkSettings,
      icon: Settings,
    },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 w-fit">
        <Button
          variant="outline"
          size="default"
          className="h-9 gap-2 border-[var(--line)] bg-[var(--bg)]/80 px-3.5 font-medium text-[var(--ink)] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12)] backdrop-blur-sm hover:bg-[var(--bg-2)]/90 hover:ring-1 hover:ring-[var(--line-2)]"
          render={<Link href="/dashboard?view=sync" />}
        >
          <ChevronLeft className="size-4" />
          {c.back}
        </Button>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-[var(--ink)]">
          {property.name}
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-3)]">{statusLine}</p>
      </div>

      <Card className={cn(GLASS_SURFACE, "py-0")}>
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm font-semibold text-[var(--ink)]">
            {c.secAtAGlance}
          </CardTitle>
        </CardHeader>
        <Separator className="bg-[var(--line)]" />
        <CardContent className="grid gap-3 px-4 py-3 sm:grid-cols-2">
          <GlanceItem label={c.minNights(property.minNights)} />
          <GlanceItem label={c.rentalMode(property.rentalMode)} />
          <GlanceItem
            label={`${c.checkIn} · ${formatTime(property.checkInTime, c.dateLocale)}`}
          />
          <GlanceItem
            label={`${c.checkOut} · ${formatTime(property.checkOutTime, c.dateLocale)}`}
          />
        </CardContent>
      </Card>

      <Card className={cn(GLASS_SURFACE, "py-0")}>
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm font-semibold text-[var(--ink)]">
            {c.secUpcoming}
          </CardTitle>
        </CardHeader>
        <Separator className="bg-[var(--line)]" />
        <CardContent className="px-4 py-3">
          {preview.length === 0 ? (
            <p className="text-sm text-[var(--ink-3)]">
              {c.noUpcomingBookings}
            </p>
          ) : (
            <ul className="space-y-3">
              {preview.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--ink)]">
                      {r.name}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--ink-3)]">
                      {formatDateRange(r.checkIn, r.checkOut, c.dateLocale)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 border-[var(--line)] text-[var(--ink-3)]"
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{
                        backgroundColor: platformColor(r.platform || "direct"),
                      }}
                    />
                    {platformDisplayName(r.platform || "direct")}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className={cn(GLASS_SURFACE, "py-0")}>
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm font-semibold text-[var(--ink)]">
            {c.secQuickLinks}
          </CardTitle>
        </CardHeader>
        <Separator className="bg-[var(--line)]" />
        <CardContent className="grid gap-2 px-4 py-3 sm:grid-cols-3">
          {quickLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--bg-3)] hover:ring-1 hover:ring-[var(--line-2)]"
            >
              <Icon className="size-4 shrink-0 text-[var(--ink-3)]" />
              {label}
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function GlanceItem({ label }: { label: string }) {
  return (
    <p className="text-sm text-[var(--ink-2)]">
      <span className="text-[var(--ink)]">{label}</span>
    </p>
  );
}

export function PropertyPanel({
  properties,
  selectedPropertyId,
}: PropertyPanelProps) {
  const { locale } = useI18n();
  const c = COPY[locale];

  const selectedProperty = selectedPropertyId
    ? (properties.find((p) => p.id === selectedPropertyId) ?? null)
    : null;

  return (
    <div className="-mx-3 sm:-mx-6 lg:-mx-8">
      <div className="mx-auto max-w-[1760px] space-y-6 px-3 sm:px-5">
        {selectedProperty ? (
          <PropertyDetail property={selectedProperty} c={c} />
        ) : (
          <>
            <div>
              <h1 className="text-xl font-semibold text-[var(--ink)]">
                {c.title}
              </h1>
              {properties.length > 0 && (
                <p className="mt-1 text-sm text-[var(--ink-3)]">
                  {c.subtitle(properties.length)}
                </p>
              )}
            </div>

            {properties.length === 0 ? (
              <p className="text-sm text-[var(--ink-3)]">{c.emptyState}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {properties.map((property) => (
                  <Link
                    key={property.id}
                    href={`/dashboard?property=${property.id}&view=sync`}
                    className="block"
                  >
                    <Card className={cn(GLASS_SURFACE, "py-0 transition-colors hover:bg-[var(--bg-2)]/90 hover:ring-[var(--line-2)]")}>
                      <CardHeader className="px-4 py-4">
                        <CardTitle className="truncate text-sm font-semibold text-[var(--ink)]">
                          {property.name}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

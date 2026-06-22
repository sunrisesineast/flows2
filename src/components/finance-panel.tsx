/**
 * SCAFFOLD ONLY — Revenue Dashboard UI shell.
 * AI: Do NOT add fetch calls, API routes, or wire revenue-dashboard.stub.ts
 * unless the user explicitly asks to implement the finance API.
 */
"use client";

import { useMemo, useState } from "react";
import { PropertySwitcher } from "@/components/property-switcher";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";
import type { RevenueBreakdownBy } from "@/lib/finance/revenue-dashboard.stub";
import type { Property } from "@/lib/types";

interface CopyShape {
  title: string;
  subtitle: string;
  portfolioSubtitle: (count: number) => string;
  propertySubtitle: (name: string) => string;
  noProperties: string;
  placeholderBanner: string;
  dateRange: string;
  fromLabel: string;
  toLabel: string;
  breakdownBy: string;
  breakdownProperty: string;
  breakdownRoomType: string;
  breakdownCity: string;
  breakdownChannel: string;
  breakdownDateRange: string;
  revenueBreakdown: string;
  colGroup: string;
  colRevenue: string;
  colBookings: string;
  colOccupancy: string;
  kpiTotalRevenue: string;
  kpiNetRevenue: string;
  kpiProfit: string;
  kpiOccupancy: string;
  kpiAdr: string;
  kpiRevpar: string;
  kpiAvgStay: string;
  kpiBookingCount: string;
  placeholder: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    title: "Revenue Dashboard",
    subtitle: "How much money am I making?",
    portfolioSubtitle: (count) =>
      `Portfolio across ${count} ${count === 1 ? "property" : "properties"}`,
    propertySubtitle: (name) => `${name} — revenue`,
    noProperties: "No properties to report on yet.",
    placeholderBanner: "Placeholder data — finance API not connected",
    dateRange: "Date range",
    fromLabel: "From",
    toLabel: "To",
    breakdownBy: "Breakdown by",
    breakdownProperty: "Property",
    breakdownRoomType: "Room type",
    breakdownCity: "City",
    breakdownChannel: "Booking channel",
    breakdownDateRange: "Date range",
    revenueBreakdown: "Revenue breakdown",
    colGroup: "Group",
    colRevenue: "Revenue",
    colBookings: "Bookings",
    colOccupancy: "Occupancy",
    kpiTotalRevenue: "Total Revenue",
    kpiNetRevenue: "Net Revenue",
    kpiProfit: "Profit",
    kpiOccupancy: "Occupancy %",
    kpiAdr: "ADR",
    kpiRevpar: "RevPAR",
    kpiAvgStay: "Avg stay length",
    kpiBookingCount: "Booking count",
    placeholder: "—",
  },
  ru: {
    title: "Доход",
    subtitle: "Сколько я зарабатываю?",
    portfolioSubtitle: (count) =>
      `Портфель: ${count} ${count === 1 ? "объект" : "объектов"}`,
    propertySubtitle: (name) => `${name} — доход`,
    noProperties: "Пока нет объектов для отчёта.",
    placeholderBanner: "Демо-данные — API финансов не подключён",
    dateRange: "Период",
    fromLabel: "С",
    toLabel: "По",
    breakdownBy: "Разбивка по",
    breakdownProperty: "Объект",
    breakdownRoomType: "Тип номера",
    breakdownCity: "Город",
    breakdownChannel: "Канал бронирования",
    breakdownDateRange: "Период",
    revenueBreakdown: "Разбивка дохода",
    colGroup: "Группа",
    colRevenue: "Доход",
    colBookings: "Бронирования",
    colOccupancy: "Загрузка",
    kpiTotalRevenue: "Общий доход",
    kpiNetRevenue: "Чистый доход",
    kpiProfit: "Прибыль",
    kpiOccupancy: "Загрузка %",
    kpiAdr: "ADR",
    kpiRevpar: "RevPAR",
    kpiAvgStay: "Ср. длительность",
    kpiBookingCount: "Бронирований",
    placeholder: "—",
  },
  de: {
    title: "Umsatz-Dashboard",
    subtitle: "Wie viel verdiene ich?",
    portfolioSubtitle: (count) =>
      `Portfolio über ${count} ${count === 1 ? "Unterkunft" : "Unterkünfte"}`,
    propertySubtitle: (name) => `${name} — Umsatz`,
    noProperties: "Noch keine Unterkünfte für Berichte.",
    placeholderBanner: "Platzhalterdaten — Finanz-API nicht verbunden",
    dateRange: "Zeitraum",
    fromLabel: "Von",
    toLabel: "Bis",
    breakdownBy: "Aufschlüsselung nach",
    breakdownProperty: "Unterkunft",
    breakdownRoomType: "Zimmertyp",
    breakdownCity: "Stadt",
    breakdownChannel: "Buchungskanal",
    breakdownDateRange: "Zeitraum",
    revenueBreakdown: "Umsatzaufschlüsselung",
    colGroup: "Gruppe",
    colRevenue: "Umsatz",
    colBookings: "Buchungen",
    colOccupancy: "Auslastung",
    kpiTotalRevenue: "Gesamtumsatz",
    kpiNetRevenue: "Nettoumsatz",
    kpiProfit: "Gewinn",
    kpiOccupancy: "Auslastung %",
    kpiAdr: "ADR",
    kpiRevpar: "RevPAR",
    kpiAvgStay: "Ø Aufenthalt",
    kpiBookingCount: "Buchungen",
    placeholder: "—",
  },
  fr: {
    title: "Tableau des revenus",
    subtitle: "Combien est-ce que je gagne ?",
    portfolioSubtitle: (count) =>
      `Portefeuille sur ${count} ${count === 1 ? "logement" : "logements"}`,
    propertySubtitle: (name) => `${name} — revenus`,
    noProperties: "Aucun logement à analyser pour l'instant.",
    placeholderBanner: "Données fictives — API finance non connectée",
    dateRange: "Période",
    fromLabel: "Du",
    toLabel: "Au",
    breakdownBy: "Répartition par",
    breakdownProperty: "Logement",
    breakdownRoomType: "Type de chambre",
    breakdownCity: "Ville",
    breakdownChannel: "Canal de réservation",
    breakdownDateRange: "Période",
    revenueBreakdown: "Répartition des revenus",
    colGroup: "Groupe",
    colRevenue: "Revenus",
    colBookings: "Réservations",
    colOccupancy: "Occupation",
    kpiTotalRevenue: "Revenus totaux",
    kpiNetRevenue: "Revenus nets",
    kpiProfit: "Profit",
    kpiOccupancy: "Occupation %",
    kpiAdr: "ADR",
    kpiRevpar: "RevPAR",
    kpiAvgStay: "Durée moy.",
    kpiBookingCount: "Réservations",
    placeholder: "—",
  },
  es: {
    title: "Panel de ingresos",
    subtitle: "¿Cuánto dinero estoy ganando?",
    portfolioSubtitle: (count) =>
      `Cartera de ${count} ${count === 1 ? "alojamiento" : "alojamientos"}`,
    propertySubtitle: (name) => `${name} — ingresos`,
    noProperties: "Aún no hay alojamientos para informar.",
    placeholderBanner: "Datos de ejemplo — API de finanzas no conectada",
    dateRange: "Rango de fechas",
    fromLabel: "Desde",
    toLabel: "Hasta",
    breakdownBy: "Desglose por",
    breakdownProperty: "Alojamiento",
    breakdownRoomType: "Tipo de habitación",
    breakdownCity: "Ciudad",
    breakdownChannel: "Canal de reserva",
    breakdownDateRange: "Rango de fechas",
    revenueBreakdown: "Desglose de ingresos",
    colGroup: "Grupo",
    colRevenue: "Ingresos",
    colBookings: "Reservas",
    colOccupancy: "Ocupación",
    kpiTotalRevenue: "Ingresos totales",
    kpiNetRevenue: "Ingresos netos",
    kpiProfit: "Beneficio",
    kpiOccupancy: "Ocupación %",
    kpiAdr: "ADR",
    kpiRevpar: "RevPAR",
    kpiAvgStay: "Estancia media",
    kpiBookingCount: "Reservas",
    placeholder: "—",
  },
};

const BREAKDOWN_OPTIONS: RevenueBreakdownBy[] = [
  "property",
  "roomType",
  "city",
  "channel",
  "dateRange",
];

interface FinancePanelProps {
  property: Property | null;
  properties: Property[];
}

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  accent?: boolean;
}

function KpiCard({ label, value, subtitle, accent }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] px-4 py-3.5">
      <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--ink-4)]">{label}</div>
      <div className={`mt-1 text-2xl font-bold tracking-tight ${accent ? "text-[var(--m-accent)]" : "text-[var(--ink)]"}`}>
        {value}
      </div>
      {subtitle && (
        <div className="mt-0.5 text-[11px] text-[var(--ink-3)] leading-snug">{subtitle}</div>
      )}
    </div>
  );
}

interface BreakdownRow {
  label: string;
  revenue: string;
  bookings: string;
  occupancy: string;
}

// ponytail: static placeholder rows for dimensions without schema fields yet (roomType, city); upgrade when Property model grows.
function placeholderBreakdownRows(
  breakdownBy: RevenueBreakdownBy,
  properties: Property[],
  c: CopyShape,
): BreakdownRow[] {
  const dash = c.placeholder;
  switch (breakdownBy) {
    case "property":
      if (properties.length === 0) return [{ label: dash, revenue: dash, bookings: dash, occupancy: dash }];
      return properties.map((p) => ({
        label: p.name,
        revenue: dash,
        bookings: dash,
        occupancy: dash,
      }));
    case "roomType":
      return [
        { label: "Studio", revenue: dash, bookings: dash, occupancy: dash },
        { label: "1 BR", revenue: dash, bookings: dash, occupancy: dash },
        { label: "2 BR", revenue: dash, bookings: dash, occupancy: dash },
      ];
    case "city":
      return [
        { label: "—", revenue: dash, bookings: dash, occupancy: dash },
        { label: "—", revenue: dash, bookings: dash, occupancy: dash },
      ];
    case "channel":
      return [
        { label: "Airbnb", revenue: dash, bookings: dash, occupancy: dash },
        { label: "Booking", revenue: dash, bookings: dash, occupancy: dash },
      ];
    case "dateRange":
      return [{ label: c.breakdownDateRange, revenue: dash, bookings: dash, occupancy: dash }];
  }
}

export function FinancePanel({ property, properties }: FinancePanelProps) {
  const { locale } = useI18n();
  const c = COPY[locale];
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [breakdownBy, setBreakdownBy] = useState<RevenueBreakdownBy>("property");

  const isMulti = !property;
  const targetProperties = useMemo(
    () => (property ? [property] : properties),
    [property, properties],
  );

  const headerSubtitle = isMulti
    ? c.portfolioSubtitle(properties.length)
    : c.propertySubtitle(property!.name);

  const breakdownLabel: Record<RevenueBreakdownBy, string> = {
    property: c.breakdownProperty,
    roomType: c.breakdownRoomType,
    city: c.breakdownCity,
    channel: c.breakdownChannel,
    dateRange: c.breakdownDateRange,
  };

  const breakdownRows = useMemo(
    () => placeholderBreakdownRows(breakdownBy, targetProperties, c),
    [breakdownBy, targetProperties, c],
  );

  const dash = c.placeholder;

  return (
    <div className="-mx-3 sm:-mx-6 lg:-mx-8">
      <div className="mx-auto max-w-[1760px] px-3 sm:px-5 flex flex-col lg:flex-row gap-6">
        {properties.length > 1 && (
          <div className="lg:hidden">
            <PropertySwitcher
              properties={properties}
              selectedPropertyId={property?.id ?? null}
              view="finance"
              showAllOption
            />
          </div>
        )}
        <div className="min-w-0 lg:flex-1 space-y-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--ink)]">{c.title}</h1>
            <p className="mt-1 text-xs text-[var(--ink-3)]">{c.subtitle}</p>
            <p className="mt-0.5 text-xs text-[var(--ink-4)]">{headerSubtitle}</p>
          </div>

          <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)]/60 px-3 py-2 text-[11px] text-[var(--ink-3)]">
            {c.placeholderBanner}
          </div>

          {targetProperties.length === 0 ? (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-6 text-center text-xs text-[var(--ink-4)]">
              {c.noProperties}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-end gap-4 rounded-xl border border-[var(--line)] bg-[var(--bg-2)] p-4">
                <div className="space-y-1.5">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
                    {c.dateRange}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-[var(--ink-3)]">
                      <span>{c.fromLabel}</span>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="rounded-md border border-[var(--line)] bg-[var(--bg)] px-2 py-1 text-xs text-[var(--ink)] outline-none focus:border-[var(--m-accent)]"
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-[var(--ink-3)]">
                      <span>{c.toLabel}</span>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="rounded-md border border-[var(--line)] bg-[var(--bg)] px-2 py-1 text-xs text-[var(--ink)] outline-none focus:border-[var(--m-accent)]"
                      />
                    </label>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
                    {c.breakdownBy}
                  </div>
                  <div className="flex flex-wrap gap-1 rounded-lg bg-[var(--bg)] p-0.5 border border-[var(--line)]">
                    {BREAKDOWN_OPTIONS.map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setBreakdownBy(key)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                          breakdownBy === key
                            ? "bg-[var(--m-accent)] text-white"
                            : "text-[var(--ink-3)] hover:text-[var(--ink)]"
                        }`}
                      >
                        {breakdownLabel[key]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <KpiCard label={c.kpiTotalRevenue} value={dash} accent />
                <KpiCard label={c.kpiNetRevenue} value={dash} />
                <KpiCard label={c.kpiProfit} value={dash} />
                <KpiCard label={c.kpiOccupancy} value={dash} />
                <KpiCard label={c.kpiAdr} value={dash} />
                <KpiCard label={c.kpiRevpar} value={dash} />
                <KpiCard label={c.kpiAvgStay} value={dash} />
                <KpiCard label={c.kpiBookingCount} value={dash} />
              </div>

              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-2)] overflow-hidden">
                <div className="border-b border-[var(--line)] px-4 py-3">
                  <h2 className="text-sm font-semibold text-[var(--ink)]">{c.revenueBreakdown}</h2>
                  <p className="mt-0.5 text-[11px] text-[var(--ink-4)]">{breakdownLabel[breakdownBy]}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--line)] text-[var(--ink-4)]">
                        <th className="px-4 py-2.5 font-medium">{c.colGroup}</th>
                        <th className="px-4 py-2.5 font-medium">{c.colRevenue}</th>
                        <th className="px-4 py-2.5 font-medium">{c.colBookings}</th>
                        <th className="px-4 py-2.5 font-medium">{c.colOccupancy}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breakdownRows.map((row, i) => (
                        <tr key={`${row.label}-${i}`} className="border-b border-[var(--line)] last:border-0">
                          <td className="px-4 py-2.5 text-[var(--ink)]">{row.label}</td>
                          <td className="px-4 py-2.5 text-[var(--ink-2)]">{row.revenue}</td>
                          <td className="px-4 py-2.5 text-[var(--ink-2)]">{row.bookings}</td>
                          <td className="px-4 py-2.5 text-[var(--ink-2)]">{row.occupancy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {properties.length > 1 && (
          <aside className="hidden lg:block w-56 shrink-0 space-y-4">
            <PropertySwitcher
              properties={properties}
              selectedPropertyId={property?.id ?? null}
              view="finance"
              showAllOption
            />
          </aside>
        )}
      </div>
    </div>
  );
}

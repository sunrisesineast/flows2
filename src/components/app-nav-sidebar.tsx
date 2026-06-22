"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";
import type { Property } from "@/lib/types";
import type { AppView } from "@/components/top-bar";

interface CopyShape {
  tabDashboard: string;
  tabCalendar: string;
  tabCleaning: string;
  tabReports: string;
  tabProperty: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: {
    tabDashboard: "Dashboard",
    tabCalendar: "Calendar",
    tabCleaning: "Cleaning",
    tabReports: "Reports",
    tabProperty: "Property",
  },
  ru: {
    tabDashboard: "Обзор",
    tabCalendar: "Календарь",
    tabCleaning: "Уборка",
    tabReports: "Отчёты",
    tabProperty: "Объект",
  },
  de: {
    tabDashboard: "Übersicht",
    tabCalendar: "Kalender",
    tabCleaning: "Reinigung",
    tabReports: "Berichte",
    tabProperty: "Objekt",
  },
  fr: {
    tabDashboard: "Tableau de bord",
    tabCalendar: "Calendrier",
    tabCleaning: "Ménage",
    tabReports: "Rapports",
    tabProperty: "Logement",
  },
  es: {
    tabDashboard: "Panel",
    tabCalendar: "Calendario",
    tabCleaning: "Limpieza",
    tabReports: "Informes",
    tabProperty: "Alojamiento",
  },
};

type PrimaryNavView = "dashboard" | "calendar" | "cleaning" | "reports" | "sync";

const NAV_ITEMS: { key: PrimaryNavView; icon: ReactNode }[] = [
  {
    key: "dashboard",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    key: "calendar",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    key: "cleaning",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
  {
    key: "reports",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    key: "sync",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
];

interface AppNavSidebarProps {
  open: boolean;
  onClose: () => void;
  activeView: AppView;
  selectedPropertyId: number | null;
  properties: Property[];
  onChangeView: (view: AppView) => void;
  onNavigate: (params: { property?: number | null; reservation?: number | null; view?: AppView }) => void;
}

export function AppNavSidebar({
  open,
  onClose,
  activeView,
  selectedPropertyId,
  properties,
  onChangeView,
  onNavigate,
}: AppNavSidebarProps) {
  const { locale } = useI18n();
  const c = COPY[locale];

  const labels: Record<PrimaryNavView, string> = {
    dashboard: c.tabDashboard,
    calendar: c.tabCalendar,
    cleaning: c.tabCleaning,
    reports: c.tabReports,
    sync: c.tabProperty,
  };

  const goToTab = (view: PrimaryNavView) => {
    if (view === "dashboard") {
      onNavigate({ property: null, reservation: null, view: "dashboard" });
    } else {
      const requiresProperty = view === "calendar" || view === "sync";
      if (requiresProperty && !selectedPropertyId && properties.length > 0) {
        onNavigate({ property: properties[0].id, view });
      } else {
        onChangeView(view);
      }
    }
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      onClose();
    }
  };

  const primaryViews: PrimaryNavView[] = ["dashboard", "calendar", "cleaning", "reports", "sync"];

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="absolute inset-0 z-20 bg-black/40 lg:hidden"
        />
      )}
      <aside
        className={`absolute inset-y-0 left-0 z-30 shrink-0 overflow-y-auto border-r border-[var(--line)] bg-[var(--bg-2)] transition-[width,transform] duration-300 ease-out lg:relative lg:z-auto ${
          open
            ? "w-64 translate-x-0"
            : "w-64 -translate-x-full lg:w-0 lg:translate-x-0 lg:border-r-0 lg:overflow-hidden"
        }`}
      >
        <nav className="w-64 space-y-0.5 p-3" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active = primaryViews.includes(activeView as PrimaryNavView) && activeView === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => goToTab(item.key)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-[var(--bg-3)] font-medium text-[var(--ink)]"
                    : "text-[var(--ink-2)] hover:bg-[var(--bg-3)]/60 hover:text-[var(--ink)]"
                }`}
              >
                <span className={active ? "text-[var(--m-accent)]" : "text-[var(--ink-4)]"}>
                  {item.icon}
                </span>
                {labels[item.key]}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

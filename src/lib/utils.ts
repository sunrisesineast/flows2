import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const GLASS_ELEVATION =
  "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.04)]"

/** Elevated card surface — scroll-safe (no backdrop-blur). */
export const GLASS_SURFACE =
  `bg-[var(--bg-2)]/95 ring-[var(--line)] ${GLASS_ELEVATION}`

/** Same elevated treatment for bordered divs (no ring). */
export const GLASS_PANEL =
  `border border-[var(--line)] bg-[var(--bg-2)]/95 ${GLASS_ELEVATION}`

/** True glass with backdrop-blur — floating sticky controls only, not scrollable cards. */
export const GLASS_FLOATING =
  "bg-[var(--bg)]/80 backdrop-blur-sm shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12)]"

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Semi-transparent glass panel — matches the "All properties" back button. */
export const GLASS_SURFACE =
  "bg-[var(--bg-2)]/80 backdrop-blur-sm shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12)] ring-[var(--line)]"

/** Same glass treatment for bordered divs (no ring). */
export const GLASS_PANEL =
  "border border-[var(--line)] bg-[var(--bg-2)]/80 backdrop-blur-sm shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12)]"

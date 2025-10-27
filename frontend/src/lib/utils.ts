import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert decimal hours to human-readable format
 * @param hours - Decimal hours (e.g., 9.5)
 * @returns Formatted string (e.g., "9h30" or "35min")
 */
export function formatHoursToHHMM(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);

  // For durations < 1 hour, show only minutes
  if (h === 0) {
    return `${m}min`;
  }

  // For durations >= 1 hour, show "Xh" or "XhYY" format
  if (m === 0) {
    return `${h}h`;
  }

  return `${h}h${m.toString().padStart(2, '0')}`;
}

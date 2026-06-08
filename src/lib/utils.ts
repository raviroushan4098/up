import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { UPEvent, DerivedEventStatus } from "@/types/events";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatInstagramHandle(input: string): string {
  let cleaned = input.trim();
  if (!cleaned) return "";

  // Remove query parameters
  if (cleaned.includes("?")) {
    cleaned = cleaned.split("?")[0];
  }

  // Remove trailing slashes
  cleaned = cleaned.replace(/\/+$/, "");

  // If it's already an instagram URL
  if (cleaned.includes("instagram.com/")) {
    const parts = cleaned.split("instagram.com/");
    const pathPart = parts[parts.length - 1];
    return `https://instagram.com/${pathPart}`;
  }

  // Strip '@' if present for pure usernames
  if (cleaned.startsWith("@")) {
    cleaned = cleaned.substring(1);
  }

  return `https://instagram.com/${cleaned}`;
}

export function parseDateString(
  dateStr: string | undefined,
  isStartOfDay: boolean = false,
): Date | null {
  if (!dateStr) return null;
  try {
    let dateObj: Date;
    // Handle DD/MM/YYYY or DD-MM-YYYY
    if (dateStr.match(/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/)) {
      const parts = dateStr.split(/[/-]/);
      dateObj = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    } else {
      // Fallback to standard JS Date parsing
      dateObj = new Date(dateStr);
    }

    if (isNaN(dateObj.getTime())) return null;

    if (isStartOfDay) {
      dateObj.setHours(0, 0, 0, 0);
    } else {
      dateObj.setHours(23, 59, 59, 999);
    }

    return dateObj;
  } catch {
    return null;
  }
}

export function getDerivedEventStatus(event: UPEvent): DerivedEventStatus {
  if (event.status === "Closed") return "Closed";

  const now = Date.now();

  const startObj = parseDateString(event.startDate, true);
  // Fallback to deadline if endDate is missing
  const endObj = parseDateString(event.endDate || event.deadline, false);

  if (startObj && now < startObj.getTime()) {
    return "Coming Soon";
  }

  if (endObj && now > endObj.getTime()) {
    return "Closed";
  }

  // If there are dates and it passed the checks, or if it's "Open" with missing dates
  return "Open";
}

export function isDeadlinePassed(deadlineStr: string | undefined): boolean {
  const dateObj = parseDateString(deadlineStr, false);
  if (!dateObj) return false;
  return dateObj.getTime() < Date.now();
}

export function formatDateString(
  dateStr: string | undefined,
  formatOpts?: Intl.DateTimeFormatOptions,
): string {
  if (!dateStr) return "TBA";
  const dateObj = parseDateString(dateStr);
  if (!dateObj) return dateStr; // fallback to returning raw string instead of Invalid Date
  return dateObj.toLocaleDateString(
    "en-IN",
    formatOpts || { day: "numeric", month: "short", year: "numeric" },
  );
}

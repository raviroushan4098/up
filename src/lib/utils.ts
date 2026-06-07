import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

export function parseDateString(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  try {
    // Handle DD/MM/YYYY or DD-MM-YYYY
    if (dateStr.match(/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/)) {
      const parts = dateStr.split(/[/-]/);
      const dateObj = new Date(
        Number(parts[2]),
        Number(parts[1]) - 1,
        Number(parts[0]),
        23,
        59,
        59,
      );
      if (isNaN(dateObj.getTime())) return null;
      return dateObj;
    }
    // Fallback to standard JS Date parsing
    const dateObj = new Date(dateStr);
    dateObj.setHours(23, 59, 59);
    if (isNaN(dateObj.getTime())) return null;
    return dateObj;
  } catch {
    return null;
  }
}

export function isDeadlinePassed(deadlineStr: string | undefined): boolean {
  const dateObj = parseDateString(deadlineStr);
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

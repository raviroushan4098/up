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

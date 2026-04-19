import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatProblemTitle(title: string) {
  if (!title) return "";
  
  // If it's already a title (contains spaces and starts with uppercase), return as is
  if (title.includes(" ") && /^[A-Z]/.test(title)) return title;

  // Otherwise, assume it's a slug and format it
  return title
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

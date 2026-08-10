import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPhoneForTel(phone: string): string {
  return phone.replace(/\s/g, "");
}

/**
 * Admin-entered service copy sometimes contains raw Markdown (bold titles,
 * stray asterisks) that isn't rendered by a Markdown engine anywhere in the
 * app — it must be shown as plain text (cards, meta description, JSON-LD).
 */
export function stripMarkdownArtifacts(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/[*_`#]/g, "")
    .trim();
}

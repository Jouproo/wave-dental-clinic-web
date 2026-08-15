/**
 * Single point of contact with the dataLayer. Every tracked interaction on
 * the site goes through trackAnalyticsEvent() — never push to
 * window.dataLayer directly from a component.
 *
 * Privacy: this is a healthcare site. Only the allowlisted parameter keys
 * below can ever be sent. No names, phone numbers, messages, form values,
 * search text, or medical content are accepted by this module's types —
 * so a caller can't accidentally leak them even by copy-pasting more
 * fields into the call.
 */

export type AnalyticsEventName =
  | "page_view"
  | "whatsapp_click"
  | "phone_click"
  | "directions_click"
  | "booking_start"
  | "generate_lead"
  | "service_cta_click"
  | "article_cta_click"
  | "article_read_50"
  | "before_after_interaction"
  | "blog_search";

export interface AnalyticsEventParameters {
  page_location?: string;
  page_path?: string;
  page_title?: string;
  page_type?: string;
  cta_location?: string;
  contact_method?: string;
  result_count?: number;
  scroll_percent?: number;
}

const ALLOWED_KEYS: (keyof AnalyticsEventParameters)[] = [
  "page_location",
  "page_path",
  "page_title",
  "page_type",
  "cta_location",
  "contact_method",
  "result_count",
  "scroll_percent",
];

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

function sanitizeParams(params?: AnalyticsEventParameters): Record<string, unknown> {
  if (!params) return {};
  const clean: Record<string, unknown> = {};
  for (const key of ALLOWED_KEYS) {
    const value = params[key];
    if (value === undefined || value === null || value === "") continue;
    clean[key] = value;
  }
  return clean;
}

/**
 * Pushes a single, allowlisted event to the dataLayer. Safe to call
 * anywhere (server or client) — it's a no-op outside the browser and
 * never throws, so it can never block a click, a link, or navigation.
 */
export function trackAnalyticsEvent(
  eventName: AnalyticsEventName,
  parameters?: AnalyticsEventParameters
): void {
  try {
    if (typeof window === "undefined") return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...sanitizeParams(parameters) });
  } catch {
    // Analytics must never break the product.
  }
}

const PUBLIC_PAGE_TYPES: Record<string, string> = {
  "/": "home",
  "/blog": "blog_index",
};

/** Best-effort, purely structural classification — never inspects content. */
export function derivePageType(pathname: string): string {
  if (PUBLIC_PAGE_TYPES[pathname]) return PUBLIC_PAGE_TYPES[pathname];
  if (pathname.startsWith("/services/")) return "service";
  if (pathname.startsWith("/blog/category/")) return "other_public";
  if (pathname.startsWith("/blog/")) return "blog_article";
  return "other_public";
}

/** GTM/GA4 must never load on admin, API, or auth-gated routes. */
export function isPublicRoute(pathname: string): boolean {
  return !pathname.startsWith("/admin") && !pathname.startsWith("/api");
}

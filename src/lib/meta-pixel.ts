/**
 * Single point of contact with the Meta Pixel (fbq). Every Pixel event on
 * the site goes through trackMetaEvent() — never call window.fbq directly.
 *
 * Privacy: this is a healthcare site. Only the event name, an allowlisted
 * `content_name`, and an eventID can ever be sent. No names, phones,
 * emails, images, or case details — and no Advanced Matching (init is
 * called without user data, and autoConfig is disabled so the Pixel does
 * not scrape button text / form fields on its own).
 */

export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || "1492302586121404";

export type MetaEventName = "PageView" | "ViewContent" | "Lead";

export type MetaContentName = "implant_diagnosis" | "implant_diagnosis_form";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: Fbq;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
    __metaPixelInitialized?: boolean;
  }
}

/**
 * Installs the standard fbq queue stub (same as Meta's base snippet) and
 * calls init exactly once per page load. Calls queue up until fbevents.js
 * (loaded by <MetaPixel />) arrives and drains them.
 */
function ensureFbq(): Fbq | null {
  if (typeof window === "undefined") return null;

  if (!window.fbq) {
    const n = function (...args: unknown[]) {
      if (n.callMethod) n.callMethod(...args);
      else n.queue.push(args);
    } as Fbq;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    window.fbq = n;
    if (!window._fbq) window._fbq = n;
  }

  if (!window.__metaPixelInitialized) {
    window.__metaPixelInitialized = true;
    window.fbq("set", "autoConfig", false, META_PIXEL_ID);
    window.fbq("init", META_PIXEL_ID);
  }

  return window.fbq;
}

/**
 * Sends one Pixel event. Safe to call anywhere — a no-op on the server and
 * never throws, so tracking can never break a form or a navigation.
 */
export function trackMetaEvent(
  eventName: MetaEventName,
  params?: { content_name: MetaContentName },
  eventId?: string
): void {
  try {
    const fbq = ensureFbq();
    if (!fbq) return;
    const customData = params ? { content_name: params.content_name } : undefined;
    if (eventId) fbq("track", eventName, customData ?? {}, { eventID: eventId });
    else if (customData) fbq("track", eventName, customData);
    else fbq("track", eventName);
  } catch {
    // Tracking must never break the product.
  }
}

/** UUID for Pixel ↔ Conversions API deduplication. */
export function newMetaEventId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

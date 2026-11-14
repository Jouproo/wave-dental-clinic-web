/**
 * Links to a lead's existing conversation — the WhatsApp chat and the Meta
 * Business Suite (Messenger / Instagram DM) inbox thread. Staff click them to
 * read the conversation and come back to the CRM.
 *
 * Every link that ends up in an <a href> goes through sanitizeChatUrl(): only
 * http(s) survives, so a crafted spreadsheet cell can't smuggle in a
 * `javascript:` or `data:` URL.
 */

export type ChatLinkKind = "whatsapp" | "meta";

const WHATSAPP_HOSTS = /(^|\.)(wa\.me|whatsapp\.com|whatsapp\.net)$/i;
const META_HOSTS = /(^|\.)(facebook\.com|fb\.com|fb\.me|m\.me|messenger\.com|instagram\.com|ig\.me)$/i;

/** Returns a normalized https?:// URL, or null if the value isn't a safe web link. */
export function sanitizeChatUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let s = raw.trim();
  if (!s || s.length > 2048 || /\s/.test(s)) return null;
  // Sheets often hold links without a scheme: "wa.me/2010…", "www.facebook.com/…", "business.facebook.com/…"
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) {
    if (/^(www\.|wa\.me\/|m\.me\/|business\.facebook\.com|facebook\.com|web\.whatsapp\.com|api\.whatsapp\.com|instagram\.com)/i.test(s)) {
      s = "https://" + s;
    } else {
      return null;
    }
  }
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (!u.hostname.includes(".")) return null;
    return u.href;
  } catch {
    return null;
  }
}

/** Which inbox a link points at, by host — used to auto-map spreadsheet columns full of links. */
export function classifyChatUrl(url: string): ChatLinkKind | null {
  try {
    const host = new URL(url).hostname;
    if (WHATSAPP_HOSTS.test(host)) return "whatsapp";
    if (META_HOSTS.test(host)) return "meta";
  } catch { /* not a URL */ }
  return null;
}

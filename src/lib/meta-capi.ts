/**
 * Server-side Meta Conversions API — sends the same Lead the browser Pixel
 * sends, with the same event_id, so Meta deduplicates the pair.
 *
 * Privacy: no name / phone / email / case details / images, hashed or
 * otherwise. user_data carries only what the browser Pixel itself already
 * sends (IP, user agent, and Meta's own _fbp/_fbc cookies).
 *
 * Silently does nothing if META_CAPI_TOKEN is not set, and never throws —
 * a Meta outage can never break a booking.
 */

const PIXEL_ID =
  process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || "1492302586121404";
const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || "v24.0";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidMetaEventId(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export interface MetaLeadContext {
  eventId: string;
  eventSourceUrl: string;
  clientIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
}

export async function sendMetaLeadEvent(ctx: MetaLeadContext): Promise<void> {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return;

  try {
    const userData: Record<string, string> = {};
    if (ctx.clientIp && ctx.clientIp !== "unknown") userData.client_ip_address = ctx.clientIp;
    if (ctx.userAgent) userData.client_user_agent = ctx.userAgent;
    if (ctx.fbp) userData.fbp = ctx.fbp;
    if (ctx.fbc) userData.fbc = ctx.fbc;

    const payload: Record<string, unknown> = {
      data: [
        {
          event_name: "Lead",
          event_time: Math.floor(Date.now() / 1000),
          event_id: ctx.eventId,
          action_source: "website",
          event_source_url: ctx.eventSourceUrl,
          user_data: userData,
          custom_data: { content_name: "implant_diagnosis_form" },
        },
      ],
    };
    if (process.env.META_CAPI_TEST_EVENT_CODE) {
      payload.test_event_code = process.env.META_CAPI_TEST_EVENT_CODE;
    }

    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!res.ok) {
      console.warn("[meta-capi] Lead not accepted:", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.warn("[meta-capi] Lead send failed:", err instanceof Error ? err.message : err);
  }
}

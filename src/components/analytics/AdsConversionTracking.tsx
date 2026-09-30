"use client";

import { useEffect } from "react";

const SEND_TO = {
  whatsapp: "AW-344801104/HONjCKOnpIgdEND-tKQB",
  phone: "AW-344801104/NCkHCKanpIgdEND-tKQB",
} as const;

type GtagWindow = Window & {
  dataLayer: unknown[];
  gtag?: (...args: unknown[]) => void;
};

function getGtag(): (...args: unknown[]) => void {
  const w = window as unknown as GtagWindow;
  w.dataLayer = w.dataLayer || [];
  if (typeof w.gtag !== "function") {
    w.gtag = (...args: unknown[]) => {
      w.dataLayer.push(args);
    };
  }
  return w.gtag;
}

/**
 * Fires the Google Ads conversion for AW-344801104 on any WhatsApp or tel
 * link click, site-wide. Delegated on document (capture phase) so it also
 * catches links rendered after mount, without depending on each CTA
 * calling it individually.
 */
export default function AdsConversionTracking() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute("href") || "";
      let type: keyof typeof SEND_TO | null = null;
      if (/^tel:/i.test(href)) type = "phone";
      else if (/wa\.me|api\.whatsapp\.com|whatsapp:\/\//i.test(href)) type = "whatsapp";
      if (!type) return;
      getGtag()("event", "conversion", { send_to: SEND_TO[type] });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}

"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackAnalyticsEvent, derivePageType } from "@/lib/analytics";

/**
 * Pushes exactly one page_view per real navigation. The GTM container is
 * configured with send_page_view=false, so this is the site's only
 * source of page_view events.
 *
 * Dedup: keyed off the pathname itself (not a mount counter), so React
 * Strict Mode's dev-only double-invoke and any unrelated rerender of this
 * component never produce a second push for the same path.
 */
export default function AnalyticsPageView() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    // Next.js commits the <title> update around the same paint as this
    // effect; a rAF hop lets it land before we read document.title.
    const raf = requestAnimationFrame(() => {
      trackAnalyticsEvent("page_view", {
        page_location: `${window.location.origin}${pathname}`,
        page_path: pathname,
        page_title: document.title,
        page_type: derivePageType(pathname),
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
}

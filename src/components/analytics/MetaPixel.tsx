"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { META_PIXEL_ID, trackMetaEvent } from "@/lib/meta-pixel";

/**
 * Loads the Meta Pixel once and sends exactly one PageView per client-side
 * route change. `init` lives in trackMetaEvent's one-time guard, so it is
 * never repeated across navigations. Mounted from AnalyticsProvider, which
 * already keeps it off /admin and /api.
 */
export default function MetaPixel() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    // Keyed on pathname so Strict Mode's double effect or an unrelated
    // re-render never produces a second PageView for the same route.
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;
    trackMetaEvent("PageView");
  }, [pathname]);

  return (
    <>
      <Script
        id="meta-pixel-fbevents"
        src="https://connect.facebook.net/en_US/fbevents.js"
        strategy="afterInteractive"
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element -- Meta's standard 1x1 noscript beacon */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}

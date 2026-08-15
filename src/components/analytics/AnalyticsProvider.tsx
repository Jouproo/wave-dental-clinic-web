"use client";

import { usePathname } from "next/navigation";
import { GoogleTagManager } from "@next/third-parties/google";
import { isPublicRoute } from "@/lib/analytics";
import AnalyticsPageView from "./AnalyticsPageView";

/**
 * The only place GTM gets mounted. The project has a single root layout
 * shared by the public site and /admin, so this is a client-side gate on
 * the pathname rather than a separate public layout — per requirement,
 * GTM is not loaded at all on private routes, not loaded-then-skipped.
 */
export default function AnalyticsProvider() {
  const pathname = usePathname();
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  if (!gtmId || !isPublicRoute(pathname)) return null;

  return (
    <>
      <GoogleTagManager gtmId={gtmId} />
      {/* Standard GTM noscript fallback — the official component only
          injects the <script>, not this part. */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="gtm"
        />
      </noscript>
      <AnalyticsPageView />
    </>
  );
}

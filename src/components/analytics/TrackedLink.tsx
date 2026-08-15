"use client";

import type { AnchorHTMLAttributes } from "react";
import { trackAnalyticsEvent, type AnalyticsEventName, type AnalyticsEventParameters } from "@/lib/analytics";

interface TrackedLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  event: AnalyticsEventName;
  eventParams?: AnalyticsEventParameters;
}

/**
 * A drop-in replacement for a plain <a> that also fires one analytics
 * event on click — for the handful of shared components that are server
 * components (Footer, MobileStickyBar, service/article pages) and don't
 * otherwise need to be client components. Every prop (href, target, rel,
 * className, children, aria-*, onClick, ...) passes straight through
 * unchanged; this only adds the tracking call.
 */
export default function TrackedLink({ event, eventParams, onClick, ...anchorProps }: TrackedLinkProps) {
  return (
    <a
      {...anchorProps}
      onClick={(e) => {
        trackAnalyticsEvent(event, eventParams);
        onClick?.(e);
      }}
    />
  );
}

"use client";

import { useEffect, useRef } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics";

export default function ArticleReadTracker({ targetId }: { targetId: string }) {
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    let ticking = false;

    function checkProgress() {
      ticking = false;
      if (firedRef.current) return;
      const el = document.getElementById(targetId);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.height <= 0) return;
      const scrolledPastTop = window.innerHeight - rect.top;
      const percent = scrolledPastTop / rect.height;
      if (percent >= 0.5) {
        firedRef.current = true;
        trackAnalyticsEvent("article_read_50", { scroll_percent: 50 });
        window.removeEventListener("scroll", onScroll);
      }
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(checkProgress);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    checkProgress();
    return () => window.removeEventListener("scroll", onScroll);
  }, [targetId]);

  return null;
}

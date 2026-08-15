"use client";

import { useEffect } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics";

export default function BlogSearchTracker({
  searchQuery,
  resultCount,
}: {
  searchQuery?: string;
  resultCount: number;
}) {
  useEffect(() => {
    if (!searchQuery || !searchQuery.trim()) return;
    trackAnalyticsEvent("blog_search", { result_count: resultCount });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  return null;
}

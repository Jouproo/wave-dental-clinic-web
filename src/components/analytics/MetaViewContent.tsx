"use client";

import { useEffect, useRef } from "react";
import { trackMetaEvent, type MetaContentName } from "@/lib/meta-pixel";

/** Fires a single Meta ViewContent when the page it's placed on opens. */
export default function MetaViewContent({ contentName }: { contentName: MetaContentName }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackMetaEvent("ViewContent", { content_name: contentName });
  }, [contentName]);

  return null;
}

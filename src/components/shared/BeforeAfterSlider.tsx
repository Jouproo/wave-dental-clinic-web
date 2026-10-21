"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { MoveHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeAfterSliderProps {
  before: string;
  after: string;
  beforeAlt: string;
  afterAlt: string;
  className?: string;
  aspect?: string;
}

export default function BeforeAfterSlider({
  before,
  after,
  beforeAlt,
  afterAlt,
  className,
  aspect = "aspect-[4/5]",
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl select-none touch-none bg-slate-100 group",
        aspect,
        className
      )}
      onMouseDown={(e) => { setDragging(true); updateFromClientX(e.clientX); }}
      onMouseMove={(e) => { if (dragging) updateFromClientX(e.clientX); }}
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}
      onTouchStart={(e) => updateFromClientX(e.touches[0].clientX)}
      onTouchMove={(e) => updateFromClientX(e.touches[0].clientX)}
    >
      {/* After — full width, base layer */}
      <div className="absolute inset-0">
        <Image src={after} alt={afterAlt} fill sizes="(max-width: 768px) 100vw, 480px" className="object-cover pointer-events-none" />
        <span className="absolute bottom-2.5 left-2.5 bg-brand-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">بعد</span>
      </div>

      {/* Before — clipped by slider position (physical clip-path, independent of RTL direction) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <Image src={before} alt={beforeAlt} fill sizes="(max-width: 768px) 100vw, 480px" className="object-cover pointer-events-none" />
        <span className="absolute bottom-2.5 right-2.5 bg-black/60 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">قبل</span>
      </div>

      {/* Handle */}
      <div
        className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.1)] pointer-events-none"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center text-ink-700">
          <MoveHorizontal className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

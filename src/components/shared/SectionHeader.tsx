"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  badge?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
  light?: boolean;
  className?: string;
}

export default function SectionHeader({
  badge,
  title,
  subtitle,
  centered = true,
  light = false,
  className,
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={cn(
        "mb-10 md:mb-14",
        centered && "text-center",
        className
      )}
    >
      {badge && (
        <span
          className={cn(
            "inline-flex items-center gap-2 text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full mb-4 tracking-wide",
            light
              ? "bg-white/10 text-white border border-white/20"
              : "bg-brand-50 text-brand-700 border border-brand-100"
          )}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              light ? "bg-brand-300" : "bg-brand-500"
            )}
          />
          {badge}
        </span>
      )}
      <h2
        className={cn(
          "text-[1.9rem] sm:text-4xl md:text-[2.75rem] font-black leading-[1.15] tracking-tight mb-4",
          light ? "text-white" : "text-ink-900"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "text-base md:text-lg max-w-2xl leading-relaxed",
            centered && "mx-auto",
            light ? "text-white/75" : "text-ink-500"
          )}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

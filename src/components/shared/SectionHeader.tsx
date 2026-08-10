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
        "mb-8 md:mb-12",
        centered && "text-center",
        className
      )}
    >
      {badge && (
        <span
          className={cn(
            "inline-block text-sm font-semibold px-4 py-1.5 rounded-full mb-4",
            light
              ? "bg-white/20 text-white"
              : "bg-blue-100 text-blue-700"
          )}
        >
          {badge}
        </span>
      )}
      <h2
        className={cn(
          "text-3xl md:text-4xl font-bold leading-tight mb-4",
          light ? "text-white" : "text-slate-800"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "text-lg max-w-2xl leading-relaxed",
            centered && "mx-auto",
            light ? "text-white/80" : "text-slate-500"
          )}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

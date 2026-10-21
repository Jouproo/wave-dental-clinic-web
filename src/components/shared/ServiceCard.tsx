"use client";

import { motion } from "framer-motion";
import {
  Smile, Zap, Star, Sparkles, Shield, Layers, Droplets, Heart,
  Activity, Aperture, Award, Crown, Cross, Anchor,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { Service } from "@/data/services";

const iconMap: Record<string, LucideIcon> = {
  Smile, Zap, Star, Sparkles, Shield, Layers, Droplets, Heart,
  Activity, Aperture, Award, Crown, Cross, Anchor,
};

interface ServiceCardProps {
  service: Service;
  index: number;
}

export default function ServiceCard({ service, index }: ServiceCardProps) {
  const Icon = iconMap[service.icon] ?? Smile;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      whileHover={{ y: -6 }}
      className="h-full"
    >
      <Link
        href={`/services/${service.id}`}
        className="group relative flex h-full flex-col bg-white rounded-[1.75rem] p-6 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.08)] hover:shadow-[0_20px_40px_-12px_rgba(22,114,214,0.25)] hover:border-brand-200 transition-all duration-300 overflow-hidden"
      >
        <span className="absolute top-5 left-5 text-5xl font-black text-slate-50 group-hover:text-brand-50 transition-colors select-none" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div
          aria-hidden="true"
          className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center mb-5 group-hover:from-brand-600 group-hover:to-brand-400 group-hover:shadow-lg group-hover:shadow-brand-500/30 transition-all duration-300"
        >
          <Icon className="w-7 h-7 text-brand-600 group-hover:text-white transition-colors duration-300" />
        </div>

        <h3 className="relative z-10 text-lg md:text-xl font-bold leading-7 text-ink-900 mb-2">
          {service.title}
        </h3>
        <p className="relative z-10 text-sm md:text-base leading-7 text-ink-500">
          {service.description}
        </p>

        <span className="relative z-10 mt-auto pt-5 text-sm font-bold text-brand-600 flex items-center gap-1.5">
          <span>تفاصيل الخدمة</span>
          <span className="group-hover:-translate-x-1.5 transition-transform duration-200" aria-hidden="true">←</span>
        </span>
      </Link>
    </motion.article>
  );
}

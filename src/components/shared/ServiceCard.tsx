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
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -6 }}
      className="h-full"
    >
      <Link
        href={`/services/${service.id}`}
        className="group flex h-full flex-col bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300"
      >
        <div
          aria-hidden="true"
          className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-sky-100 flex items-center justify-center mb-4 group-hover:from-blue-500 group-hover:to-sky-500 transition-all duration-300"
        >
          <Icon className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
        </div>

        <h3 className="text-lg md:text-xl font-bold leading-7 text-slate-800 mb-2">
          {service.title}
        </h3>
        <p className="text-sm md:text-base leading-7 text-slate-500">
          {service.description}
        </p>

        <span className="mt-auto pt-4 text-sm font-semibold text-blue-600 flex items-center gap-1">
          <span>تفاصيل الخدمة</span>
          <span className="group-hover:-translate-x-1 transition-transform duration-200" aria-hidden="true">←</span>
        </span>
      </Link>
    </motion.article>
  );
}

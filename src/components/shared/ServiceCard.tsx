"use client";

import { motion } from "framer-motion";
import {
  Smile, Zap, Star, Sparkles, Shield, Layers, Droplets, Heart,
  Activity, Aperture, Award,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { Service } from "@/data/services";

const iconMap: Record<string, LucideIcon> = {
  Smile, Zap, Star, Sparkles, Shield, Layers, Droplets, Heart,
  Activity, Aperture, Award,
};

interface ServiceCardProps {
  service: Service;
  index: number;
}

export default function ServiceCard({ service, index }: ServiceCardProps) {
  const Icon = iconMap[service.icon] ?? Smile;

  return (
    <Link href={`/services/${service.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.08 }}
        whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(13,148,136,0.12)" }}
        className="group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:border-blue-200 transition-all duration-300 flex flex-col cursor-pointer"
      >
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-sky-100 flex items-center justify-center mb-4 group-hover:from-blue-500 group-hover:to-sky-500 transition-all duration-300">
          <Icon className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-2">{service.title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-4">
          {service.description}
        </p>

        <span className="text-blue-600 text-sm font-semibold flex items-center gap-1 group/link">
          <span>{service.shortCta ?? service.short_cta ?? "اعرف أكثر"}</span>
          <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
        </span>
      </motion.div>
    </Link>
  );
}

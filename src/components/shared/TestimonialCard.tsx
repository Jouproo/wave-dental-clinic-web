"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import type { Testimonial } from "@/data/testimonials";

interface TestimonialCardProps {
  testimonial: Testimonial;
  index: number;
}

export default function TestimonialCard({ testimonial, index }: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="relative bg-white rounded-[1.75rem] p-6 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.07)] border border-slate-100 hover:shadow-[0_20px_36px_-12px_rgba(15,23,42,0.14)] hover:border-brand-200 transition-all duration-300 flex flex-col h-full"
    >
      <Quote className="absolute top-5 left-6 w-10 h-10 text-brand-50 fill-brand-50" aria-hidden="true" />

      {/* Stars */}
      <div className="flex gap-0.5 mb-3 relative z-10">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
        ))}
      </div>

      <p className="text-ink-600 text-[0.95rem] leading-relaxed flex-1 mb-5 relative z-10">{testimonial.text}</p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {testimonial.avatar}
        </div>
        <div>
          <p className="font-bold text-ink-900 text-sm">{testimonial.name}</p>
          <p className="text-xs text-brand-600 font-medium">{testimonial.treatment}</p>
        </div>
      </div>
    </motion.div>
  );
}

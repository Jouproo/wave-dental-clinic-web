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
      className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300 flex flex-col"
    >
      {/* Quote icon */}
      <Quote className="w-8 h-8 text-blue-200 mb-3 flex-shrink-0" />

      {/* Stars */}
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
        ))}
      </div>

      <p className="text-slate-600 text-sm leading-relaxed flex-1 mb-4">{testimonial.text}</p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-sky-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {testimonial.avatar}
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-sm">{testimonial.name}</p>
          <p className="text-xs text-blue-600">{testimonial.treatment}</p>
        </div>
      </div>
    </motion.div>
  );
}

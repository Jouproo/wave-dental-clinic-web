"use client";

import { motion } from "framer-motion";
import { AlertCircle, ImageOff } from "lucide-react";
import Link from "next/link";
import SectionHeader from "@/components/shared/SectionHeader";
import BeforeAfterSlider from "@/components/shared/BeforeAfterSlider";

export interface ResultCase {
  id: string;
  serviceId: string;
  serviceTitle: string;
  before: string;
  after: string;
  caption: string;
}

export default function ResultsClient({ cases }: { cases: ResultCase[] }) {
  return (
    <section id="results" className="py-16 md:py-20 lg:py-28 bg-mist-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="نتائج حقيقية"
          title="حالات علاجية من عيادتنا"
          subtitle="حرّك المؤشر على الصورة لمشاهدة الفرق بين قبل وبعد. كل حالة فريدة وتتطلب تقييمًا خاصًا."
        />

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-10 max-w-2xl mx-auto text-center"
        >
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">
            <strong>تنبيه هام:</strong> النتائج تختلف من حالة لأخرى بعد الكشف والتقييم.
            لا يمكن ضمان نفس النتيجة لكل مريض.
          </p>
        </motion.div>

        {cases.length === 0 ? (
          <div className="flex flex-col items-center text-center gap-3 py-12 border border-dashed border-slate-200 rounded-2xl bg-white">
            <ImageOff className="w-10 h-10 text-slate-300" />
            <p className="text-ink-500 text-sm max-w-md">
              يتم تحديث معرض الحالات الحقيقية أولًا بأول من لوحة تحكم العيادة.
              تصفح صفحات الخدمات لمشاهدة صور قبل وبعد الخاصة بكل علاج.
            </p>
          </div>
        ) : (
          <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 sm:overflow-visible sm:mx-0 sm:px-0 sm:pb-0">
            {cases.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="min-w-[78%] sm:min-w-0 snap-start bg-white rounded-[1.5rem] overflow-hidden border border-slate-100 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.08)] hover:shadow-[0_20px_36px_-12px_rgba(15,23,42,0.18)] transition-all duration-300"
              >
                <BeforeAfterSlider
                  before={c.before}
                  after={c.after}
                  beforeAlt={`قبل — ${c.serviceTitle}`}
                  afterAlt={`بعد — ${c.serviceTitle}`}
                  aspect="aspect-[4/5]"
                  className="rounded-none"
                />

                <Link href={`/services/${c.serviceId}`} className="block p-4">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700">
                    {c.serviceTitle}
                  </span>
                  {c.caption && (
                    <p className="text-ink-500 text-xs leading-relaxed mt-2">{c.caption}</p>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

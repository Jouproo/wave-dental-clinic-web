"use client";

import { motion } from "framer-motion";
import { AlertCircle, ImageOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import SectionHeader from "@/components/shared/SectionHeader";

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
    <section id="results" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="نتائج حقيقية"
          title="حالات علاجية من عيادتنا"
          subtitle="إليك عينة من الحالات التي عالجناها بنجاح. كل حالة فريدة وتتطلب تقييمًا خاصًا."
        />

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-10 max-w-2xl mx-auto text-center"
        >
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">
            <strong>تنبيه هام:</strong> النتائج تختلف من حالة لأخرى بعد الكشف والتقييم.
            لا يمكن ضمان نفس النتيجة لكل مريض.
          </p>
        </motion.div>

        {cases.length === 0 ? (
          <div className="flex flex-col items-center text-center gap-3 py-12 border border-dashed border-slate-200 rounded-2xl">
            <ImageOff className="w-10 h-10 text-slate-300" />
            <p className="text-slate-500 text-sm max-w-md">
              يتم تحديث معرض الحالات الحقيقية أولًا بأول من لوحة تحكم العيادة.
              تصفح صفحات الخدمات لمشاهدة صور قبل وبعد الخاصة بكل علاج.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cases.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-md hover:shadow-xl transition-all duration-300"
              >
                <Link href={`/services/${c.serviceId}`} className="block">
                  <div className="relative h-44 flex">
                    <div className="relative flex-1">
                      <Image
                        src={c.before}
                        alt={`قبل — ${c.serviceTitle}`}
                        fill
                        sizes="(max-width: 640px) 50vw, 12vw"
                        className="object-cover"
                      />
                      <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                        قبل
                      </span>
                    </div>
                    <div className="relative flex-1">
                      <Image
                        src={c.after}
                        alt={`بعد — ${c.serviceTitle}`}
                        fill
                        sizes="(max-width: 640px) 50vw, 12vw"
                        className="object-cover"
                      />
                      <span className="absolute bottom-1.5 left-1.5 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                        بعد
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="p-4">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                    {c.serviceTitle}
                  </span>
                  {c.caption && (
                    <p className="text-slate-500 text-xs leading-relaxed mt-2">{c.caption}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

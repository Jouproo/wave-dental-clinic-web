"use client";

import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import SectionHeader from "@/components/shared/SectionHeader";

const cases = [
  {
    id: 1,
    treatment: "هوليوود سمايل",
    description: "تركيب قشور بورسلين لتغيير شكل ولون الأسنان بالكامل",
    tag: "تجميل الأسنان",
    tagColor: "bg-blue-100 text-blue-700",
  },
  {
    id: 2,
    treatment: "تقويم الأسنان",
    description: "تقويم شفاف لمدة 18 شهر مع نتائج دقيقة وجمالية",
    tag: "تقويم",
    tagColor: "bg-blue-100 text-blue-700",
  },
  {
    id: 3,
    treatment: "زراعة الأسنان",
    description: "زراعة سن مفقود بغرسة تيتانيوم وتاج خزفي طبيعي",
    tag: "زراعة",
    tagColor: "bg-amber-100 text-amber-700",
  },
  {
    id: 4,
    treatment: "تبييض الأسنان",
    description: "جلسة تبييض بالليزر مع نتائج فورية في ساعة واحدة",
    tag: "تبييض",
    tagColor: "bg-purple-100 text-purple-700",
  },
];

export default function ResultsSection() {
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
              {/* Before/After placeholder */}
              <div className="relative h-44 bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center">
                {/* Before section */}
                <div className="absolute inset-0 flex">
                  <div className="flex-1 bg-slate-200 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-4xl">🦷</span>
                      <p className="text-xs text-slate-400 mt-1 font-medium">قبل</p>
                    </div>
                  </div>
                  {/* Divider */}
                  <div className="w-0.5 bg-white relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center z-10">
                      <div className="w-4 h-0.5 bg-slate-300" />
                    </div>
                  </div>
                  {/* After section */}
                  <div className="flex-1 bg-gradient-to-br from-blue-50 to-sky-50 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-4xl">😁</span>
                      <p className="text-xs text-blue-600 mt-1 font-medium">بعد</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.tagColor}`}>
                  {c.tag}
                </span>
                <h3 className="font-bold text-slate-800 mt-2 mb-1">{c.treatment}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{c.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

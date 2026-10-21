"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Anchor, Sparkles, ArrowLeft } from "lucide-react";

export default function ImplantDiagnosisPromoSection() {
  return (
    <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 bg-mist-50">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative max-w-5xl mx-auto bg-gradient-to-br from-ink-900 via-brand-900 to-ink-900 bg-noise rounded-[1.75rem] overflow-hidden p-6 sm:p-8 md:p-10"
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="animate-aurora absolute -top-16 -right-16 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl" />
          <div className="animate-aurora absolute -bottom-16 -left-16 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl [animation-delay:3s]" />
        </div>

        <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <div className="w-16 h-16 glass-dark rounded-2xl flex items-center justify-center flex-shrink-0">
            <Anchor className="w-8 h-8 text-brand-300" />
          </div>

          <div className="flex-1 text-center md:text-right">
            <span className="inline-flex items-center gap-2 glass-dark text-white/90 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              عرض مجاني لفترة محدودة
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
              تشخيص زراعة الأسنان مجانًا أونلاين
            </h2>
            <p className="text-white/70 leading-relaxed max-w-xl">
              ابعتلنا صور الأشعة وبياناتك، وهيراجعها دكتور متخصص ويرد عليك بتقييم أولي لحالتك خلال 24-48 ساعة — من غير ما تحتاج تيجي العيادة.
            </p>
          </div>

          <Link
            href="/implant-diagnosis"
            className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-l from-brand-600 to-brand-400 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-brand-600/30 hover:shadow-xl transition-shadow whitespace-nowrap"
          >
            احصل على تشخيصك
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

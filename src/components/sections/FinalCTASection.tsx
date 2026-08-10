"use client";

import { motion } from "framer-motion";
import { MessageCircle, MapPin, CalendarCheck, Sparkles } from "lucide-react";
import { clinicConfig } from "@/config/clinic";
import { makeWhatsAppUrl, defaultSettings } from "@/lib/clinic-settings";
import type { DbClinicSettings } from "@/types/admin";

interface FinalCTASectionProps {
  settings?: DbClinicSettings;
}

export default function FinalCTASection({ settings = defaultSettings }: FinalCTASectionProps) {
  const whatsappUrl = makeWhatsAppUrl(settings.whatsapp || clinicConfig.whatsappNumber);
  const mapsUrl = settings.google_maps_direction_url || clinicConfig.googleMapsDirectionUrl;
  const bookingUrl = clinicConfig.bookingUrl || whatsappUrl;

  return (
    <section className="py-14 md:py-20 lg:py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            ابدأ رحلتك اليوم
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
            جاهز تبدأ{" "}
            <span className="bg-gradient-to-l from-blue-300 to-sky-300 bg-clip-text text-transparent">
              رحلة ابتسامتك؟
            </span>
          </h2>

          <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            لا تأجل قرار صحة أسنانك. فريقنا جاهز لمساعدتك الآن وتقديم أفضل تجربة علاجية تستحقها.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <motion.a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center justify-center gap-2 bg-gradient-to-l from-green-600 to-green-500 text-white font-black px-8 py-4 rounded-xl shadow-lg shadow-green-900/30 hover:shadow-green-900/50 transition-shadow text-base"
            >
              <MessageCircle className="w-5 h-5" />
              تواصل عبر واتساب
            </motion.a>

            <motion.a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center justify-center gap-2 bg-white/10 border border-white/25 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/20 transition-colors"
            >
              <MapPin className="w-5 h-5" />
              موقعنا
            </motion.a>

            <motion.a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center justify-center gap-2 bg-gradient-to-l from-blue-500 to-sky-500 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 transition-shadow"
            >
              <CalendarCheck className="w-5 h-5" />
              احجز موعد
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

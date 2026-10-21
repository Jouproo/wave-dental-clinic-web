"use client";

import { motion } from "framer-motion";
import { MessageCircle, MapPin, CalendarCheck, Sparkles } from "lucide-react";
import { clinicConfig } from "@/config/clinic";
import { makeWhatsAppUrl, defaultSettings } from "@/lib/clinic-settings";
import type { DbClinicSettings } from "@/types/admin";
import { trackAnalyticsEvent } from "@/lib/analytics";

interface FinalCTASectionProps {
  settings?: DbClinicSettings;
}

export default function FinalCTASection({ settings = defaultSettings }: FinalCTASectionProps) {
  const whatsappUrl = makeWhatsAppUrl(settings.whatsapp || clinicConfig.whatsappNumber);
  const mapsUrl = settings.google_maps_direction_url || clinicConfig.googleMapsDirectionUrl;
  const isExternalBooking = Boolean(clinicConfig.bookingUrl);
  const bookingUrl = clinicConfig.bookingUrl || whatsappUrl;
  const bookingOpensInNewTab = bookingUrl.startsWith("http");

  return (
    <section className="py-16 md:py-20 lg:py-28 bg-ink-900 relative overflow-hidden bg-noise">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-brand-900 to-ink-900" />
        <div className="animate-aurora absolute top-0 right-1/4 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl" />
        <div className="animate-aurora absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl [animation-delay:3s]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 glass-dark text-white/80 text-sm font-semibold px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            ابدأ رحلتك اليوم
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight tracking-tight">
            جاهز تبدأ{" "}
            <span className="text-gradient-brand">
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
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => trackAnalyticsEvent("whatsapp_click", { contact_method: "whatsapp", cta_location: "final_cta", page_type: "home" })}
              className="flex items-center justify-center gap-2 bg-gradient-to-l from-green-600 to-[#25D366] text-white font-black px-8 py-4 rounded-2xl shadow-lg shadow-green-900/30 hover:shadow-xl hover:shadow-green-900/40 transition-shadow text-base"
            >
              <MessageCircle className="w-5 h-5" />
              تواصل عبر واتساب
            </motion.a>

            <motion.a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => trackAnalyticsEvent("directions_click", { contact_method: "maps", cta_location: "final_cta", page_type: "home" })}
              className="flex items-center justify-center gap-2 glass-dark text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/15 transition-colors"
            >
              <MapPin className="w-5 h-5" />
              موقعنا
            </motion.a>

            <motion.a
              href={bookingUrl}
              target={bookingOpensInNewTab ? "_blank" : undefined}
              rel={bookingOpensInNewTab ? "noopener noreferrer" : undefined}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() =>
                isExternalBooking
                  ? trackAnalyticsEvent("booking_start", { cta_location: "final_cta", page_type: "home" })
                  : trackAnalyticsEvent("whatsapp_click", { contact_method: "whatsapp", cta_location: "final_cta", page_type: "home" })
              }
              className="flex items-center justify-center gap-2 bg-gradient-to-l from-brand-600 to-brand-400 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg shadow-brand-900/30 hover:shadow-xl hover:shadow-brand-900/40 transition-shadow"
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

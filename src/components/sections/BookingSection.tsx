"use client";

import { motion } from "framer-motion";
import { CalendarCheck, MessageCircle } from "lucide-react";
import { clinicConfig } from "@/config/clinic";
import { makeWhatsAppUrl, defaultSettings } from "@/lib/clinic-settings";
import type { DbClinicSettings } from "@/types/admin";
import { trackAnalyticsEvent } from "@/lib/analytics";

interface BookingSectionProps {
  settings?: DbClinicSettings;
}

export default function BookingSection({ settings = defaultSettings }: BookingSectionProps) {
  const whatsappUrl = makeWhatsAppUrl(settings.whatsapp || clinicConfig.whatsappNumber);
  const isExternalBooking = Boolean(clinicConfig.bookingUrl);
  const primaryBookingUrl = clinicConfig.bookingUrl || whatsappUrl;
  // "External" here means "not the WhatsApp fallback" — the booking URL
  // itself may be an internal page (e.g. /book), which should open in the
  // same tab rather than a new one.
  const primaryOpensInNewTab = primaryBookingUrl.startsWith("http");

  return (
    <section id="booking" className="py-16 md:py-20 lg:py-28 bg-gradient-to-br from-brand-700 to-brand-500 relative overflow-hidden bg-noise">
      <div className="absolute inset-0 pointer-events-none">
        <div className="animate-aurora absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="animate-aurora absolute -bottom-20 -left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl [animation-delay:3s]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 glass-dark rounded-2xl mb-6 mx-auto">
            <CalendarCheck className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">احجز موعدك الآن</h2>
          <p className="text-white/80 text-lg mb-8 leading-relaxed">
            {isExternalBooking
              ? "احجز موعدك بسهولة عبر نظام الحجز الإلكتروني الخاص بنا."
              : "تواصل معنا عبر واتساب وسنحجز لك موعدًا في أقرب وقت مناسب لك."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.a
              href={primaryBookingUrl}
              target={primaryOpensInNewTab ? "_blank" : undefined}
              rel={primaryOpensInNewTab ? "noopener noreferrer" : undefined}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() =>
                isExternalBooking
                  ? trackAnalyticsEvent("booking_start", { cta_location: "booking_section", page_type: "home" })
                  : trackAnalyticsEvent("whatsapp_click", { contact_method: "whatsapp", cta_location: "booking_section", page_type: "home" })
              }
              className="flex items-center justify-center gap-2 bg-white text-brand-700 font-black px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow text-lg"
            >
              {isExternalBooking ? (
                <><CalendarCheck className="w-5 h-5" />احجز موعدك الآن</>
              ) : (
                <><MessageCircle className="w-5 h-5" />احجز عبر واتساب</>
              )}
            </motion.a>

            {isExternalBooking && (
              <motion.a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => trackAnalyticsEvent("whatsapp_click", { contact_method: "whatsapp", cta_location: "booking_section", page_type: "home" })}
                className="flex items-center justify-center gap-2 bg-gradient-to-l from-green-600 to-[#25D366] text-white font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <MessageCircle className="w-5 h-5" />
                أو تواصل واتساب
              </motion.a>
            )}
          </div>

          <p className="text-white/60 text-sm mt-6">* نرد على رسائل الواتساب خلال دقائق أيام العمل</p>
        </motion.div>
      </div>
    </section>
  );
}

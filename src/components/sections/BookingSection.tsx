"use client";

import { motion } from "framer-motion";
import { CalendarCheck, MessageCircle } from "lucide-react";
import { getBookingUrl, getWhatsAppUrl, clinicConfig } from "@/config/clinic";

export default function BookingSection() {
  // When bookingUrl is set in config, it points to external booking system.
  // Otherwise falls back to WhatsApp.
  const primaryBookingUrl = getBookingUrl();
  const isExternalBooking = Boolean(clinicConfig.bookingUrl);

  return (
    <section id="booking" className="py-24 bg-gradient-to-br from-teal-600 to-cyan-600 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6 mx-auto">
            <CalendarCheck className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            احجز موعدك الآن
          </h2>
          <p className="text-white/80 text-lg mb-8 leading-relaxed">
            {isExternalBooking
              ? "احجز موعدك بسهولة عبر نظام الحجز الإلكتروني الخاص بنا."
              : "تواصل معنا عبر واتساب وسنحجز لك موعدًا في أقرب وقت مناسب لك."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.a
              href={primaryBookingUrl}
              target={isExternalBooking ? "_blank" : "_blank"}
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center justify-center gap-2 bg-white text-teal-700 font-black px-8 py-4 rounded-xl shadow-xl hover:bg-teal-50 transition-colors text-lg"
            >
              {isExternalBooking ? (
                <>
                  <CalendarCheck className="w-5 h-5" />
                  احجز موعدك الآن
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5" />
                  احجز عبر واتساب
                </>
              )}
            </motion.a>

            {isExternalBooking && (
              <motion.a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center justify-center gap-2 bg-green-500 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:bg-green-600 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                أو تواصل واتساب
              </motion.a>
            )}
          </div>

          <p className="text-white/60 text-sm mt-6">
            * نرد على رسائل الواتساب خلال دقائق أيام العمل
          </p>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { MapPin, Phone, MessageCircle, Navigation, Clock } from "lucide-react";
import SectionHeader from "@/components/shared/SectionHeader";
import { clinicConfig, getWhatsAppUrl } from "@/config/clinic";

export default function LocationSection() {
  return (
    <section id="location" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="موقعنا"
          title="تعال زورنا — نحن قريبون منك"
          subtitle="يمكنك الوصول إلينا بسهولة أو التواصل معنا مباشرة."
        />

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-2xl overflow-hidden shadow-xl border border-slate-100 bg-slate-100"
            style={{ height: 380 }}
          >
            {clinicConfig.googleMapsEmbedUrl ? (
              <iframe
                src={clinicConfig.googleMapsEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="موقع العيادة على خرائط جوجل"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-teal-50 text-slate-400">
                <MapPin className="w-16 h-16 mb-3 text-teal-300" />
                <p className="font-medium text-slate-500">سيتم تحديث موقع العيادة قريبًا</p>
                <p className="text-sm text-slate-400 mt-1">{clinicConfig.address}</p>
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="flex flex-col gap-5"
          >
            {/* Address card */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-5 border border-teal-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">عنوان العيادة</h3>
                  <p className="text-slate-600 text-sm">{clinicConfig.address}</p>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">مواعيد العمل</h3>
                  <p className="text-slate-600 text-sm">{clinicConfig.workingHours}</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <a
                href={clinicConfig.googleMapsDirectionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-gradient-to-l from-teal-600 to-cyan-500 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <Navigation className="w-5 h-5" />
                افتح الموقع على Google Maps
              </a>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`tel:${clinicConfig.phoneNumber}`}
                  className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  اتصل بنا
                </a>
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 font-semibold py-3 rounded-xl transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  واتساب
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

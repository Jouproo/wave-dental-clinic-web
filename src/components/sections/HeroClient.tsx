"use client";

import { motion } from "framer-motion";
import { MessageCircle, MapPin, CheckCircle, Sparkles } from "lucide-react";
import { clinicConfig } from "@/config/clinic";
import { makeWhatsAppUrl, defaultSettings } from "@/lib/clinic-settings";
import type { DbClinicSettings } from "@/types/admin";
import Image from "next/image";

const trustPoints = [
  { icon: CheckCircle, label: "أطباء متخصصون" },
  { icon: CheckCircle, label: "أجهزة حديثة" },
  { icon: CheckCircle, label: "تعقيم طبي" },
  { icon: CheckCircle, label: "حجز سهل" },
];

const floatingCards = [
  { emoji: "😁", title: "هوليوود سمايل", sub: "نتائج مضمونة" },
  { emoji: "🦷", title: "زراعة الأسنان", sub: "تقنية متطورة" },
  { emoji: "✨", title: "تبييض فوري", sub: "بياض ناصع" },
];

interface HeroClientProps {
  heroImageUrl: string | null;
  settings?: DbClinicSettings;
}

export default function HeroClient({ heroImageUrl, settings = defaultSettings }: HeroClientProps) {
  const whatsappUrl = makeWhatsAppUrl(settings.whatsapp || clinicConfig.whatsappNumber);
  const mapsUrl = settings.google_maps_direction_url || clinicConfig.googleMapsDirectionUrl;
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left: Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium px-4 py-2 rounded-full mb-6"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>عيادة أسنان متميزة ومتخصصة</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6"
            >
              ابتسامتك تبدأ من{" "}
              <span className="bg-gradient-to-l from-blue-300 to-sky-300 bg-clip-text text-transparent">
                عيادة تهتم
              </span>{" "}
              بكل تفصيلة
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-lg text-white/70 leading-relaxed mb-8 max-w-xl"
            >
              خدمات أسنان متكاملة بتجربة مريحة، أطباء متخصصين، وتجهيزات حديثة
              تساعدك تاخد القرار بثقة.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-col sm:flex-row gap-3 mb-10"
            >
              <motion.a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center justify-center gap-2 bg-gradient-to-l from-green-600 to-green-500 text-white font-bold px-7 py-4 rounded-xl shadow-lg shadow-green-900/30 hover:shadow-green-900/50 transition-shadow text-base"
              >
                <MessageCircle className="w-5 h-5" />
                احجز عبر واتساب
              </motion.a>

              <motion.a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/25 text-white font-semibold px-7 py-4 rounded-xl hover:bg-white/20 transition-colors text-base"
              >
                <MapPin className="w-5 h-5" />
                اعرف موقع العيادة
              </motion.a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap gap-4"
            >
              {trustPoints.map((pt) => (
                <div key={pt.label} className="flex items-center gap-1.5 text-white/70 text-sm">
                  <pt.icon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>{pt.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Visual */}
          <div className="hidden lg:flex flex-col items-center gap-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
              className="relative w-full max-w-sm"
            >
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl">
                <div className="w-full aspect-square max-w-xs mx-auto flex items-center justify-center relative">
                  {heroImageUrl ? (
                    /* Dynamic hero image from admin */
                    <div className="w-full h-full rounded-2xl overflow-hidden relative shadow-2xl">
                      <Image
                        src={heroImageUrl}
                        alt={`${clinicConfig.clinicName} — عيادة أسنان في 6 أكتوبر`}
                        fill
                        sizes="(max-width: 1024px) 90vw, 400px"
                        className="object-cover"
                        priority
                      />
                      <div className="absolute inset-0 bg-blue-900/20 rounded-2xl" />
                    </div>
                  ) : (
                    /* Default tooth icon visualization */
                    <>
                      <div className="w-40 h-40 bg-gradient-to-br from-blue-400 to-sky-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/40">
                        <span className="text-7xl">🦷</span>
                      </div>
                      {floatingCards.map((card, i) => {
                        const angles = [330, 90, 210];
                        const angle = (angles[i] * Math.PI) / 180;
                        const r = 110;
                        const x = Math.cos(angle) * r;
                        const y = Math.sin(angle) * r;
                        return (
                          <motion.div
                            key={card.title}
                            animate={{ y: [y - 5, y + 5, y - 5] }}
                            transition={{ repeat: Infinity, duration: 3 + i, ease: "easeInOut" }}
                            style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-2xl px-3 py-2 text-center min-w-[90px] shadow-lg"
                          >
                            <div className="text-2xl mb-0.5">{card.emoji}</div>
                            <div className="text-white text-xs font-semibold">{card.title}</div>
                            <div className="text-white/60 text-[10px]">{card.sub}</div>
                          </motion.div>
                        );
                      })}
                    </>
                  )}
                </div>

                <div className="flex justify-around mt-6 pt-6 border-t border-white/10">
                  {[
                    { num: "+500", label: "مريض" },
                    { num: "+10", label: "سنة خبرة" },
                    { num: "100%", label: "تعقيم طبي" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="text-2xl font-black text-white">{stat.num}</div>
                      <div className="text-white/50 text-xs">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-12 fill-white">
          <path d="M0,60 C360,0 1080,60 1440,0 L1440,60 Z" />
        </svg>
      </div>
    </section>
  );
}

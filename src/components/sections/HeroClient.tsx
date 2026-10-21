"use client";

import { motion } from "framer-motion";
import { MessageCircle, MapPin, CheckCircle2, Sparkles, ChevronDown, Star } from "lucide-react";
import { clinicConfig } from "@/config/clinic";
import { makeWhatsAppUrl, defaultSettings } from "@/lib/clinic-settings";
import type { DbClinicSettings } from "@/types/admin";
import Image from "next/image";
import { trackAnalyticsEvent } from "@/lib/analytics";

const trustPoints = [
  { icon: CheckCircle2, label: "أطباء متخصصون" },
  { icon: CheckCircle2, label: "أجهزة حديثة" },
  { icon: CheckCircle2, label: "تعقيم طبي" },
  { icon: CheckCircle2, label: "حجز سهل" },
];

const floatingCards = [
  { emoji: "😁", title: "هوليوود سمايل", sub: "نتائج مضمونة" },
  { emoji: "🦷", title: "زراعة الأسنان", sub: "تقنية متطورة" },
  { emoji: "✨", title: "تبييض فوري", sub: "بياض ناصع" },
];

const heroStats = [
  { num: "+500", label: "مريض سعيد" },
  { num: "+10", label: "سنة خبرة" },
  { num: "100%", label: "تعقيم طبي" },
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
      className="relative min-h-[100vh] flex items-center overflow-hidden bg-ink-900"
    >
      {/* Aurora mesh background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-brand-900 to-ink-900" />
        <div className="animate-aurora absolute -top-40 -right-32 w-[32rem] h-[32rem] bg-brand-500/25 rounded-full blur-3xl" />
        <div className="animate-aurora absolute -bottom-40 -left-32 w-[32rem] h-[32rem] bg-cyan-400/15 rounded-full blur-3xl [animation-delay:3s]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-brand-600/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>
      <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 lg:pt-32 lg:pb-24 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left: Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 glass-dark text-white/90 text-sm font-semibold px-4 py-2 rounded-full mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span>عيادة أسنان متميزة ومتخصصة في 6 أكتوبر</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-[2.6rem] sm:text-5xl lg:text-[4rem] font-black text-white leading-[1.08] tracking-tight mb-6"
            >
              ابتسامتك تبدأ من{" "}
              <span className="text-gradient-brand">عيادة تهتم</span>{" "}
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
              className="flex flex-col sm:flex-row gap-3 mb-8"
            >
              <motion.a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => trackAnalyticsEvent("whatsapp_click", { contact_method: "whatsapp", cta_location: "hero", page_type: "home" })}
                className="flex items-center justify-center gap-2 bg-gradient-to-l from-green-600 to-[#25D366] text-white font-bold px-7 py-4 rounded-2xl shadow-xl shadow-green-900/30 hover:shadow-green-900/50 transition-shadow text-base"
              >
                <MessageCircle className="w-5 h-5" />
                احجز عبر واتساب
              </motion.a>

              <motion.a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => trackAnalyticsEvent("directions_click", { contact_method: "maps", cta_location: "hero", page_type: "home" })}
                className="flex items-center justify-center gap-2 glass-dark text-white font-semibold px-7 py-4 rounded-2xl hover:bg-white/15 transition-colors text-base"
              >
                <MapPin className="w-5 h-5" />
                اعرف موقع العيادة
              </motion.a>
            </motion.div>

            {/* Mobile-visible compact stat strip (desktop keeps the full stat card on the right) */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="lg:hidden flex items-center gap-3 glass-dark rounded-2xl px-4 py-3.5 mb-8"
            >
              {heroStats.map((s, i) => (
                <div key={s.label} className={`flex-1 text-center ${i !== 0 ? "border-r border-white/10" : ""}`}>
                  <div className="text-lg font-black text-white">{s.num}</div>
                  <div className="text-white/50 text-[11px]">{s.label}</div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4"
            >
              {trustPoints.map((pt) => (
                <div key={pt.label} className="flex items-center gap-1.5 text-white/70 text-sm">
                  <pt.icon className="w-4 h-4 text-brand-300 flex-shrink-0" />
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
              <div className="glass-dark rounded-[2rem] p-8 shadow-2xl relative">
                {/* Floating rating badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
                  animate={{ opacity: 1, scale: 1, rotate: -6 }}
                  transition={{ delay: 1, type: "spring" }}
                  className="absolute -top-5 -right-5 bg-white rounded-2xl px-3.5 py-2.5 shadow-xl flex items-center gap-1.5 z-20"
                >
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-ink-900 font-bold text-sm">4.9</span>
                </motion.div>

                <div className="w-full max-w-xs mx-auto flex items-center justify-center relative">
                  {heroImageUrl ? (
                    // Real admin-uploaded photos are near-4:5 portrait crops;
                    // a square box here would crop into the subject, so this
                    // branch gets its own taller aspect instead of the
                    // fallback's aspect-square (which the orbiting icon
                    // layout below is positioned around).
                    <div className="relative w-full aspect-[4/5] rounded-[1.5rem] overflow-hidden shadow-2xl">
                      <Image
                        src={heroImageUrl}
                        alt={`${clinicConfig.clinicName} — عيادة أسنان في 6 أكتوبر`}
                        fill
                        sizes="(max-width: 1024px) 90vw, 400px"
                        className="object-cover"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-900/30 via-transparent to-transparent rounded-[1.5rem]" />
                    </div>
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center relative">
                      <div className="w-40 h-40 bg-gradient-to-br from-brand-400 to-brand-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-brand-500/40">
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
                    </div>
                  )}
                </div>

                <div className="flex justify-around mt-6 pt-6 border-t border-white/10">
                  {heroStats.map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="text-2xl font-black text-white">{stat.num}</div>
                      <div className="text-white/50 text-xs">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="flex items-center gap-2 text-white/50 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-300" />
              <span>بياناتنا الحقيقية مُحدَّثة من لوحة تحكم العيادة</span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="hidden sm:flex absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex-col items-center gap-1 text-white/40"
      >
        <span className="text-[11px] font-medium">اعرف أكتر</span>
        <ChevronDown className="w-4 h-4 animate-soft-bounce" />
      </motion.div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-12 fill-white">
          <path d="M0,60 C360,0 1080,60 1440,0 L1440,60 Z" />
        </svg>
      </div>
    </section>
  );
}

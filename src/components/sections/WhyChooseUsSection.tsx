"use client";

import { motion } from "framer-motion";
import { Award, ClipboardList, ShieldCheck, Cpu, MessageCircle, Heart } from "lucide-react";
import { clinicConfig } from "@/config/clinic";
import { makeWhatsAppUrl, defaultSettings } from "@/lib/clinic-settings";
import type { DbClinicSettings } from "@/types/admin";
import { trackAnalyticsEvent } from "@/lib/analytics";

const benefits = [
  {
    icon: Award,
    title: "أطباء متخصصون",
    description: "فريق طبي مؤهل بخبرات سنوات في مختلف تخصصات طب الأسنان.",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    icon: ClipboardList,
    title: "خطة علاج واضحة",
    description: "نشرح لك الحالة بالتفصيل ونضع خطة علاج شاملة قبل البدء.",
    color: "text-brand-600",
    bg: "bg-brand-50",
  },
  {
    icon: ShieldCheck,
    title: "تعقيم واهتمام بالتفاصيل",
    description: "نتبع أعلى معايير التعقيم الطبي الدولية لضمان سلامتك.",
    color: "text-brand-600",
    bg: "bg-brand-50",
  },
  {
    icon: Cpu,
    title: "أجهزة حديثة",
    description: "نستخدم أحدث تقنيات الفحص والعلاج لأفضل النتائج.",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    icon: MessageCircle,
    title: "متابعة بعد الزيارة",
    description: "لا تنتهي خدمتنا عند خروجك، نتابع معك حتى الشفاء التام.",
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    icon: Heart,
    title: "تجربة مريحة بدون توتر",
    description: "نحرص على راحتك النفسية وتخفيف القلق في كل خطوة.",
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
];

interface WhyChooseUsSectionProps {
  settings?: DbClinicSettings;
}

export default function WhyChooseUsSection({ settings = defaultSettings }: WhyChooseUsSectionProps) {
  const whatsappUrl = makeWhatsAppUrl(settings.whatsapp || clinicConfig.whatsappNumber);

  return (
    <section id="why-us" className="py-16 md:py-20 lg:py-28 bg-mist-50 bg-dot-grid relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              لماذا تختارنا؟
            </span>
            <h2 className="text-[1.9rem] sm:text-4xl font-black text-ink-900 leading-[1.15] tracking-tight mb-5">
              نحن لا نعالج فقط —{" "}
              <span className="text-brand-600">نبني ثقتك</span>
            </h2>
            <p className="text-ink-500 leading-relaxed mb-8 text-lg">
              عيادتنا ليست مجرد مكان للعلاج، هي تجربة متكاملة تبدأ من الاستقبال
              وتنتهي بابتسامتك. نؤمن أن كل مريض يستحق اهتمامًا شخصيًا وخطة
              علاج مخصصة.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mb-8">
              {[
                { num: "+500", label: "مريض سعيد" },
                { num: "+10", label: "سنة خبرة" },
                { num: "3", label: "أطباء متخصصون" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl font-black text-brand-600">{s.num}</div>
                  <div className="text-ink-500 text-sm">{s.label}</div>
                </div>
              ))}
            </div>

            <motion.a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => trackAnalyticsEvent("whatsapp_click", { contact_method: "whatsapp", cta_location: "why_us_section", page_type: "home" })}
              className="inline-flex items-center gap-2 bg-gradient-to-l from-brand-600 to-brand-400 text-white font-bold px-7 py-4 rounded-2xl shadow-lg shadow-brand-600/25 hover:shadow-xl hover:shadow-brand-600/40 transition-shadow"
            >
              احجز موعدك الآن
            </motion.a>
          </motion.div>

          {/* Right: Benefit Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -5 }}
                className="bg-white rounded-[1.5rem] p-5 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(15,23,42,0.06)] hover:shadow-[0_16px_30px_-10px_rgba(15,23,42,0.14)] transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl ${benefit.bg} flex items-center justify-center mb-3`}>
                  <benefit.icon className={`w-5 h-5 ${benefit.color}`} />
                </div>
                <h3 className="font-bold text-ink-900 mb-1.5">{benefit.title}</h3>
                <p className="text-ink-500 text-sm leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

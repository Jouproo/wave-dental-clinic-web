"use client";

import { motion } from "framer-motion";
import { Award, ClipboardList, ShieldCheck, Cpu, MessageCircle, Heart } from "lucide-react";
import SectionHeader from "@/components/shared/SectionHeader";
import { clinicConfig } from "@/config/clinic";
import { makeWhatsAppUrl, defaultSettings } from "@/lib/clinic-settings";
import type { DbClinicSettings } from "@/types/admin";

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
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: ShieldCheck,
    title: "تعقيم واهتمام بالتفاصيل",
    description: "نتبع أعلى معايير التعقيم الطبي الدولية لضمان سلامتك.",
    color: "text-blue-500",
    bg: "bg-blue-50",
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
    <section id="why-us" className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block text-sm font-semibold px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 mb-4">
              لماذا تختارنا؟
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 leading-tight mb-5">
              نحن لا نعالج فقط —{" "}
              <span className="text-blue-600">نبني ثقتك</span>
            </h2>
            <p className="text-slate-500 leading-relaxed mb-8 text-lg">
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
                  <div className="text-3xl font-black text-blue-600">{s.num}</div>
                  <div className="text-slate-500 text-sm">{s.label}</div>
                </div>
              ))}
            </div>

            <motion.a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 bg-gradient-to-l from-blue-600 to-sky-500 text-white font-bold px-7 py-4 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow"
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
                whileHover={{ y: -4, boxShadow: "0 10px 30px rgba(0,0,0,0.08)" }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm transition-all duration-300"
              >
                <div className={`w-10 h-10 rounded-xl ${benefit.bg} flex items-center justify-center mb-3`}>
                  <benefit.icon className={`w-5 h-5 ${benefit.color}`} />
                </div>
                <h3 className="font-bold text-slate-800 mb-1.5">{benefit.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

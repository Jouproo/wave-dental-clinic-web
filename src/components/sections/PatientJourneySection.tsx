"use client";

import { motion } from "framer-motion";
import {
  MessageCircle,
  CalendarCheck,
  Stethoscope,
  ClipboardList,
  HeartHandshake,
} from "lucide-react";
import SectionHeader from "@/components/shared/SectionHeader";

const steps = [
  {
    step: "01",
    icon: MessageCircle,
    title: "تواصل معنا",
    description: "تواصل معنا عبر واتساب أو اتصل بنا لمعرفة المزيد عن خدماتنا وحجز موعد.",
    color: "from-blue-500 to-sky-500",
  },
  {
    step: "02",
    icon: CalendarCheck,
    title: "احجز موعدك",
    description: "اختر الوقت المناسب لك من جدول مواعيدنا المرن وخصص موعدك بكل سهولة.",
    color: "from-blue-500 to-sky-500",
  },
  {
    step: "03",
    icon: Stethoscope,
    title: "كشف وتقييم",
    description: "يقوم الطبيب بفحص شامل للأسنان وتقييم حالتك بدقة باستخدام أحدث الأجهزة.",
    color: "from-violet-500 to-blue-500",
  },
  {
    step: "04",
    icon: ClipboardList,
    title: "خطة علاج واضحة",
    description: "تحصل على خطة علاج مفصلة تشمل التكلفة والمدة الزمنية قبل البدء في أي إجراء.",
    color: "from-amber-500 to-orange-500",
  },
  {
    step: "05",
    icon: HeartHandshake,
    title: "متابعة بعد العلاج",
    description: "لا تنتهي رحلتنا عند انتهاء العلاج، نتابع معك للتأكد من راحتك ونتيجة العلاج.",
    color: "from-green-500 to-blue-500",
  },
];

export default function PatientJourneySection() {
  return (
    <section id="journey" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="تجربتك معنا"
          title="رحلتك من أول خطوة لآخر ابتسامة"
          subtitle="نحرص على أن تكون كل خطوة في رحلتك معنا واضحة ومريحة وخالية من المفاجآت."
        />

        {/* Desktop timeline */}
        <div className="hidden md:flex items-start gap-0 relative">
          {/* Connecting line */}
          <div className="absolute top-10 right-[10%] left-[10%] h-0.5 bg-gradient-to-l from-blue-200 to-blue-500 z-0" />

          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="flex-1 flex flex-col items-center text-center px-3 relative z-10"
            >
              {/* Icon bubble */}
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg mb-4`}>
                <step.icon className="w-9 h-9 text-white" />
              </div>

              <div className="text-xs font-bold text-slate-400 mb-1">{step.step}</div>
              <h3 className="font-bold text-slate-800 text-base mb-2">{step.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Mobile vertical timeline */}
        <div className="md:hidden flex flex-col gap-0 relative">
          {/* Vertical line */}
          <div className="absolute top-5 bottom-5 right-9 w-0.5 bg-gradient-to-b from-blue-500 to-blue-200 z-0" />

          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex gap-5 relative z-10 mb-8"
            >
              {/* Icon */}
              <div className={`w-[72px] h-[72px] flex-shrink-0 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-md`}>
                <step.icon className="w-8 h-8 text-white" />
              </div>

              {/* Text */}
              <div className="pt-2">
                <div className="text-xs font-bold text-slate-400 mb-0.5">{step.step}</div>
                <h3 className="font-bold text-slate-800 mb-1">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

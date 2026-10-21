import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingWhatsAppButton from "@/components/shared/FloatingWhatsAppButton";
import MobileStickyBar from "@/components/shared/MobileStickyBar";
import BookingForm from "@/components/booking/BookingForm";
import { getClinicSettings } from "@/lib/clinic-settings";
import { clinicConfig } from "@/config/clinic";
import { Anchor, Sparkles, ShieldCheck, MessagesSquare, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "تشخيص زراعة الأسنان مجانًا أونلاين",
  description: `احصل على تقييم أولي مجاني لحالة زراعة الأسنان من أطباء ${clinicConfig.clinicName} أونلاين، من غير ما تحتاج تيجي العيادة.`,
  alternates: { canonical: "/implant-diagnosis" },
  robots: { index: true, follow: true },
};

const benefits = [
  { icon: Sparkles, title: "مجانًا بالكامل", desc: "التشخيص الأولي من غير أي تكلفة." },
  { icon: Clock, title: "أونلاين وسريع", desc: "ابعت بياناتك والأشعة من مكانك، من غير زيارة." },
  { icon: ShieldCheck, title: "مراجعة طبيب متخصص", desc: "د. أحمد أبو النصر وفريقه بيراجعوا كل حالة بدقة." },
  { icon: MessagesSquare, title: "رد خلال 24-48 ساعة", desc: "هنتواصل معاك بنتيجة التقييم الأولي عبر واتساب." },
];

export default async function ImplantDiagnosisPage() {
  const settings = await getClinicSettings();

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header settings={settings} />

      <main className="pb-[88px] md:pb-0">
        <section className="relative bg-ink-900 bg-noise pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-brand-900 to-ink-900" />
            <div className="animate-aurora absolute -top-24 -right-24 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl" />
            <div className="animate-aurora absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl [animation-delay:3s]" />
          </div>
          <div className="relative max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 glass-dark text-white/90 text-sm font-bold px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-amber-400" />
              عرض مجاني لفترة محدودة
            </span>
            <div className="w-16 h-16 glass-dark rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Anchor className="w-8 h-8 text-brand-300" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
              تشخيص زراعة الأسنان{" "}
              <span className="text-gradient-brand">مجانًا أونلاين</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed max-w-xl mx-auto">
              ابعتلنا بياناتك وصور الأشعة، وهيراجعها دكتور متخصص ويديك تقييم أولي لحالتك — من غير ما تحتاج تيجي العيادة.
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-white">
          <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-4">
            {benefits.map((b) => (
              <div key={b.title} className="flex items-start gap-3 bg-mist-50 rounded-2xl p-4">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <b.icon className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-bold text-ink-900 text-sm mb-0.5">{b.title}</h3>
                  <p className="text-ink-500 text-xs leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-12 sm:pb-16 px-4 bg-white">
          <div className="max-w-2xl mx-auto">
            <BookingForm mode="implant_diagnosis" />
          </div>
        </section>

        <section className="px-4 pb-12 bg-white">
          <p className="max-w-2xl mx-auto text-xs text-ink-500/80 leading-relaxed text-center">
            هذا التقييم الأولي لا يغني عن الكشف الطبي المباشر، وهدفه مساعدتك تاخد فكرة مبدئية عن حالتك قبل زيارة العيادة.
            القرار العلاجي النهائي بيتحدد بعد فحص سريري وأشعة تفصيلية في العيادة.
          </p>
        </section>
      </main>

      <Footer settings={settings} pageType="implant_diagnosis" />
      <FloatingWhatsAppButton whatsapp={settings.whatsapp} />
      <MobileStickyBar settings={settings} pageType="implant_diagnosis" />
    </div>
  );
}

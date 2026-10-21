import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingWhatsAppButton from "@/components/shared/FloatingWhatsAppButton";
import MobileStickyBar from "@/components/shared/MobileStickyBar";
import BookingForm from "@/components/booking/BookingForm";
import { getClinicSettings } from "@/lib/clinic-settings";
import { services as staticServices } from "@/data/services";
import { supabaseServer } from "@/lib/supabase";
import { clinicConfig } from "@/config/clinic";
import { CalendarCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "احجز موعدك أونلاين",
  description: `احجز موعدك في ${clinicConfig.clinicName} أونلاين في أقل من دقيقة، وهنتواصل معاك لتأكيد الموعد.`,
  alternates: { canonical: "/book" },
  robots: { index: true, follow: true },
};

async function getActiveServices(): Promise<{ id: string; title: string }[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return staticServices.map((s) => ({ id: s.id, title: s.title }));
    }
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from("services")
      .select("id, title")
      .eq("status", "active")
      .order("display_order", { ascending: true });
    if (error || !data || data.length === 0) {
      return staticServices.map((s) => ({ id: s.id, title: s.title }));
    }
    return data;
  } catch {
    return staticServices.map((s) => ({ id: s.id, title: s.title }));
  }
}

export default async function BookPage() {
  const [settings, services] = await Promise.all([getClinicSettings(), getActiveServices()]);

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header settings={settings} />

      <main className="pb-[88px] md:pb-0">
        <section className="relative bg-ink-900 bg-noise pt-28 sm:pt-32 pb-14 sm:pb-16 px-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-brand-900 to-ink-900" />
            <div className="animate-aurora absolute -top-24 -right-24 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl" />
            <div className="animate-aurora absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl [animation-delay:3s]" />
          </div>
          <div className="relative max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 glass-dark rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CalendarCheck className="w-8 h-8 text-brand-300" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight leading-tight">احجز موعدك أونلاين</h1>
            <p className="text-white/70 text-lg leading-relaxed">
              املأ بياناتك وهيتواصل معاك فريق العيادة لتأكيد الموعد في أقرب وقت.
            </p>
          </div>
        </section>

        <section className="py-12 sm:py-16 px-4 bg-mist-50">
          <div className="max-w-2xl mx-auto">
            <BookingForm mode="appointment" services={services} />
          </div>
        </section>
      </main>

      <Footer settings={settings} pageType="booking" />
      <FloatingWhatsAppButton whatsapp={settings.whatsapp} />
      <MobileStickyBar settings={settings} pageType="booking" />
    </div>
  );
}

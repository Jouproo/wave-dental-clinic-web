export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import { services as staticServices } from "@/data/services";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingWhatsAppButton from "@/components/shared/FloatingWhatsAppButton";
import { getClinicSettings, makeWhatsAppUrl } from "@/lib/clinic-settings";
import Image from "next/image";
import Link from "next/link";
import {
  Smile, Zap, Star, Sparkles, Shield, Layers, Droplets, Heart,
  Activity, Aperture, Award, MessageCircle, ArrowRight,
  type LucideIcon,
} from "lucide-react";
import type { DbGallery } from "@/types/admin";

const iconMap: Record<string, LucideIcon> = {
  Smile, Zap, Star, Sparkles, Shield, Layers, Droplets, Heart,
  Activity, Aperture, Award,
};

async function getServiceData(id: string) {
  try {
    const supabase = supabaseServer();
    const [svcRes, galRes] = await Promise.all([
      supabase.from("services").select("*").eq("id", id).single(),
      supabase.from("gallery").select("*").eq("service_id", id).order("display_order", { ascending: true }),
    ]);
    if (!svcRes.error && svcRes.data) {
      return { service: svcRes.data, gallery: galRes.data ?? [] };
    }
  } catch {
    // fallback
  }

  // Fallback to static data
  const staticService = staticServices.find((s) => s.id === id);
  if (!staticService) return null;
  return {
    service: {
      ...staticService,
      short_cta: staticService.shortCta,
      detail_description: "",
      status: "active" as const,
      display_order: 0,
      created_at: "",
    },
    gallery: [] as DbGallery[],
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, settings] = await Promise.all([getServiceData(id), getClinicSettings()]);
  if (!data) notFound();

  const { service, gallery } = data;
  const Icon = iconMap[service.icon] ?? Smile;

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header settings={settings} />

      <main className="pt-24">
        {/* Hero banner */}
        <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
              <Icon className="w-8 h-8 text-blue-300" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-4">{service.title}</h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">{service.description}</p>
          </div>
        </section>

        {/* Detail description */}
        {service.detail_description && (
          <section className="py-16 px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">عن هذه الخدمة</h2>
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
                {service.detail_description}
              </div>
            </div>
          </section>
        )}

        {/* Before/After Gallery */}
        {gallery.length > 0 && (
          <section className="py-16 px-4 bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <span className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-3">
                  نتائج حقيقية
                </span>
                <h2 className="text-2xl font-bold text-slate-800">صور قبل وبعد</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {gallery.map((item) => (
                  <GalleryCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-3">هل أنت مهتم بهذه الخدمة؟</h2>
            <p className="text-slate-500 mb-8">تواصل معنا الآن لحجز موعد أو الاستفسار عن التفاصيل</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={makeWhatsAppUrl(settings.whatsapp, `أريد الاستفسار عن خدمة ${service.title}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3.5 rounded-xl transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                احجز عبر واتساب
              </a>
              <Link
                href="/#services"
                className="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-6 py-3.5 rounded-xl transition-colors border border-blue-200"
              >
                <ArrowRight className="w-4 h-4" />
                تصفح خدمات أخرى
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer settings={settings} />
      <FloatingWhatsAppButton whatsapp={settings.whatsapp} />
    </div>
  );
}

function GalleryCard({ item }: { item: DbGallery }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-slate-100">
      <div className="grid grid-cols-2">
        <div className="relative aspect-square bg-gray-100">
          {item.before_image_url ? (
            <Image src={item.before_image_url} alt="قبل" fill className="object-cover" unoptimized />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">—</div>
          )}
          <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">قبل</span>
        </div>
        <div className="relative aspect-square bg-gray-100">
          {item.after_image_url ? (
            <Image src={item.after_image_url} alt="بعد" fill className="object-cover" unoptimized />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">—</div>
          )}
          <span className="absolute top-2 right-2 bg-blue-600/80 text-white text-xs px-2 py-0.5 rounded-full">بعد</span>
        </div>
      </div>
      {item.caption && (
        <div className="px-4 py-3">
          <p className="text-sm text-slate-600">{item.caption}</p>
        </div>
      )}
    </div>
  );
}

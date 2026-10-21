export const revalidate = 300;

export function generateStaticParams() {
  return staticServices.map((s) => ({ id: s.id }));
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase";
import { services as staticServices } from "@/data/services";
import { clinicConfig } from "@/config/clinic";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingWhatsAppButton from "@/components/shared/FloatingWhatsAppButton";
import MobileStickyBar from "@/components/shared/MobileStickyBar";
import BeforeAfterSlider from "@/components/shared/BeforeAfterSlider";
import TrackedLink from "@/components/analytics/TrackedLink";
import { getClinicSettings, makeWhatsAppUrl } from "@/lib/clinic-settings";
import Link from "next/link";
import {
  Smile, Zap, Star, Sparkles, Shield, Layers, Droplets, Heart,
  Activity, Aperture, Award, Crown, Cross, Anchor,
  MessageCircle, ArrowRight, ChevronLeft, ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { DbGallery } from "@/types/admin";
import { stripMarkdownArtifacts } from "@/lib/utils";

const iconMap: Record<string, LucideIcon> = {
  Smile, Zap, Star, Sparkles, Shield, Layers, Droplets, Heart,
  Activity, Aperture, Award, Crown, Cross, Anchor,
};

async function getServiceData(id: string) {
  try {
    const supabase = supabaseServer();
    const [svcRes, galRes] = await Promise.all([
      supabase.from("services").select("*").eq("id", id).single(),
      supabase.from("gallery").select("*").eq("service_id", id).order("display_order", { ascending: true }),
    ]);
    if (!svcRes.error && svcRes.data) {
      return {
        service: {
          ...svcRes.data,
          description: stripMarkdownArtifacts(svcRes.data.description),
          detail_description: stripMarkdownArtifacts(svcRes.data.detail_description),
        },
        gallery: galRes.data ?? [],
      };
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getServiceData(id);
  if (!data) return {};

  const { service } = data;
  const title = `${service.title} في 6 أكتوبر | ${clinicConfig.clinicName}`;
  const description =
    service.detail_description?.slice(0, 155) ||
    service.description ||
    clinicConfig.seo.description;
  const url = `${clinicConfig.seo.url}/services/${id}`;

  return {
    title,
    description,
    alternates: { canonical: `/services/${id}` },
    openGraph: {
      title,
      description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

function ServiceJsonLd({
  service,
  id,
}: {
  service: { title: string; description: string };
  id: string;
}) {
  const url = `${clinicConfig.seo.url}/services/${id}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalProcedure",
        name: service.title,
        description: service.description,
        url,
        provider: { "@id": `${clinicConfig.seo.url}/#clinic` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "الرئيسية", item: clinicConfig.seo.url },
          { "@type": "ListItem", position: 2, name: "خدماتنا", item: `${clinicConfig.seo.url}/#services` },
          { "@type": "ListItem", position: 3, name: service.title, item: url },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, settings] = await Promise.all([getServiceData(id), getClinicSettings()]);
  if (!data) notFound();

  const { service, gallery } = data;
  const Icon = iconMap[service.icon] ?? Smile;

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <ServiceJsonLd service={service} id={id} />
      <Header settings={settings} />

      <main className="pb-[88px] md:pb-0">
        {/* Hero banner */}
        <section className="relative bg-ink-900 bg-noise pt-28 sm:pt-32 pb-14 sm:pb-16 px-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-brand-900 to-ink-900" />
            <div className="animate-aurora absolute -top-24 -right-24 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl" />
            <div className="animate-aurora absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl [animation-delay:3s]" />
          </div>

          <div className="relative max-w-4xl mx-auto text-center">
            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="mb-6 flex justify-center">
              <ol className="flex items-center gap-1.5 flex-wrap text-xs sm:text-sm text-white/50 glass-dark rounded-full px-4 py-2">
                <li><Link href="/" className="hover:text-white transition-colors">الرئيسية</Link></li>
                <li aria-hidden="true"><ChevronLeft className="w-3.5 h-3.5" /></li>
                <li><Link href="/#services" className="hover:text-white transition-colors">خدماتنا</Link></li>
                <li aria-hidden="true"><ChevronLeft className="w-3.5 h-3.5" /></li>
                <li aria-current="page" className="text-white font-medium">{service.title}</li>
              </ol>
            </nav>

            <div className="w-16 h-16 glass-dark rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Icon className="w-8 h-8 text-brand-300" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight leading-tight">{service.title}</h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">{service.description}</p>

            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <TrackedLink
                event="whatsapp_click"
                eventParams={{ cta_location: "service_hero", page_type: "service" }}
                href={makeWhatsAppUrl(settings.whatsapp, `أريد الاستفسار عن خدمة ${service.title}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-gradient-to-l from-green-600 to-[#25D366] text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-green-900/30 hover:shadow-xl hover:shadow-green-900/40 transition-shadow"
              >
                <MessageCircle className="w-5 h-5" />
                احجز هذه الخدمة الآن
              </TrackedLink>
            </div>
          </div>
        </section>

        {/* Detail description */}
        {service.detail_description && (
          <section className="py-16 px-4 bg-white">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-brand-600 to-brand-400" />
                <h2 className="text-2xl font-black text-ink-900">عن هذه الخدمة</h2>
              </div>
              <div className="prose prose-slate max-w-none text-ink-600 leading-relaxed whitespace-pre-line">
                {service.detail_description}
              </div>
            </div>
          </section>
        )}

        {/* Free online implant diagnosis promo — implantology only */}
        {id === "implantology" && (
          <section className="px-4 pb-4">
            <div className="max-w-3xl mx-auto bg-gradient-to-br from-ink-900 via-brand-900 to-ink-900 bg-noise rounded-[1.5rem] p-6 sm:p-8 text-center relative overflow-hidden">
              <div className="relative">
                <span className="inline-flex items-center gap-2 glass-dark text-white/90 text-xs font-bold px-3 py-1.5 rounded-full mb-3">
                  عرض مجاني لفترة محدودة
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mb-2">عاوز تعرف هل الزراعة مناسبة لحالتك؟</h3>
                <p className="text-white/70 text-sm mb-5 max-w-lg mx-auto leading-relaxed">
                  ابعتلنا صور الأشعة وبياناتك واحصل على تشخيص أولي مجاني من دكتور متخصص أونلاين، من غير ما تيجي العيادة.
                </p>
                <Link
                  href="/implant-diagnosis"
                  className="inline-flex items-center gap-2 bg-gradient-to-l from-brand-600 to-brand-400 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-brand-600/30 hover:shadow-xl transition-shadow"
                >
                  احصل على تشخيصك المجاني
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Before/After Gallery */}
        {gallery.length > 0 && (
          <section className="py-16 px-4 bg-mist-50">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <span className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 border border-brand-100 text-sm font-bold px-4 py-1.5 rounded-full mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  نتائج حقيقية
                </span>
                <h2 className="text-2xl font-black text-ink-900">صور قبل وبعد</h2>
                <p className="text-ink-500 text-sm mt-2">حرّك المؤشر على الصورة لمشاهدة الفرق</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {gallery.map((item) => (
                  <GalleryCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Medical disclaimer */}
        <section className="px-4 bg-white py-10">
          <div className="max-w-3xl mx-auto flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <ShieldCheck className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed text-right">
              المعلومات الواردة في هذه الصفحة لغرض التعريف بالخدمة فقط ولا تُغني عن الكشف الطبي المباشر.
              تختلف خطوات العلاج ومدته من حالة لأخرى، وتُحدَّد بدقة بعد الفحص والتقييم من قِبل الطبيب المعالج.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-mist-50">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-black text-ink-900 mb-3 tracking-tight">هل أنت مهتم بهذه الخدمة؟</h2>
            <p className="text-ink-500 mb-8">تواصل معنا الآن لحجز موعد أو الاستفسار عن التفاصيل</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <TrackedLink
                event="whatsapp_click"
                eventParams={{ cta_location: "service_page", page_type: "service" }}
                href={makeWhatsAppUrl(settings.whatsapp, `أريد الاستفسار عن خدمة ${service.title}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-gradient-to-l from-green-600 to-[#25D366] text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-green-900/25 hover:shadow-xl transition-shadow"
              >
                <MessageCircle className="w-5 h-5" />
                احجز عبر واتساب
              </TrackedLink>
              <Link
                href="/#services"
                className="flex items-center justify-center gap-2 bg-white hover:bg-brand-50 text-brand-700 font-semibold px-6 py-3.5 rounded-2xl transition-colors border border-brand-200"
              >
                <ArrowRight className="w-4 h-4" />
                تصفح خدمات أخرى
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer settings={settings} pageType="service" />
      <FloatingWhatsAppButton whatsapp={settings.whatsapp} />
      <MobileStickyBar settings={settings} pageType="service" />
    </div>
  );
}

function GalleryCard({ item }: { item: DbGallery }) {
  const label = item.caption || "الحالة";

  if (!item.before_image_url || !item.after_image_url) {
    return (
      <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-md border border-slate-100 aspect-video flex items-center justify-center text-slate-400 text-xs">
        —
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-[0_2px_10px_-4px_rgba(15,23,42,0.08)] border border-slate-100">
      <BeforeAfterSlider
        before={item.before_image_url}
        after={item.after_image_url}
        beforeAlt={`صورة قبل العلاج — ${label}`}
        afterAlt={`صورة بعد العلاج — ${label}`}
        aspect="aspect-[4/5]"
        className="rounded-none"
      />
      {item.caption && (
        <div className="px-4 py-3">
          <p className="text-sm text-ink-600">{item.caption}</p>
        </div>
      )}
    </div>
  );
}

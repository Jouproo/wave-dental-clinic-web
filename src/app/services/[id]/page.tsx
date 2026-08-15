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
import TrackedLink from "@/components/analytics/TrackedLink";
import { getClinicSettings, makeWhatsAppUrl } from "@/lib/clinic-settings";
import Image from "next/image";
import Link from "next/link";
import {
  Smile, Zap, Star, Sparkles, Shield, Layers, Droplets, Heart,
  Activity, Aperture, Award, Crown, Cross, Anchor,
  MessageCircle, ArrowRight, ChevronLeft,
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

      <main className="pt-24 pb-[68px] md:pb-0">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto px-4 pt-4 text-sm text-slate-500">
          <ol className="flex items-center gap-1.5 flex-wrap">
            <li><Link href="/" className="hover:text-blue-600">الرئيسية</Link></li>
            <li aria-hidden="true"><ChevronLeft className="w-3.5 h-3.5" /></li>
            <li><Link href="/#services" className="hover:text-blue-600">خدماتنا</Link></li>
            <li aria-hidden="true"><ChevronLeft className="w-3.5 h-3.5" /></li>
            <li aria-current="page" className="text-slate-700 font-medium">{service.title}</li>
          </ol>
        </nav>

        {/* Hero banner */}
        <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-16 px-4 mt-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {gallery.map((item) => (
                  <GalleryCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Medical disclaimer */}
        <section className="px-4">
          <p className="max-w-3xl mx-auto text-xs text-slate-400 leading-relaxed text-center">
            المعلومات الواردة في هذه الصفحة لغرض التعريف بالخدمة فقط ولا تُغني عن الكشف الطبي المباشر.
            تختلف خطوات العلاج ومدته من حالة لأخرى، وتُحدَّد بدقة بعد الفحص والتقييم من قِبل الطبيب المعالج.
          </p>
        </section>

        {/* CTA */}
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-3">هل أنت مهتم بهذه الخدمة؟</h2>
            <p className="text-slate-500 mb-8">تواصل معنا الآن لحجز موعد أو الاستفسار عن التفاصيل</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <TrackedLink
                event="whatsapp_click"
                eventParams={{ cta_location: "service_page", page_type: "service" }}
                href={makeWhatsAppUrl(settings.whatsapp, `أريد الاستفسار عن خدمة ${service.title}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3.5 rounded-xl transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                احجز عبر واتساب
              </TrackedLink>
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

      <Footer settings={settings} pageType="service" />
      <FloatingWhatsAppButton whatsapp={settings.whatsapp} />
      <MobileStickyBar settings={settings} pageType="service" />
    </div>
  );
}

function GalleryCard({ item }: { item: DbGallery }) {
  const label = item.caption || "الحالة";
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-slate-100">
      {/* قبل — فوق */}
      <div className="relative aspect-video bg-gray-100">
        {item.before_image_url ? (
          <Image
            src={item.before_image_url}
            alt={`صورة قبل العلاج — ${label}`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">—</div>
        )}
        <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full font-medium">قبل</span>
      </div>
      {/* فاصل */}
      <div className="h-px bg-slate-100" />
      {/* بعد — تحت */}
      <div className="relative aspect-video bg-gray-100">
        {item.after_image_url ? (
          <Image
            src={item.after_image_url}
            alt={`صورة بعد العلاج — ${label}`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">—</div>
        )}
        <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2.5 py-1 rounded-full font-medium">بعد</span>
      </div>
      {item.caption && (
        <div className="px-4 py-3">
          <p className="text-sm text-slate-600">{item.caption}</p>
        </div>
      )}
    </div>
  );
}

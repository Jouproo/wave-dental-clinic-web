import ServiceCard from "@/components/shared/ServiceCard";
import { services as staticServices } from "@/data/services";
import { supabaseServer } from "@/lib/supabase";
import { stripMarkdownArtifacts } from "@/lib/utils";
import type { Service } from "@/data/services";
import type { DbService } from "@/types/admin";

function dbToService(s: DbService): Service {
  return {
    id: s.id,
    icon: s.icon,
    title: s.title,
    description: stripMarkdownArtifacts(s.description),
    shortCta: s.short_cta,
    short_cta: s.short_cta,
    detail_description: stripMarkdownArtifacts(s.detail_description),
    status: s.status,
    display_order: s.display_order,
  };
}

async function getServices(): Promise<Service[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return staticServices;
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("status", "active")
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) return staticServices;
    return data.map(dbToService);
  } catch {
    return staticServices;
  }
}

export default async function ServicesSection() {
  const services = await getServices();

  return (
    <section id="services" aria-labelledby="services-heading" className="py-16 md:py-20 lg:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 md:mb-12 max-w-3xl">
          <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            خدماتنا
          </span>
          <h2
            id="services-heading"
            className="text-[1.9rem] sm:text-4xl md:text-[2.75rem] font-black leading-[1.15] tracking-tight text-ink-900 mb-4"
          >
            خدمات أسنان متكاملة في 6 أكتوبر
          </h2>
          <p className="text-base md:text-lg leading-8 text-ink-500">
            في ويف دنتال كلينيك بمنطقة الحصري، نقدم زراعة الأسنان والتقويم وعلاج الجذور والتركيبات
            وتجميل الابتسامة، بخطط علاج يحددها أطباء متخصصون بعد فحص كل حالة.
          </p>
        </div>

        {/* Mobile: horizontal snap carousel · Desktop: grid */}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:overflow-visible md:mx-0 md:px-0 md:pb-0">
          {services.map((service, i) => (
            <div key={service.id} className="min-w-[82%] sm:min-w-[340px] snap-start md:min-w-0">
              <ServiceCard service={service} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

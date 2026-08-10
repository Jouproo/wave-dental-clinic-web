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
    <section id="services" aria-labelledby="services-heading" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 md:mb-12">
          <span className="inline-block text-sm font-semibold px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 mb-4">
            خدماتنا
          </span>
          <h2
            id="services-heading"
            className="text-3xl md:text-4xl font-bold leading-[1.25] text-slate-800 mb-4"
          >
            خدمات أسنان متكاملة في 6 أكتوبر
          </h2>
          <p className="text-base md:text-lg leading-8 text-slate-500 max-w-4xl">
            في ويف دنتال كلينيك بمنطقة الحصري، نقدم زراعة الأسنان والتقويم وعلاج الجذور والتركيبات
            وتجميل الابتسامة، بخطط علاج يحددها أطباء متخصصون بعد فحص كل حالة.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {services.map((service, i) => (
            <ServiceCard key={service.id} service={service} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

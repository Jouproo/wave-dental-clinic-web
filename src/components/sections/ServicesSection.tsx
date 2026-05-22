import SectionHeader from "@/components/shared/SectionHeader";
import ServiceCard from "@/components/shared/ServiceCard";
import { services as staticServices } from "@/data/services";
import { supabaseServer } from "@/lib/supabase";
import type { Service } from "@/data/services";
import type { DbService } from "@/types/admin";

function dbToService(s: DbService): Service {
  return {
    id: s.id,
    icon: s.icon,
    title: s.title,
    description: s.description,
    shortCta: s.short_cta,
    short_cta: s.short_cta,
    detail_description: s.detail_description,
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
    <section id="services" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="خدماتنا"
          title="كل ما تحتاجه لابتسامة مثالية"
          subtitle="نقدم طيفًا شاملاً من خدمات طب وتجميل الأسنان بأحدث التقنيات وعلى يد أطباء متخصصين."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((service, i) => (
            <ServiceCard key={service.id} service={service} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

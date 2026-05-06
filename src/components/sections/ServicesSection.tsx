import SectionHeader from "@/components/shared/SectionHeader";
import ServiceCard from "@/components/shared/ServiceCard";
import { services } from "@/data/services";

export default function ServicesSection() {
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

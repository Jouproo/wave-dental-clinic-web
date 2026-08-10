import SectionHeader from "@/components/shared/SectionHeader";
import TestimonialCard from "@/components/shared/TestimonialCard";
import { testimonials } from "@/data/testimonials";

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-14 md:py-20 lg:py-24 bg-gradient-to-br from-blue-50 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="آراء مرضانا"
          title="ما يقوله مرضانا عنا"
          subtitle="نفخر بثقة مرضانا ونسعى دائمًا لتقديم أفضل تجربة ممكنة."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.id} testimonial={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

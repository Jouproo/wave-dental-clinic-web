import SectionHeader from "@/components/shared/SectionHeader";
import TestimonialCard from "@/components/shared/TestimonialCard";
import { testimonials } from "@/data/testimonials";

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-16 md:py-20 lg:py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="آراء مرضانا"
          title="ما يقوله مرضانا عنا"
          subtitle="نفخر بثقة مرضانا ونسعى دائمًا لتقديم أفضل تجربة ممكنة."
        />

        <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible sm:mx-0 sm:px-0 sm:pb-0">
          {testimonials.map((t, i) => (
            <div key={t.id} className="min-w-[82%] sm:min-w-0 snap-start">
              <TestimonialCard testimonial={t} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

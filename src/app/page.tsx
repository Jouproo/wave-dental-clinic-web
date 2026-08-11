export const revalidate = 300;

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FloatingWhatsAppButton from "@/components/shared/FloatingWhatsAppButton";
import HeroSection from "@/components/sections/HeroSection";
import ServicesSection from "@/components/sections/ServicesSection";
import WhyChooseUsSection from "@/components/sections/WhyChooseUsSection";
import PatientJourneySection from "@/components/sections/PatientJourneySection";
import DoctorsSection from "@/components/sections/DoctorsSection";
import ResultsSection from "@/components/sections/ResultsSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import LocationSection from "@/components/sections/LocationSection";
import BookingSection from "@/components/sections/BookingSection";
import FAQSection from "@/components/sections/FAQSection";
import BlogTeaserSection from "@/components/sections/BlogTeaserSection";
import FinalCTASection from "@/components/sections/FinalCTASection";
import MobileStickyBar from "@/components/shared/MobileStickyBar";
import { getClinicSettings } from "@/lib/clinic-settings";
import { faqs } from "@/data/faqs";

function FaqJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function Home() {
  const settings = await getClinicSettings();

  return (
    <>
      <FaqJsonLd />
      <Header settings={settings} />
      <main className="pb-[68px] md:pb-0">
        <HeroSection settings={settings} />
        <ServicesSection />
        <WhyChooseUsSection settings={settings} />
        <PatientJourneySection />
        <DoctorsSection settings={settings} />
        <ResultsSection />
        <TestimonialsSection />
        <LocationSection settings={settings} />
        <BookingSection settings={settings} />
        <FAQSection />
        <BlogTeaserSection />
        <FinalCTASection settings={settings} />
      </main>
      <Footer settings={settings} />
      <FloatingWhatsAppButton whatsapp={settings.whatsapp} />
      <MobileStickyBar settings={settings} />
    </>
  );
}

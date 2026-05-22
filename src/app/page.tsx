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
import FinalCTASection from "@/components/sections/FinalCTASection";
import { getClinicSettings } from "@/lib/clinic-settings";

export default async function Home() {
  const settings = await getClinicSettings();

  return (
    <>
      <Header settings={settings} />
      <main>
        <HeroSection />
        <ServicesSection />
        <WhyChooseUsSection />
        <PatientJourneySection />
        <DoctorsSection />
        <ResultsSection />
        <TestimonialsSection />
        <LocationSection settings={settings} />
        <BookingSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer settings={settings} />
      <FloatingWhatsAppButton whatsapp={settings.whatsapp} />
    </>
  );
}

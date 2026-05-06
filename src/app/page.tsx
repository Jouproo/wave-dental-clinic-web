import Navbar from "@/components/Navbar";
import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import PatientJourney from "@/components/sections/PatientJourney";
import Doctors from "@/components/sections/Doctors";
import BeforeAfter from "@/components/sections/BeforeAfter";
import Testimonials from "@/components/sections/Testimonials";
import Location from "@/components/sections/Location";
import BookingCTA from "@/components/sections/BookingCTA";
import FAQ from "@/components/sections/FAQ";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/ui/WhatsAppButton";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Services />
      <WhyChooseUs />
      <PatientJourney />
      <Doctors />
      <BeforeAfter />
      <Testimonials />
      <Location />
      <BookingCTA />
      <FAQ />
      <Footer />
      <WhatsAppButton />
    </main>
  );
}

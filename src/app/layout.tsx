import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { clinicConfig } from "@/config/clinic";
import MotionProvider from "@/components/shared/MotionProvider";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import { supabaseServer } from "@/lib/supabase";
import { services as staticServices } from "@/data/services";
import { doctors as staticDoctors } from "@/data/doctors";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(clinicConfig.seo.url),
  title: {
    default: clinicConfig.seo.title,
    template: `%s | ${clinicConfig.clinicNameEn}`,
  },
  description: clinicConfig.seo.description,
  authors: [{ name: clinicConfig.clinicName }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: clinicConfig.seo.title,
    description: clinicConfig.seo.description,
    url: clinicConfig.seo.url,
    siteName: clinicConfig.clinicName,
    locale: "ar_EG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: clinicConfig.seo.title,
    description: clinicConfig.seo.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

async function getActiveServicesForSchema(): Promise<{ id: string; title: string }[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return staticServices.map((s) => ({ id: s.id, title: s.title }));
    }
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from("services")
      .select("id, title")
      .eq("status", "active")
      .order("display_order", { ascending: true });
    if (error || !data || data.length === 0) {
      return staticServices.map((s) => ({ id: s.id, title: s.title }));
    }
    return data;
  } catch {
    return staticServices.map((s) => ({ id: s.id, title: s.title }));
  }
}

interface DoctorForSchema {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  image_url?: string | null;
}

async function getActiveDoctorsForSchema(): Promise<DoctorForSchema[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return staticDoctors;
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from("doctors")
      .select("id, name, specialty, bio, image_url")
      .eq("status", "active")
      .order("display_order", { ascending: true });
    if (error || !data || data.length === 0) return staticDoctors;
    return data;
  } catch {
    return staticDoctors;
  }
}

async function ClinicJsonLd() {
  const url = clinicConfig.seo.url;
  const logo = `${url}/images/web_logo.png`;
  const [services, doctors] = await Promise.all([
    getActiveServicesForSchema(),
    getActiveDoctorsForSchema(),
  ]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Dentist",
        "@id": `${url}/#clinic`,
        name: clinicConfig.clinicName,
        alternateName: clinicConfig.clinicNameEn,
        url,
        logo,
        image: logo,
        telephone: clinicConfig.phoneNumber,
        email: clinicConfig.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: "الحصري، أبراج الأمريكية 5، مدخل البرج أمام بلبن، الدور الرابع",
          addressLocality: "6 أكتوبر",
          addressRegion: "الجيزة",
          postalCode: "15525",
          addressCountry: "EG",
        },
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
          ],
          opens: "10:00",
          closes: "23:30",
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "خدمات العيادة",
          itemListElement: services.map((s) => ({
            "@type": "Service",
            name: s.title,
            url: `${url}/services/${s.id}`,
            provider: { "@id": `${url}/#clinic` },
          })),
        },
        ...(clinicConfig.socialLinks.facebook
          ? { sameAs: [clinicConfig.socialLinks.facebook] }
          : {}),
        employee: doctors.map((d) => ({ "@id": `${url}/#doctor-${d.id}` })),
      },
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url,
        name: clinicConfig.clinicName,
        inLanguage: "ar-EG",
        publisher: { "@id": `${url}/#clinic` },
      },
      ...doctors.map((d) => ({
        "@type": "Physician",
        "@id": `${url}/#doctor-${d.id}`,
        name: d.name,
        medicalSpecialty: d.specialty,
        description: d.bio,
        ...(d.image_url ? { image: d.image_url } : {}),
        worksFor: { "@id": `${url}/#clinic` },
      })),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className={`${cairo.className} antialiased bg-white text-slate-900`}>
        <ClinicJsonLd />
        <AnalyticsProvider />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}

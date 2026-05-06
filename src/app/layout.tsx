import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { clinicConfig } from "@/config/clinic";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(clinicConfig.seo.url),
  title: clinicConfig.seo.title,
  description: clinicConfig.seo.description,
  keywords: [
    "ويف دنتال كلينيك",
    "Wave Dental Clinic",
    "عيادة أسنان 6 أكتوبر",
    "طبيب أسنان الجيزة",
    "تقويم أسنان",
    "زراعة أسنان",
    "تجميل أسنان",
    "هوليوود سمايل",
    "تبييض أسنان",
    "حجز موعد أسنان",
  ],
  authors: [{ name: clinicConfig.clinicName }],
  openGraph: {
    title: clinicConfig.seo.title,
    description: clinicConfig.seo.description,
    url: clinicConfig.seo.url,
    siteName: clinicConfig.clinicName,
    images: [
      {
        url: clinicConfig.seo.ogImage,
        width: 1200,
        height: 630,
        alt: clinicConfig.clinicName,
      },
    ],
    locale: "ar_EG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: clinicConfig.seo.title,
    description: clinicConfig.seo.description,
    images: [clinicConfig.seo.ogImage],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className={`${cairo.className} antialiased bg-white text-slate-900`}>
        {children}
      </body>
    </html>
  );
}

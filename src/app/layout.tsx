import type { Metadata } from "next";
import "./globals.css";
import { clinicConfig } from "@/config/clinic";

export const metadata: Metadata = {
  title: "Wave Dental Clinic | Professional Dental Care",
  description:
    "Book your appointment at Wave Dental Clinic for modern dental care, cosmetic dentistry, orthodontics, implants, whitening, and complete oral health services.",
  keywords: [
    "dental clinic",
    "dentist",
    "wave dental",
    "cosmetic dentistry",
    "orthodontics",
    "dental implants",
    "teeth whitening",
  ],
  metadataBase: new URL(clinicConfig.siteUrl),
  alternates: {
    canonical: clinicConfig.siteUrl,
  },
  openGraph: {
    title: "Wave Dental Clinic | Professional Dental Care",
    description:
      "Book your appointment at Wave Dental Clinic for modern dental care, cosmetic dentistry, orthodontics, implants, whitening, and complete oral health services.",
    url: clinicConfig.siteUrl,
    siteName: clinicConfig.clinicName,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wave Dental Clinic | Professional Dental Care",
    description:
      "Book your appointment at Wave Dental Clinic for modern dental care, cosmetic dentistry, orthodontics, implants, whitening, and complete oral health services.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>{children}</body>
    </html>
  );
}

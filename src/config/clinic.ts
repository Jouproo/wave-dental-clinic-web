// ============================================================
// CLINIC CONFIGURATION — Edit all your clinic details here
// ============================================================

export const clinicConfig = {
  // Basic info
  clinicName: "ويف دنتال كلينيك",
  clinicNameEn: "Wave Dental Clinic",
  tagline: "ابتسامتك تبدأ من عيادة تهتم بكل تفصيلة",

  // Contact
  phoneNumber: "+201091957525",
  whatsappNumber: "+201091957525",
  whatsappMessage: "مرحبًا، أريد حجز موعد في ويف دنتال كلينيك",
  email: "info@wavedentalclinic.com",

  // Address
  address: "٦ أكتوبر - الحصري - أبراج الأمريكية 5 - مدخل البرج أمام بلبن - الدور الرابع، الجيزة",

  // Working hours
  workingHours: "يوميًا من 10 صباحًا حتى 11:30 مساءً",

  // Google Maps
  googleMapsEmbedUrl:
    "https://maps.google.com/maps?q=" +
    encodeURIComponent("XWFV+9VQ, El-Tahrir, First 6th of October, Giza Governorate 15525") +
    "&output=embed",
  googleMapsDirectionUrl: "https://maps.app.goo.gl/TjgZSw2gbx5M14JX7?g_st=com.google.maps.preview.copy",

  // Booking — change this later to your booking system URL
  bookingUrl: "",

  // Social media
  socialLinks: {
    facebook: "https://www.facebook.com/profile.php?id=61574921413165",
    instagram: "",
    tiktok: "",
    youtube: "",
  },

  // SEO
  seo: {
    title: "ويف دنتال كلينيك | عيادة أسنان متخصصة - 6 أكتوبر",
    description:
      "ويف دنتال كلينيك في 6 أكتوبر، الجيزة — خدمات تقويم الأسنان، زراعة الأسنان، تجميل الأسنان، تبييض، وعلاج الجذور بأعلى معايير الجودة والتعقيم الطبي.",
    ogImage: "/images/og-image.jpg",
    url: "https://wavedentelclinic.com",
  },
} as const;

// Derived helpers
export const getWhatsAppUrl = (message?: string) => {
  const text = encodeURIComponent(message ?? clinicConfig.whatsappMessage);
  return `https://wa.me/${clinicConfig.whatsappNumber.replace(/\D/g, "")}?text=${text}`;
};

export const getBookingUrl = () =>
  clinicConfig.bookingUrl || getWhatsAppUrl();

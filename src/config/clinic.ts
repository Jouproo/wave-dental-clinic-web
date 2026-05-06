// ============================================================
// CLINIC CONFIGURATION — Edit all your clinic details here
// ============================================================

export const clinicConfig = {
  // Basic info
  clinicName: "ويف دنتال كلينيك",
  clinicNameEn: "Wave Dental Clinic",
  tagline: "ابتسامتك تبدأ من عيادة تهتم بكل تفصيلة",

  // Contact
  phoneNumber: "+201019575925",
  whatsappNumber: "+201019575925",
  whatsappMessage: "مرحبًا، أريد حجز موعد في ويف دنتال كلينيك",
  email: "info@wavedentalclinic.com",

  // Address
  address: "6 أكتوبر، الجيزة، مصر",

  // Working hours
  workingHours: "مفتوح دائمًا",

  // Google Maps
  googleMapsEmbedUrl:
    "https://maps.google.com/maps?q=6+October+City,Giza,Egypt&output=embed",
  googleMapsDirectionUrl: "https://maps.app.goo.gl/7nWhdSEGf9y9Ei3J8",

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
    url: "https://wavedentalclinic.com",
  },
} as const;

// Derived helpers
export const getWhatsAppUrl = (message?: string) => {
  const text = encodeURIComponent(message ?? clinicConfig.whatsappMessage);
  return `https://wa.me/${clinicConfig.whatsappNumber.replace(/\D/g, "")}?text=${text}`;
};

export const getBookingUrl = () =>
  clinicConfig.bookingUrl || getWhatsAppUrl();

// ============================================================
// CLINIC CONFIGURATION — Edit all your clinic details here
// ============================================================

export const clinicConfig = {
  // Basic info
  clinicName: "عيادتي لطب الأسنان",
  clinicNameEn: "My Dental Clinic",
  tagline: "ابتسامتك تبدأ من عيادة تهتم بكل تفصيلة",

  // Contact
  phoneNumber: "+20XXXXXXXXXX",
  whatsappNumber: "+20XXXXXXXXXX", // without spaces/dashes e.g. "+201234567890"
  whatsappMessage: "مرحبًا، أريد حجز موعد في العيادة", // pre-filled WA message
  email: "info@myclinic.com",

  // Address
  address: "اكتب عنوان العيادة هنا، المدينة، مصر",

  // Working hours
  workingHours: "السبت – الخميس: 9 ص – 9 م",

  // Google Maps
  googleMapsEmbedUrl:
    "https://maps.google.com/maps?q=Cairo,Egypt&output=embed", // Replace with real embed URL
  googleMapsDirectionUrl: "https://maps.google.com/?q=Cairo,Egypt", // Replace with real URL

  // Booking — change this later to your booking system URL
  // e.g. bookingUrl: "https://booking.yourclinic.com"
  bookingUrl: "", // empty = falls back to WhatsApp

  // Social media
  socialLinks: {
    facebook: "https://facebook.com/yourclinic",
    instagram: "https://instagram.com/yourclinic",
    tiktok: "https://tiktok.com/@yourclinic",
    youtube: "",
  },

  // SEO
  seo: {
    title: "عيادتي لطب الأسنان | حجز كشف أسنان بسهولة",
    description:
      "احجز موعدك في عيادة أسنان متخصصة تقدم خدمات التقويم، زراعة الأسنان، التجميل، التبييض، وعلاج الأسنان بتجربة مريحة ومهنية.",
    ogImage: "/images/og-image.jpg",
    url: "https://yourclinic.com",
  },
} as const;

// Derived helpers
export const getWhatsAppUrl = (message?: string) => {
  const text = encodeURIComponent(message ?? clinicConfig.whatsappMessage);
  return `https://wa.me/${clinicConfig.whatsappNumber.replace(/\D/g, "")}?text=${text}`;
};

export const getBookingUrl = () =>
  clinicConfig.bookingUrl || getWhatsAppUrl();

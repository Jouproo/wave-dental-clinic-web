export interface Service {
  id: string;
  icon: string; // Lucide icon name
  title: string;
  description: string;
  shortCta: string;
  // DB-extended fields
  short_cta?: string;
  detail_description?: string;
  status?: "active" | "inactive";
  display_order?: number;
}

export const services: Service[] = [
  {
    id: "orthodontics",
    icon: "Smile",
    title: "تقويم الأسنان",
    description:
      "حلول تقويم متكاملة للأطفال والبالغين باستخدام أحدث التقنيات لتحقيق الإطار المثالي لأسنانك.",
    shortCta: "اعرف أكثر",
  },
  {
    id: "implants",
    icon: "Zap",
    title: "زراعة الأسنان",
    description:
      "زراعة أسنان دائمة بمواد عالية الجودة وتقنيات دقيقة لاستعادة ابتسامتك وثقتك بنفسك.",
    shortCta: "اعرف أكثر",
  },
  {
    id: "cosmetic",
    icon: "Star",
    title: "تجميل الأسنان",
    description:
      "هوليوود سمايل وفينير وقشور خزفية لإطلالة ساحرة تناسب شكل وجهك بالكامل.",
    shortCta: "اعرف أكثر",
  },
  {
    id: "whitening",
    icon: "Sparkles",
    title: "تبييض الأسنان",
    description:
      "جلسات تبييض آمنة وفعّالة تمنحك بياضًا ناصعًا بدون ألم وبنتائج مضمونة.",
    shortCta: "اعرف أكثر",
  },
  {
    id: "rootcanal",
    icon: "Shield",
    title: "علاج الجذور",
    description:
      "علاج قنوات الجذور بأحدث الأجهزة وبأقل ألم ممكن للحفاظ على أسنانك الطبيعية.",
    shortCta: "اعرف أكثر",
  },
  {
    id: "filling",
    icon: "Layers",
    title: "حشو الأسنان",
    description:
      "حشوات تجميلية بألوان تتوافق مع أسنانك الطبيعية باستخدام مواد حديثة وآمنة.",
    shortCta: "اعرف أكثر",
  },
  {
    id: "cleaning",
    icon: "Droplets",
    title: "تنظيف الجير",
    description:
      "جلسات تنظيف عميقة للأسنان واللثة بأجهزة التراساونيك للحصول على أسنان نظيفة وصحية.",
    shortCta: "اعرف أكثر",
  },
  {
    id: "pediatric",
    icon: "Heart",
    title: "طب أسنان الأطفال",
    description:
      "بيئة مريحة وودية للأطفال مع أطباء متخصصين في علاج أسنان الأطفال بلطف واحترافية.",
    shortCta: "اعرف أكثر",
  },
];

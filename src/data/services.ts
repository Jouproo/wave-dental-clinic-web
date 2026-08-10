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

// Offline fallback only — used if Supabase is unreachable. Mirrors the
// clinic's real, admin-managed service list (copy, order, icons) so it
// stays consistent with what's actually live in the database.
export const services: Service[] = [
  {
    id: "implantology",
    icon: "Anchor",
    title: "زراعة الأسنان",
    description:
      "نعوّض الأسنان المفقودة بغرسات ثابتة بعد تقييم العظام واللثة، لاستعادة كفاءة المضغ ومظهر طبيعي يتناسب مع ابتسامتك.",
    shortCta: "اعرف أكثر",
    display_order: 1,
  },
  {
    id: "orthodontics",
    icon: "Layers",
    title: "تقويم الأسنان",
    description:
      "نصحح تزاحم الأسنان ومشكلات الإطباق بخطة تقويم تناسب الحالة، مع متابعة منتظمة للوصول إلى ابتسامة متوازنة ووظيفة أفضل للأسنان.",
    shortCta: "اعرف أكثر",
    display_order: 2,
  },
  {
    id: "endodontics",
    icon: "Activity",
    title: "علاج الجذور",
    description:
      "نعالج التهاب عصب الأسنان بدقة لتخفيف الألم والحفاظ على السن الطبيعي قدر الإمكان، مع متابعة الحالة بعد انتهاء العلاج.",
    shortCta: "اعرف أكثر",
    display_order: 3,
  },
  {
    id: "esthetics",
    icon: "Sparkles",
    title: "تجميل الأسنان",
    description:
      "نحسّن شكل الابتسامة بالفينير وإعادة تشكيل الأسنان والحلول التجميلية المناسبة، مع التركيز على نتيجة طبيعية ومتناسقة مع ملامح الوجه.",
    shortCta: "اعرف أكثر",
    display_order: 4,
  },
  {
    id: "fixed-prothodontics",
    icon: "Crown",
    title: "التركيبات الثابتة",
    description:
      "نقدم تيجانًا وجسورًا مصممة لتعويض الأسنان التالفة أو المفقودة، واستعادة وظيفة المضغ بمظهر قريب من الأسنان الطبيعية.",
    shortCta: "اعرف أكثر",
    display_order: 5,
  },
  {
    id: "biomimetic-restorations",
    icon: "Shield",
    title: "الترميم الحيوي للأسنان",
    description:
      "نعيد بناء الأسنان المتضررة بمواد وتقنيات تحاكي بنيتها الطبيعية، بهدف الحفاظ على أكبر قدر ممكن من أنسجة السن السليمة.",
    shortCta: "اعرف أكثر",
    display_order: 6,
  },
  {
    id: "bleaching",
    icon: "Star",
    title: "تبييض الأسنان",
    description:
      "نزيل التصبغات السطحية بتبييض احترافي يراعي صحة مينا الأسنان ودرجة الحساسية، بعد تقييم الطبيب واختيار الطريقة المناسبة.",
    shortCta: "اعرف أكثر",
    display_order: 7,
  },
  {
    id: "removable-prosthodontics",
    icon: "Smile",
    title: "التركيبات المتحركة",
    description:
      "نقدم حلولًا مريحة لتعويض عدة أسنان أو الفقد الكامل، بتصميم يناسب الفم ويساعد على تحسين المضغ والكلام والثقة بالابتسامة.",
    shortCta: "اعرف أكثر",
    display_order: 8,
  },
  {
    id: "surgery",
    icon: "Cross",
    title: "جراحة الفم والفكين",
    description:
      "نعالج ضروس العقل والأسنان المدفونة وبعض الحالات الجراحية بالفم والفكين، بعد فحص وتشخيص يحددان الإجراء الأنسب لكل حالة.",
    shortCta: "اعرف أكثر",
    display_order: 9,
  },
];

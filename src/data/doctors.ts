export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  image: string; // path or placeholder
  image_url?: string | null; // Supabase Storage URL (takes precedence over image)
  experience: string;
  whatsapp?: string;
  status?: "active" | "inactive";
  display_order?: number;
}

export const doctors: Doctor[] = [
  {
    id: "doc-1",
    name: "د. أحمد محمد",
    specialty: "طب وجراحة الأسنان",
    bio: "متخصص في زراعة الأسنان وجراحة الفم واللثة مع خبرة تتجاوز 10 سنوات في تقديم رعاية شاملة للمرضى.",
    image: "/images/doctor-placeholder.jpg",
    experience: "+10 سنوات",
  },
  {
    id: "doc-2",
    name: "د. سارة عبد الله",
    specialty: "تقويم الأسنان",
    bio: "حاصلة على دكتوراه في تقويم الأسنان، متخصصة في تقويم الأطفال والبالغين باستخدام أحدث تقنيات التقويم الشفاف.",
    image: "/images/doctor-placeholder.jpg",
    experience: "+8 سنوات",
  },
  {
    id: "doc-3",
    name: "د. خالد إبراهيم",
    specialty: "تجميل وتسمير الأسنان",
    bio: "متخصص في تجميل الأسنان والهوليوود سمايل والفينير، يجمع بين الدقة الفنية والإحساس الجمالي العالي.",
    image: "/images/doctor-placeholder.jpg",
    experience: "+12 سنة",
  },
];

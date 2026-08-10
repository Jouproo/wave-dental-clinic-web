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

// Offline fallback only — used if Supabase is unreachable. Mirrors the
// clinic's real, admin-managed doctor roster.
export const doctors: Doctor[] = [
  {
    id: "doc-abu-elnasr",
    name: "د. أحمد أبو النصر",
    specialty: "أخصائي علاج الجذور",
    bio: "طبيب أخصائي علاج جذور، حاصل على الزمالة البريطانية MRD، ويتمتع بخبرة تمتد لأكثر من 10 سنوات في تشخيص وعلاج مشكلات عصب الأسنان والحالات المعقدة.",
    image: "/images/doctor-placeholder.jpg",
    image_url: "https://rbufpuwmuixfbbabzcet.supabase.co/storage/v1/object/public/clinic-assets/doctors/1784722923035-x38b1i8411l.png",
    experience: "10",
    whatsapp: "01069392486",
  },
  {
    id: "doc-elabd",
    name: "د. أحمد العبد",
    specialty: "طب وجراحة الفم و الأسنان",
    bio: "أخصائي طب وجراحة الفم والأسنان، يمتلك خبرة عملية تزيد عن 6 سنوات في تشخيص وعلاج مشكلات الأسنان وتقديم الحلول العلاجية والتجميلية المتكاملة.",
    image: "/images/doctor-placeholder.jpg",
    image_url: "https://rbufpuwmuixfbbabzcet.supabase.co/storage/v1/object/public/clinic-assets/doctors/1780329473609-x6snz580tt.jpeg",
    experience: "6",
    whatsapp: "+201001076821",
  },
];

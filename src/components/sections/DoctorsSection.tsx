import SectionHeader from "@/components/shared/SectionHeader";
import DoctorCard from "@/components/shared/DoctorCard";
import { doctors as staticDoctors } from "@/data/doctors";
import { supabaseServer } from "@/lib/supabase";
import type { Doctor } from "@/data/doctors";
import type { DbDoctor, DbClinicSettings } from "@/types/admin";

function dbToDoctor(d: DbDoctor): Doctor {
  return {
    id: d.id,
    name: d.name,
    specialty: d.specialty,
    bio: d.bio,
    image: d.image_url ?? "/images/doctor-placeholder.jpg",
    image_url: d.image_url,
    experience: d.experience,
    whatsapp: d.whatsapp,
    status: d.status,
    display_order: d.display_order,
  };
}

async function getDoctors(): Promise<Doctor[]> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return staticDoctors;
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("status", "active")
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) return staticDoctors;
    return data.map(dbToDoctor);
  } catch {
    return staticDoctors;
  }
}

interface DoctorsSectionProps {
  settings?: DbClinicSettings;
}

export default async function DoctorsSection({ settings }: DoctorsSectionProps) {
  const doctors = await getDoctors();

  return (
    <section id="doctors" className="py-16 md:py-20 lg:py-28 bg-mist-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="فريقنا الطبي"
          title="أطباء متخصصون في خدمتك"
          subtitle="فريق طبي متكامل من أكثر الأطباء خبرةً وتخصصًا لضمان أفضل نتائج لحالتك."
        />

        <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 sm:overflow-visible sm:mx-0 sm:px-0 sm:pb-0">
          {doctors.map((doctor, i) => (
            <div key={doctor.id} className="min-w-[82%] sm:min-w-0 snap-start">
              <DoctorCard doctor={doctor} index={i} clinicWhatsapp={settings?.whatsapp} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

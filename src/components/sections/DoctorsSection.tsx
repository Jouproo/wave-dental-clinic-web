import SectionHeader from "@/components/shared/SectionHeader";
import DoctorCard from "@/components/shared/DoctorCard";
import { doctors } from "@/data/doctors";

export default function DoctorsSection() {
  return (
    <section id="doctors" className="py-24 bg-gradient-to-br from-slate-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="فريقنا الطبي"
          title="أطباء متخصصون في خدمتك"
          subtitle="فريق طبي متكامل من أكثر الأطباء خبرةً وتخصصًا لضمان أفضل نتائج لحالتك."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor, i) => (
            <DoctorCard key={doctor.id} doctor={doctor} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

import DoctorForm from "../DoctorForm";

export default function NewDoctorPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">إضافة طبيب جديد</h1>
      <p className="text-slate-500 mb-8">أضف طبيباً جديداً لقائمة الفريق الطبي</p>
      <DoctorForm />
    </div>
  );
}

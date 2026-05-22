import ServiceForm from "../ServiceForm";

export default function NewServicePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">إضافة خدمة جديدة</h1>
      <p className="text-slate-500 mb-8">أضف خدمة جديدة لقائمة خدمات العيادة</p>
      <ServiceForm isNew />
    </div>
  );
}

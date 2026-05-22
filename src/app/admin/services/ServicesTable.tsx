"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Images, Stethoscope } from "lucide-react";
import type { DbService } from "@/types/admin";

export default function ServicesTable({ services }: { services: DbService[] }) {
  const router = useRouter();

  async function handleDelete(id: string, title: string) {
    if (!confirm(`هل أنت متأكد من حذف "${title}"؟`)) return;
    await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (services.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-slate-400">
        <Stethoscope className="w-12 h-12 mx-auto mb-3 text-slate-200" />
        <p>لا توجد خدمات بعد. أضف أول خدمة!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-right px-5 py-3.5 font-semibold text-slate-600">الخدمة</th>
            <th className="text-right px-5 py-3.5 font-semibold text-slate-600">الحالة</th>
            <th className="text-right px-5 py-3.5 font-semibold text-slate-600">الترتيب</th>
            <th className="text-right px-5 py-3.5 font-semibold text-slate-600">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {services.map((svc) => (
            <tr key={svc.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-4">
                <div>
                  <p className="font-medium text-slate-800">{svc.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{svc.id}</p>
                </div>
              </td>
              <td className="px-5 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  svc.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {svc.status === "active" ? "نشطة" : "مخفية"}
                </span>
              </td>
              <td className="px-5 py-4 text-slate-500">{svc.display_order}</td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/services/${svc.id}`}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="تعديل"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/admin/services/${svc.id}/gallery`}
                    className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                    title="قبل وبعد"
                  >
                    <Images className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(svc.id, svc.title)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

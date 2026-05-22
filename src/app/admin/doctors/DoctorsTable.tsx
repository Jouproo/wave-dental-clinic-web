"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, UserCircle } from "lucide-react";
import Image from "next/image";
import type { DbDoctor } from "@/types/admin";

export default function DoctorsTable({ doctors }: { doctors: DbDoctor[] }) {
  const router = useRouter();

  async function handleDelete(id: string, name: string) {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;
    await fetch(`/api/admin/doctors/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (doctors.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-slate-400">
        <UserCircle className="w-12 h-12 mx-auto mb-3 text-slate-200" />
        <p>لا يوجد أطباء بعد. أضف أول طبيب!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-right px-5 py-3.5 font-semibold text-slate-600">الطبيب</th>
            <th className="text-right px-5 py-3.5 font-semibold text-slate-600">التخصص</th>
            <th className="text-right px-5 py-3.5 font-semibold text-slate-600">الحالة</th>
            <th className="text-right px-5 py-3.5 font-semibold text-slate-600">الترتيب</th>
            <th className="text-right px-5 py-3.5 font-semibold text-slate-600">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {doctors.map((doc) => (
            <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-blue-100 flex-shrink-0 flex items-center justify-center">
                    {doc.image_url ? (
                      <Image src={doc.image_url} alt={doc.name} width={36} height={36} className="object-cover w-full h-full" unoptimized />
                    ) : (
                      <UserCircle className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                  <span className="font-medium text-slate-800">{doc.name}</span>
                </div>
              </td>
              <td className="px-5 py-4 text-slate-500">{doc.specialty}</td>
              <td className="px-5 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  doc.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {doc.status === "active" ? "نشط" : "مخفي"}
                </span>
              </td>
              <td className="px-5 py-4 text-slate-500">{doc.display_order}</td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/doctors/${doc.id}`}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(doc.id, doc.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

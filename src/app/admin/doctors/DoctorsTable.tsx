"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, UserCircle, ArrowUp, ArrowDown } from "lucide-react";
import Image from "next/image";
import type { DbDoctor } from "@/types/admin";

export default function DoctorsTable({ doctors }: { doctors: DbDoctor[] }) {
  const router = useRouter();

  async function handleDelete(id: string, name: string) {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;
    await fetch(`/api/admin/doctors/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const other = doctors[index + direction];
    const current = doctors[index];
    if (!other) return;
    await Promise.all([
      fetch(`/api/admin/doctors/${current.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_order: other.display_order }),
      }),
      fetch(`/api/admin/doctors/${other.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_order: current.display_order }),
      }),
    ]);
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
          {doctors.map((doc, index) => (
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
              <td className="px-5 py-4">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <button
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0}
                    title="تحريك لأعلى"
                    className="p-1 rounded-lg hover:bg-gray-100 hover:text-blue-600 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMove(index, 1)}
                    disabled={index === doctors.length - 1}
                    title="تحريك لأسفل"
                    className="p-1 rounded-lg hover:bg-gray-100 hover:text-blue-600 disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
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

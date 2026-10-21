"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Inbox, Eye, Trash2 } from "lucide-react";
import type { DbBookingRequest, BookingRequestType, BookingStatus } from "@/types/admin";

const typeLabels: Record<BookingRequestType, string> = {
  appointment: "حجز موعد",
  implant_diagnosis: "تشخيص زراعة مجاني",
};

const typeColors: Record<BookingRequestType, string> = {
  appointment: "bg-blue-100 text-blue-700",
  implant_diagnosis: "bg-purple-100 text-purple-700",
};

const statusLabels: Record<BookingStatus, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  in_review: "قيد المراجعة",
  diagnosed: "تم التشخيص",
  completed: "مكتمل",
  cancelled: "ملغي",
};

const statusColors: Record<BookingStatus, string> = {
  new: "bg-amber-100 text-amber-700",
  contacted: "bg-blue-100 text-blue-700",
  in_review: "bg-purple-100 text-purple-700",
  diagnosed: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

export default function BookingsTable({ bookings }: { bookings: DbBookingRequest[] }) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<"all" | BookingRequestType>("all");

  async function handleDelete(id: string, name: string) {
    if (!confirm(`هل أنت متأكد من حذف طلب "${name}"؟`)) return;
    await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const counts = useMemo(() => ({
    all: bookings.length,
    appointment: bookings.filter((b) => b.request_type === "appointment").length,
    implant_diagnosis: bookings.filter((b) => b.request_type === "implant_diagnosis").length,
  }), [bookings]);

  const filtered = typeFilter === "all" ? bookings : bookings.filter((b) => b.request_type === typeFilter);

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {([
          ["all", `الكل (${counts.all})`],
          ["appointment", `حجوزات (${counts.appointment})`],
          ["implant_diagnosis", `تشخيص مجاني (${counts.implant_diagnosis})`],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              typeFilter === key ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-slate-400">
          <Inbox className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p>لا يوجد طلبات بعد.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-600">الاسم</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-600">الهاتف</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-600">النوع</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-600">الحالة</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-600">التاريخ</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-slate-800">{b.name}</td>
                  <td className="px-5 py-4 text-slate-500" dir="ltr">{b.phone}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[b.request_type]}`}>
                      {typeLabels[b.request_type]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status]}`}>
                      {statusLabels[b.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">
                    {new Date(b.created_at).toLocaleDateString("ar-EG", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(b.id, b.name)}
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
      )}
    </div>
  );
}

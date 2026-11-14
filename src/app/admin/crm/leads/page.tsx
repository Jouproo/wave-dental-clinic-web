export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, FileSpreadsheet } from "lucide-react";
import { getSession, sessionHasPermission } from "@/lib/auth";
import LeadsTable from "./LeadsTable";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getSession();
  const can = (p: Parameters<typeof sessionHasPermission>[1]) => (session ? sessionHasPermission(session, p) : false);
  const canImport = can("crm.import");
  const raw = await searchParams;
  const initialParams = Object.fromEntries(
    Object.entries(raw).filter((e): e is [string, string] => typeof e[1] === "string")
  );

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">العملاء المحتملون</h1>
          <p className="text-slate-500 mt-1">متابعة الليدز من أول تواصل لحد بدء العلاج</p>
        </div>
        <div className="flex items-center gap-2">
          {canImport && (
            <Link
              href="/admin/crm/import"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors text-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              استيراد من إكسل
            </Link>
          )}
          <Link
            href="/admin/crm/leads/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            إضافة عميل محتمل
          </Link>
        </div>
      </div>

      <LeadsTable
        canArchive={can("crm.archive")}
        canAssign={can("crm.assign")}
        canExport={can("crm.export")}
        canUpdate={can("crm.update")}
        initialParams={initialParams}
      />
    </div>
  );
}

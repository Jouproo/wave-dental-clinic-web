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
    <div>
      <div className="crm-head mb-5">
        <div>
          <h1>العملاء</h1>
          <p>متابعة العملاء المحتملين من أول تواصل لحد بدء العلاج</p>
        </div>
        <div className="flex gap-2">
          {canImport && (
            <Link href="/admin/crm/import" className="crm-btn crm-btn-outline">
              <FileSpreadsheet className="w-4 h-4" /> استيراد
            </Link>
          )}
          <Link href="/admin/crm/leads/new" className="crm-btn crm-btn-blue">
            <Plus className="w-4 h-4" /> عميل
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

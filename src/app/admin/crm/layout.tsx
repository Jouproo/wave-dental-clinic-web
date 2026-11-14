export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession, sessionHasPermission } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase";
import { applyScope } from "@/lib/crm-scope";
import { addDays, dayStart, CLOSED_STAGES } from "@/lib/crm-config";
import { crmContext } from "@/lib/crm-stats";
import { CrmTabs, CrmSearch } from "./components/CrmTabs";
import { CrmConfigProvider } from "./components/CrmConfigProvider";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const { scope, config, today } = await crmContext(session);

  // Badge on "متابعات اليوم": open leads whose follow-up is due today or overdue.
  const tomorrow = dayStart(addDays(today, 1), config.timezone).toISOString();
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- builder generics don't survive applyScope */
  const base: any = supabaseServer().from("leads").select("id", { count: "exact", head: true })
    .is("archived_at", null).lt("next_follow_up_at", tomorrow)
    .not("stage", "in", `(${CLOSED_STAGES.join(",")})`);
  const { count: due } = await applyScope(base, scope);

  return (
    <CrmConfigProvider value={config}>
      <div className="crm p-4 sm:p-6 lg:p-8 grid gap-5 min-w-0">
        <div className="grid gap-3">
          <CrmTabs
            due={due ?? 0}
            canImport={sessionHasPermission(session, "crm.import")}
            canSettings={sessionHasPermission(session, "crm.settings.manage")}
          />
          <CrmSearch />
        </div>
        {children}
      </div>
    </CrmConfigProvider>
  );
}

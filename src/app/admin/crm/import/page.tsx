export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession, sessionHasPermission } from "@/lib/auth";
import ImportClient from "./ImportClient";

export default async function ImportPage() {
  const session = await getSession();
  // crm.import is admin-only by default (see src/lib/permissions.ts) — this
  // page is also reachable by URL by a sales role otherwise allowed into
  // /admin/crm/*, so it needs its own explicit check, not just a hidden link.
  if (!session || !sessionHasPermission(session, "crm.import")) {
    redirect("/admin/crm/leads");
  }
  return <ImportClient />;
}

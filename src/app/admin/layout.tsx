import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import AdminShell from "./components/AdminShell";

export const metadata: Metadata = {
  title: "لوحة التحكم - Wave Dental Clinic",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers();
  const isLoginPage = hdrs.get("x-pathname") === "/admin/login";

  if (isLoginPage) {
    return <AdminShell session={null}>{children}</AdminShell>;
  }

  // This is the real, DB-backed authorization boundary for page views —
  // re-checks status/role on every navigation (proxy.ts's JWT-only check is
  // advisory/UX-speed only and can't see a disabled account or role change
  // until the JWT expires).
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }
  if (session.status === "disabled") {
    redirect("/admin/login?disabled=1");
  }

  return <AdminShell session={session}>{children}</AdminShell>;
}

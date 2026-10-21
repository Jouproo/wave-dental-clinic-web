import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import AdminShell from "./components/AdminShell";

// Lets staff "Add to Home Screen" on /admin and get a standalone, full-screen
// app-like shortcut (icon + no browser chrome) — scoped to /admin only via
// the manifest's own "scope" field, so this never affects the public site.
export const metadata: Metadata = {
  title: "لوحة التحكم - Wave Dental Clinic",
  robots: { index: false, follow: false },
  manifest: "/admin-manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Wave Admin",
  },
};

export const viewport: Viewport = {
  themeColor: "#1672d6",
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

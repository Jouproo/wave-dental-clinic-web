import Link from "next/link";
import { LayoutDashboard, Users } from "lucide-react";

const crmNavItems = [
  { href: "/admin/crm", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/admin/crm/leads", label: "العملاء المحتملون", icon: Users },
];

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="border-b border-gray-200 bg-white px-8 pt-5">
        <nav className="flex gap-1 -mb-px">
          {crmNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-500 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-200 transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/settings", label: "Overview" },
  { href: "/settings/org", label: "Organization" },
  { href: "/settings/users", label: "Users & Roles" },
  { href: "/settings/integrations", label: "Integrations" },
  { href: "/settings/templates", label: "Templates" },
  { href: "/settings/pipelines", label: "Pipelines" },
  { href: "/settings/billing", label: "Billing" },
  { href: "/settings/api", label: "API Keys" },
  { href: "/settings/system-health", label: "System Health" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="-mx-4 overflow-x-auto px-4">
        <nav className="flex min-w-max items-center gap-2 border-b pb-3">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={{ pathname: link.href }}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}
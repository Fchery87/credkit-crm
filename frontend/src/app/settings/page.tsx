"use client";

import Link from "next/link";
import PageHeader from "@/components/PageHeader";

const CARDS = [
  { href: "/settings/org", title: "Organization", desc: "Brand identity, headquarters, locale" },
  { href: "/settings/users", title: "Users & Roles", desc: "Provision teammates and permissions" },
  { href: "/settings/integrations", title: "Integrations", desc: "Connect credit monitors, email, SMS" },
  { href: "/settings/templates", title: "Templates", desc: "Manage letter, email, and SMS templates" },
  { href: "/settings/pipelines", title: "Pipelines", desc: "Configure client and dispute stages" },
  { href: "/settings/billing", title: "Billing", desc: "Subscription, invoices, payment methods" },
  { href: "/settings/api", title: "API Keys", desc: "Create and rotate programmatic access" },
  { href: "/settings/system-health", title: "System Health", desc: "Platform uptime and webhook status" },
];

export default function SettingsIndexPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Configure your organization, team, integrations, and platform controls"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings" }]}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={{ pathname: card.href }}
            className="card-modern p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="h4 text-foreground">{card.title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
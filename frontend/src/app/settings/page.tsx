"use client";

import PageHeader from "@/components/PageHeader";
import Link from "next/link";

export default function SettingsIndexPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your account, organization, and billing"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings" }]}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: "/settings/profile", title: "Profile", desc: "Personal info and preferences" },
          { href: "/settings/billing", title: "Billing", desc: "Payment methods and invoices" },
          { href: "/settings/organization", title: "Organization", desc: "Team and roles" },
        ].map((card) => (
          <Link key={card.href} href={card.href} className="card-modern p-6 hover:shadow-md transition-shadow">
            <h3 className="h4">{card.title}</h3>
            <p className="text-sm text-muted-foreground">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
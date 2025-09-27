"use client";

import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SERVICES = [
  { name: "API", status: "Operational", detail: "All endpoints responding < 200ms" },
  { name: "Webhooks", status: "Degraded", detail: "Retrying 3 pending deliveries" },
  { name: "Credit bureau integrations", status: "Operational", detail: "Experian, Equifax, TransUnion" },
  { name: "Email delivery", status: "Operational", detail: "Last incident resolved 4d ago" },
  { name: "SMS delivery", status: "Monitoring", detail: "Carrier throughput limits in 2 regions" },
];

const statusStyles: Record<string, string> = {
  Operational: "bg-emerald-100 text-emerald-700",
  Degraded: "bg-amber-100 text-amber-700",
  Monitoring: "bg-sky-100 text-sky-700",
};

export default function SettingsSystemHealthPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="System Health"
        subtitle="Monitor core services and jump to incidents directly from the dashboard widget"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }, { label: "System Health" }]}
        actions={<Button variant="outline">View status page</Button>}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {SERVICES.map((service) => (
          <Card key={service.name}>
            <CardHeader>
              <CardTitle>{service.name}</CardTitle>
              <CardDescription>{service.detail}</CardDescription>
            </CardHeader>
            <CardContent>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
                  statusStyles[service.status] ?? "bg-zinc-100 text-zinc-600"
                )}
              >
                {service.status}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
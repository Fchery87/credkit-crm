"use client";

import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const INTEGRATIONS = [
  {
    name: "Credit monitoring",
    description: "Automate pulls from the bureaus and sync dispute-ready reports.",
    cta: "Configure",
  },
  {
    name: "Email",
    description: "Send transactional and marketing email through your ESP.",
    cta: "Connect",
  },
  {
    name: "SMS",
    description: "Enable appointment reminders and dispute notifications via SMS.",
    cta: "Connect",
  },
  {
    name: "E-sign",
    description: "Capture client signatures on onboarding agreements and letters.",
    cta: "Configure",
  },
  {
    name: "Payments",
    description: "Collect one-time and recurring payments directly in CredKit.",
    cta: "Set up",
  },
  {
    name: "Webhooks",
    description: "Stream real-time events into your downstream systems.",
    cta: "Manage",
  },
];

export default function SettingsIntegrationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        subtitle="Extend CredKit with credit monitors, messaging providers, and payments"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }, { label: "Integrations" }]}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {INTEGRATIONS.map((integration) => (
          <Card key={integration.name}>
            <CardHeader>
              <CardTitle>{integration.name}</CardTitle>
              <CardDescription>{integration.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm">{integration.cta}</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
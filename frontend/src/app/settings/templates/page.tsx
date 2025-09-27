"use client";

import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsTemplatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates"
        subtitle="Manage reusable letters, emails, and SMS sequences"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }, { label: "Templates" }]}
        actions={<Button>Create template</Button>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Dispute letters", description: "Shareable templates for bureau submissions" },
          { title: "Client emails", description: "Lifecycle and status updates" },
          { title: "SMS scripts", description: "Quick outreach and reminders" },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button size="sm" variant="outline">View library</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
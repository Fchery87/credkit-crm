"use client";

import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SAMPLE_KEYS = [
  { name: "Production key", token: "pk_live_9f2c…", created: "Mar 12, 2025", status: "Active" },
  { name: "Sandbox key", token: "pk_test_71ca…", created: "Feb 02, 2025", status: "Rotated" },
];

export default function SettingsApiKeysPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="API Keys"
        subtitle="Provision programmatic credentials and audit usage"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }, { label: "API Keys" }]}
        actions={<Button>Generate key</Button>}
      />
      <div className="grid gap-4">
        {SAMPLE_KEYS.map((key) => (
          <Card key={key.name}>
            <CardHeader>
              <CardTitle>{key.name}</CardTitle>
              <CardDescription>Created {key.created} • {key.status}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 md:flex-row md:items-center">
              <Input value={key.token} readOnly className="font-mono" />
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Copy</Button>
                <Button size="sm" variant="ghost">Revoke</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
"use client";

import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SettingsOrganizationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization"
        subtitle="Update your company identity, address, and operating preferences"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }, { label: "Organization" }]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Brand basics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization name</Label>
            <Input id="org-name" placeholder="CredKit CRM" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-timezone">Time zone</Label>
            <Input id="org-timezone" placeholder="America/New_York" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="org-address">Headquarters address</Label>
            <Textarea id="org-address" rows={3} placeholder="Street, City, State, Postal code" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="org-logo">Logo URL</Label>
            <Input id="org-logo" placeholder="https://" />
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button className="gap-2">Save changes</Button>
      </div>
    </div>
  );
}
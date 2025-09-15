"use client";

import PageHeader from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        subtitle="Update your personal information"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }, { label: "Profile" }]}
      />
      <div className="card-modern p-6 space-y-4">
        <div>
          <label className="text-sm text-muted-foreground">Full name</label>
          <Input placeholder="Your name" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Email</label>
          <Input type="email" placeholder="you@example.com" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Phone</label>
          <Input placeholder="+1 (555) 0123" />
        </div>
        <div className="flex justify-end">
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
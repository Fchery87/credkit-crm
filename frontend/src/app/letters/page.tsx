"use client";

import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";

export default function LettersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Letters"
        subtitle="Create and manage dispute letters"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Letters" }]}
        actions={<Button>Create Letter</Button>}
      />
      <div className="card-modern p-8">
        <p className="text-sm text-muted-foreground">Letters workspace coming soon.</p>
      </div>
    </div>
  );
}

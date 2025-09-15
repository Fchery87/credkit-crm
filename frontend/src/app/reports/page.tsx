"use client";

import PageHeader from "@/components/PageHeader";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Analyze performance and export summaries"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Reports" }]}
      />
      {/* Content placeholder */}
      <div className="card-modern p-8">
        <p className="text-sm text-muted-foreground">Reports coming soon.</p>
      </div>
    </div>
  );
}

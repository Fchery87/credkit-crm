"use client";

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { TEMPLATE_SEARCH_ITEMS } from "@/lib/global-search";

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates"
        subtitle="Browse pre-built templates for your team"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Templates" }]}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {TEMPLATE_SEARCH_ITEMS.map((template) => (
          <Link
            key={template.id}
            href={{ pathname: template.href }}
            className="card-modern p-6 hover:shadow-soft-md transition-shadow"
          >
            <h3 className="h4 text-foreground">{template.title}</h3>
            {template.description ? (
              <p className="text-sm text-muted-foreground mt-2">{template.description}</p>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
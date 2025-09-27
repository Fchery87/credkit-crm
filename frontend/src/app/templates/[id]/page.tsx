"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { TEMPLATE_SEARCH_ITEMS } from "@/lib/global-search";
import { Rocket } from "lucide-react";

export default function TemplateDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const template = useMemo(() => {
    const match = TEMPLATE_SEARCH_ITEMS.find((item) => item.id === id);
    return {
      id,
      title: match?.title ?? "Template",
      description: match?.description ?? "Template details coming soon.",
    };
  }, [id]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={template.title}
        subtitle={`Template ID: ${template.id}`}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Templates", href: "/templates" }, { label: template.id }]}
        actions={
          <Button className="gap-2">
            <Rocket className="h-4 w-4" />
            Use Template
          </Button>
        }
      />

      <div className="card-modern p-6 space-y-3 text-sm text-muted-foreground">
        <p>{template.description}</p>
        <p>
          Customize this template to match your brand guidelines and publish directly to your campaign workflows.
        </p>
      </div>
    </div>
  );
}
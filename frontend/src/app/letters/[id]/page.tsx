"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

export default function LetterDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const letter = useMemo(() => ({
    id,
    name: "Dispute Letter - Capital One",
    type: "PDF",
    created: "2024-01-20",
    size: "156 KB",
  }), [id]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={letter.name}
        subtitle={`Letter ID: ${letter.id}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Letters", href: "/letters" },
          { label: String(letter.id) },
        ]}
        actions={
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Download
          </Button>
        }
      />
      <div className="card-modern p-6">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Type: {letter.type} • Size: {letter.size} • Created: {letter.created}</span>
        </div>
        <p className="text-sm text-muted-foreground">Letter viewer/preview goes here.</p>
      </div>
    </div>
  );
}
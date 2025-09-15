"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Download, Share2, FileText, Image, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { bgTint, textColor, type BrandColor } from "@/lib/color-variants";

export default function FileDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const file = useMemo(() => ({
    id,
    name: "credit_report_sarah_johnson.pdf",
    type: "pdf" as "pdf" | "image" | "document" | "other",
    size: "2.4 MB",
    uploadedBy: "John Agent",
    uploadedDate: "2024-01-20",
    client: "Sarah Johnson",
    tags: ["Credit Report", "Experian"],
  }), [id]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf": return FileText;
      case "image": return Image;
      case "document": return File;
      default: return File;
    }
  };

  const getFileTypeColor = (type: string): BrandColor => {
    switch (type) {
      case "pdf": return "destructive";
      case "image": return "success";
      case "document": return "primary";
      default: return "muted";
    }
  };

  const Icon = getFileIcon(file.type);
  const color = getFileTypeColor(file.type);

  return (
    <div className="space-y-6">
      <PageHeader
        title={file.name}
        subtitle={`File ID: ${file.id}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Files", href: "/files" },
          { label: String(file.id) },
        ]}
        actions={
          <>
            <Button variant="outline" className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button className="gap-2">
              <Download className="w-4 h-4" />
              Download
            </Button>
          </>
        }
      />

      <div className="card-modern p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn("p-2 rounded-lg", bgTint[color])}>
            <Icon className={cn("w-5 h-5", textColor[color])} />
          </div>
          <div className="text-sm text-muted-foreground">
            <div>Size: {file.size}</div>
            <div>Uploaded: {file.uploadedDate} by {file.uploadedBy}</div>
            {file.client ? <div>Client: {file.client}</div> : null}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {file.tags.map((tag) => (
            <span key={tag} className="badge-info text-xs">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Download, Share2, FileText, Image, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { bgTint, textColor, type BrandColor } from "@/lib/color-variants";

export default function FileDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const file = useMemo(() => ({
    id,
    name: "credit_report_sarah_johnson.pdf",
    type: "pdf" as "pdf" | "image" | "document" | "other",
    size: "2.4 MB",
    uploadedBy: "John Agent",
    uploadedDate: "2024-01-20",
    client: "Sarah Johnson",
    tags: ["Credit Report", "Experian"],
  }), [id]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf": return FileText;
      case "image": return Image;
      case "document": return File;
      default: return File;
    }
  };

  const getFileTypeColor = (type: string): BrandColor => {
    switch (type) {
      case "pdf": return "destructive";
      case "image": return "success";
      case "document": return "primary";
      default: return "muted";
    }
  };

  const Icon = getFileIcon(file.type);
  const color = getFileTypeColor(file.type);

  return (
    <div className="space-y-6">
      <PageHeader
        title={file.name}
        subtitle={`File ID: ${file.id}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Files", href: "/files" },
          { label: String(file.id) },
        ]}
        actions={
          <>
            <Button variant="outline" className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button className="gap-2">
              <Download className="w-4 h-4" />
              Download
            </Button>
          </>
        }
      />

      <div className="card-modern p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn("p-2 rounded-lg", bgTint[color])}>
            <Icon className={cn("w-5 h-5", textColor[color])} />
          </div>
          <div className="text-sm text-muted-foreground">
            <div>Size: {file.size}</div>
            <div>Uploaded: {file.uploadedDate} by {file.uploadedBy}</div>
            {file.client ? <div>Client: {file.client}</div> : null}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {file.tags.map((tag) => (
            <span key={tag} className="badge-info text-xs">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
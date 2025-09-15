"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { FileText, BadgeCheck, Send, Clock, CheckCircle, Download } from "lucide-react";

export default function DisputeDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  // demo-only
  const dispute = useMemo(() => ({
    id,
    title: "Dispute late payment - Capital One",
    client: "Sarah Johnson",
    bureau: "Experian",
    status: "sent" as "draft" | "sent" | "response" | "resolved",
    createdDate: "2024-01-15",
    lastUpdate: "2024-01-20",
  }), [id]);

  const statusCfg =
    dispute.status === "draft" ? { cls: "badge-muted", icon: FileText, label: "Draft" } :
    dispute.status === "sent" ? { cls: "badge-info", icon: Send, label: "Sent" } :
    dispute.status === "response" ? { cls: "badge-warning", icon: Clock, label: "Response" } :
    { cls: "badge-success", icon: CheckCircle, label: "Resolved" };

  const StatusIcon = statusCfg.icon;

  return (
    <div className="space-y-6">
      <PageHeader
        title={dispute.title}
        subtitle={`Dispute ID: ${dispute.id}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Disputes", href: "/disputes" },
          { label: String(dispute.id) },
        ]}
        actions={
          <>
            <span className={`${statusCfg.cls} inline-flex items-center gap-1`}>
              <StatusIcon className="w-3 h-3" />
              {statusCfg.label}
            </span>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download Letter
            </Button>
          </>
        }
      />

      <div className="card-modern p-6">
        <p className="text-sm text-muted-foreground">
          Client: {dispute.client} • Bureau: {dispute.bureau} • Created {dispute.createdDate} • Updated {dispute.lastUpdate}
        </p>
      </div>
    </div>
  );
}
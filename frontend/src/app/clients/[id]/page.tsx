"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Calendar, Mail, Phone, User, CreditCard, FileText, CheckSquare, Folder } from "lucide-react";

export default function ClientDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [activeTab, setActiveTab] = useState("overview");

  // Demo data; replace with fetch by id
  const client = useMemo(() => ({
    id,
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "+1 (555) 0123",
    status: "Active",
    joined: "2024-01-15",
    plan: "Professional",
    disputes: 5,
    tasks: 3,
    documents: 12,
  }), [id]);

  const tabLabel =
    activeTab === "overview" ? "Overview" :
    activeTab === "disputes" ? "Disputes" :
    activeTab === "documents" ? "Documents" :
    activeTab === "tasks" ? "Tasks" :
    activeTab === "billing" ? "Billing" : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        subtitle={`Client ID: ${client.id}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Clients", href: "/clients" },
          { label: client.name, href: `/clients/${client.id}` },
          { label: tabLabel },
        ]}
        actions={
          <>
            <Button variant="outline" className="gap-2">
              <BadgeCheck className="w-4 h-4" />
              Verify
            </Button>
            <Button className="gap-2">
              <User className="w-4 h-4" />
              Edit Client
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar metrics */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-modern p-6">
            <h3 className="h4 mb-4">Overview</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{client.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{client.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Joined {client.joined}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{client.plan} Plan</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <div className="text-xs text-muted-foreground mb-1">Disputes</div>
                <div className="h3">{client.disputes}</div>
              </div>
              <div className="p-3 rounded-xl bg-secondary/10">
                <div className="text-xs text-muted-foreground mb-1">Tasks</div>
                <div className="h3">{client.tasks}</div>
              </div>
              <div className="p-3 rounded-xl bg-accent/10">
                <div className="text-xs text-muted-foreground mb-1">Documents</div>
                <div className="h3">{client.documents}</div>
              </div>
              <div className="p-3 rounded-xl bg-success/10">
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                <div className="h4 text-success">{client.status}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main tabs */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-muted/30 p-1 rounded-xl">
              <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
              <TabsTrigger value="disputes" className="rounded-lg">Disputes</TabsTrigger>
              <TabsTrigger value="documents" className="rounded-lg">Documents</TabsTrigger>
              <TabsTrigger value="tasks" className="rounded-lg">Tasks</TabsTrigger>
              <TabsTrigger value="billing" className="rounded-lg">Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="card-modern p-6">
                <p className="text-sm text-muted-foreground">
                  High-level summary and recent activity for {client.name} will appear here.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="disputes">
              <div className="card-modern p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-primary" />
                  <h3 className="h4">Client Disputes</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Integrate the client-specific disputes table here.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="documents">
              <div className="card-modern p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Folder className="w-4 h-4 text-primary" />
                  <h3 className="h4">Documents</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Client documents and uploads for this profile will be listed here.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="tasks">
              <div className="card-modern p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckSquare className="w-4 h-4 text-primary" />
                  <h3 className="h4">Tasks</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upcoming tasks and history for this client will be managed here.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="billing">
              <div className="card-modern p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <h3 className="h4">Billing</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Subscription, invoices, and payment history associated with this client.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
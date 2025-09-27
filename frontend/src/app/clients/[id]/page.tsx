
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Calendar, Mail, Phone, User, CreditCard, FileText, CheckSquare, Folder } from "lucide-react";
import DisputeSuggestionsPanel from "@/components/disputes/DisputeSuggestionsPanel";
import { SAMPLE_CLIENTS, getClientRoster, subscribeToClientRoster, type ClientRecord } from "@/lib/client-directory";

type ClientProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  joined: string;
  plan: string;
  disputes: number;
  tasks: number;
  documents: number;
};

export default function ClientDetailsPage() {
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const clientId = Array.isArray(rawId) ? rawId[0] : rawId;
  const [activeTab, setActiveTab] = useState("overview");
  const [clients, setClients] = useState<ClientRecord[]>(SAMPLE_CLIENTS);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setClients(getClientRoster());
    const unsubscribe = subscribeToClientRoster(setClients);
    return unsubscribe;
  }, []);

  const client = useMemo<ClientProfile>(() => {
    const match = clientId ? clients.find((record) => record.id === clientId) : undefined;
    if (match) {
      return {
        id: match.id,
        name: match.name,
        email: match.email,
        phone: match.phone,
        status: match.status === "inactive" ? "Inactive" : match.status === "pending" ? "Pending" : "Active",
        joined: match.joinDate,
        plan: match.stage,
        disputes: match.disputes,
        tasks: match.tasks,
        documents: (match as { documents?: number }).documents ?? 0,
      };
    }

    const fallback = SAMPLE_CLIENTS[0];
    return {
      id: clientId ?? fallback.id,
      name: fallback.name,
      email: fallback.email,
      phone: fallback.phone,
      status: fallback.status === "inactive" ? "Inactive" : fallback.status === "pending" ? "Pending" : "Active",
      joined: fallback.joinDate,
      plan: fallback.stage,
      disputes: fallback.disputes,
      tasks: fallback.tasks,
      documents: (fallback as { documents?: number }).documents ?? 0,
    };
  }, [clients, clientId]);

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
          { label: client.name, href: clientId ? `/clients/${clientId}` : "#" },
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
                <span className="text-muted-foreground">{client.plan}</span>
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
              <div className="space-y-4">
                <div className="card-modern p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-4 h-4 text-primary" />
                    <h3 className="h4">Client Disputes</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Review active disputes, letters, and system recommendations for this client.
                  </p>
                </div>
                <div className="card-modern p-6">
                  <DisputeSuggestionsPanel clientId={clientId} />
                </div>
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

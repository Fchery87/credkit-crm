"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  CheckSquare2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/tables/DataTable";
import TableToolbar from "@/components/tables/TableToolbar";
import { AddClientDialog, type AddClientFormValues } from "@/components/clients/AddClientDialog";
import {
  SAMPLE_CLIENTS,
  addClient as persistClient,
  getClientRoster,
  subscribeToClientRoster,
  type ClientRecord,
} from "@/lib/client-directory";

export default function ClientsPage() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [clients, setClients] = useState<ClientRecord[]>(SAMPLE_CLIENTS);
  const [viewMode, setViewMode] = useState<"all" | "active" | "pending">("all");
  const searchParams = useSearchParams();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setClients(getClientRoster());
    const unsubscribe = subscribeToClientRoster(setClients);
    return unsubscribe;
  }, []);

  const highlightId = searchParams?.get("highlight");
  useEffect(() => {
    if (!highlightId) return;
    setSelectedClients([highlightId]);
    setViewMode("all");
  }, [highlightId]);

  const handleClientCreate = (values: AddClientFormValues) => {
    const record = persistClient(values);
    if (typeof window !== "undefined") {
      setClients(getClientRoster());
    } else {
      setClients((previous) => [record, ...previous]);
    }
    setSelectedClients([record.id]);
    setViewMode("all");
    setSearchTerm("");
  };

  const filteredClients = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();
    const digitsSearch = searchTerm.replace(/\\D+/g, "");

    return clients.filter((client) => {
      const matchesName = client.name.toLowerCase().includes(normalizedSearch);
      const emailValue = client.email ? client.email.toLowerCase() : "";
      const emailMaskedValue = client.emailMasked ? client.emailMasked.toLowerCase() : "";
      const matchesEmail = normalizedSearch
        ? emailValue.includes(normalizedSearch) || emailMaskedValue.includes(normalizedSearch)
        : false;
      const phoneValue = client.phone ?? "";
      const phoneMaskedValue = client.phoneMasked ? client.phoneMasked.toLowerCase() : "";
      const matchesPhone =
        (digitsSearch ? phoneValue.includes(digitsSearch) : false) ||
        (normalizedSearch ? phoneMaskedValue.includes(normalizedSearch) : false);
      const matchesTags = normalizedSearch
        ? client.tags.some((tag) => tag.toLowerCase().includes(normalizedSearch))
        : false;
      const matchesSource = normalizedSearch
        ? (client.source ? client.source.toLowerCase().includes(normalizedSearch) : false)
        : false;
      const matchesSearch = normalizedSearch
        ? matchesName || matchesEmail || matchesPhone || matchesTags || matchesSource
        : true;
      const matchesView = viewMode === "all" || client.status === viewMode;
      return matchesSearch && matchesView;
    });
  }, [clients, searchTerm, viewMode]);

  const toggleSelect = (id: string) => {
    setSelectedClients((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  const allSelected =
    filteredClients.length > 0 &&
    selectedClients.length === filteredClients.length;

  const columns: Column<ClientRecord & { __select?: boolean }>[] = [
    {
      key: "id",
      label: "",
      render: (_value, item) => (
        <input
          type="checkbox"
          checked={selectedClients.includes(item.id)}
          onChange={() => toggleSelect(item.id)}
          className="rounded border-border"
        />
      ),
      width: "48px",
    },
    {
      key: "name",
      label: "Client",
      sortable: true,
      render: (_value, item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {item.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
          <div>
            <a
              href={`/clients/${item.id}`}
              className="font-medium text-foreground hover:text-primary transition-colors duration-150"
            >
              {item.name}
            </a>
            <div className="flex items-center gap-2 mt-1">
              {item.tags.map((tag) => (
                <span key={tag} className="badge-info text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Contact",
      render: (_value, item) => {
        const phoneFallback = item.phone && item.phone.length >= 4 ? "***-***-" + item.phone.slice(-4) : "Not provided";
        const emailDisplay = item.emailMasked ?? item.email ?? "Not provided";
        const phoneDisplay = item.phoneMasked ?? phoneFallback;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-3 h-3" />
              {emailDisplay}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-3 h-3" />
              {phoneDisplay}
            </div>
          </div>
        );
      },
    },
    {
      key: "stage",
      label: "Stage",
      render: (_value, item) => {
        const badgeClass =
          item.status === "active"
            ? "badge-success"
            : item.status === "pending"
            ? "badge-warning"
            : "badge-muted";
        return (
          <div className="space-y-1">
            <span className={"text-sm font-medium " + badgeClass}>
              {item.stage}
            </span>
            <p className="text-xs text-muted-foreground capitalize">{item.status}</p>
          </div>
        );
      },
    },
    {
      key: "joinDate",
      label: "Activity",
      render: (_value, item) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-3 h-3" />
            Joined {item.joinDate}
          </div>
          <div className="text-xs text-muted-foreground">
            Last activity: {item.lastActivity}
          </div>
        </div>
      ),
    },
    {
      key: "disputes",
      label: "Progress",
      render: (_value, item) => (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <FileText className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{item.disputes}</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckSquare2 className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{item.tasks}</span>
          </div>
        </div>
      ),
    },
    {
      key: "tasks",
      label: "",
      render: () => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      ),
      width: "48px",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded-xl w-48" />
          <div className="h-12 bg-muted rounded-xl" />
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-16 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        subtitle="Manage your client relationships and track progress"
        breadcrumbs={[{ label: "Home", href: "/" },
    { label: "Clients" }]}
        actions={
          <>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button className="gap-2" onClick={() => setAddClientOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Client
            </Button>
          </>
        }
        filters={
          <TableToolbar
            searchPlaceholder="Search clients..."
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            chips={[
              { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "pending", label: "Pending" },
            ]}
            selectedChip={viewMode}
            onChipSelect={(key) => setViewMode(key as typeof viewMode)}
            rightActions={
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            }
          />
        }
      />

      {selectedClients.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between"
        >
          <span className="text-sm font-medium text-primary">
            {selectedClients.length} client{selectedClients.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Update Stage
            </Button>
            <Button variant="outline" size="sm">
              Add Tags
            </Button>
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
        </motion.div>
      )}

      <div className="card-modern p-0 overflow-hidden">
        <div className="border-b px-4 py-2 flex items-center gap-3">
          <input
            type="checkbox"
            className="rounded border-border"
            checked={allSelected}
            onChange={() => {
              if (allSelected) {
                setSelectedClients([]);
              } else {
                setSelectedClients(filteredClients.map((client) => client.id));
              }
            }}
          />
          <span className="text-sm text-muted-foreground">Select all</span>
        </div>
        <DataTable<ClientRecord>
          data={filteredClients}
          columns={columns}
          loading={false}
          searchable={false}
          emptyMessage={
            searchTerm ? "No clients match your search" : "No clients found"
          }
          className="p-4"
        />
      </div>
      <AddClientDialog
        open={addClientOpen}
        onOpenChange={setAddClientOpen}
        onCreate={handleClientCreate}
      />
    </div>
  );
}












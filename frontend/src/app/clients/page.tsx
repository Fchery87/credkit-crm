"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Tag,
  CheckSquare2,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/tables/DataTable";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  stage: string;
  joinDate: string;
  lastActivity: string;
  status: "active" | "inactive" | "pending";
  tags: string[];
  disputes: number;
  tasks: number;
}

export default function ClientsPage() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"all" | "active" | "pending">("all");

  // Sample data
  const clients: Client[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "+1 (555) 0123",
      stage: "Active Client",
      joinDate: "2024-01-15",
      lastActivity: "2 hours ago",
      status: "active",
      tags: ["VIP", "High Priority"],
      disputes: 3,
      tasks: 2
    },
    {
      id: "2", 
      name: "Michael Brown",
      email: "m.brown@email.com",
      phone: "+1 (555) 0124",
      stage: "Prospect",
      joinDate: "2024-01-20",
      lastActivity: "1 day ago",
      status: "pending",
      tags: ["New Client"],
      disputes: 1,
      tasks: 1
    },
    {
      id: "3",
      name: "Jennifer Davis",
      email: "jen.davis@email.com", 
      phone: "+1 (555) 0125",
      stage: "Active Client",
      joinDate: "2024-01-10",
      lastActivity: "3 hours ago",
      status: "active",
      tags: ["Referral"],
      disputes: 5,
      tasks: 3
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesView = viewMode === "all" || client.status === viewMode;
    return matchesSearch && matchesView;
  });

  const toggleSelect = (id: string) => {
    setSelectedClients(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const allSelected = selectedClients.length > 0 && selectedClients.length === filteredClients.length;

  const columns: Column<Client & { __select?: boolean }> [] = [
    {
      key: "id",
      label: "",
      render: (_v, item) => (
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
      render: (_v, item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {item.name.split(" ").map(n => n[0]).join("")}
            </span>
          </div>
          <div>
            <a href={`/clients/${item.id}`} className="font-medium text-foreground hover:text-primary transition-colors duration-150">
              {item.name}
            </a>
            <div className="flex items-center gap-2 mt-1">
              {item.tags.map(tag => (
                <span key={tag} className="badge-info text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      key: "email",
      label: "Contact",
      render: (_v, item) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-3 h-3" />
            {item.email}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="w-3 h-3" />
            {item.phone}
          </div>
        </div>
      )
    },
    {
      key: "stage",
      label: "Stage",
      render: (_v, item) => {
        const badge =
          item.status === "active" ? "badge-success" :
          item.status === "pending" ? "badge-warning" : "badge-muted";
        return <span className={badge}>{item.stage}</span>;
      }
    },
    {
      key: "joinDate",
      label: "Activity",
      render: (_v, item) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-3 h-3" />
            Joined {item.joinDate}
          </div>
          <div className="text-xs text-muted-foreground">
            Last activity: {item.lastActivity}
          </div>
        </div>
      )
    },
    {
      key: "disputes",
      label: "Progress",
      render: (_v, item) => (
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
      )
    },
    {
      key: "tasks",
      label: "",
      render: (_v, item) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      ),
      width: "48px",
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded-xl w-48"></div>
          <div className="h-12 bg-muted rounded-xl"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-xl"></div>
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
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Clients" }]}
        actions={
          <>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Client
            </Button>
          </>
        }
        filters={
          <>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              {["all", "active", "pending"].map((view) => (
                <button
                  key={view}
                  onClick={() => setViewMode(view as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                    viewMode === view
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </>
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
            {selectedClients.length} client{selectedClients.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Update Stage</Button>
            <Button variant="outline" size="sm">Add Tags</Button>
            <Button variant="outline" size="sm">Export</Button>
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
                setSelectedClients(filteredClients.map(c => c.id));
              }
            }}
          />
          <span className="text-sm text-muted-foreground">Select all</span>
        </div>
        <DataTable<Client>
          data={filteredClients}
          columns={columns as any}
          loading={false}
          searchable={false}
          emptyMessage={searchTerm ? "No clients match your search" : "No clients found"}
          className="p-4"
        />
      </div>
    </div>
  );
}
      </div>
    </div>
  );
}
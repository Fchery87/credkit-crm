"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  Send,
  Calendar,
  User,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/tables/DataTable";
import TableToolbar from "@/components/tables/TableToolbar";

interface Dispute {
  id: string;
  title: string;
  client: string;
  bureau: "Experian" | "Equifax" | "TransUnion";
  status: "draft" | "sent" | "response" | "resolved";
  createdDate: string;
  lastUpdate: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
}

export default function DisputesPage() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selected, setSelected] = useState<string[]>([]);

  // Sample data
  const disputes: Dispute[] = [
    {
      id: "1",
      title: "Dispute late payment - Capital One",
      client: "Sarah Johnson",
      bureau: "Experian",
      status: "sent",
      createdDate: "2024-01-15",
      lastUpdate: "2024-01-20",
      dueDate: "2024-02-15",
      priority: "high",
    },
    {
      id: "2",
      title: "Remove collection account - ABC Collections",
      client: "Michael Brown",
      bureau: "Equifax",
      status: "response",
      createdDate: "2024-01-10",
      lastUpdate: "2024-01-25",
      dueDate: "2024-02-10",
      priority: "medium",
    },
    {
      id: "3",
      title: "Challenge account balance - Chase Bank",
      client: "Jennifer Davis",
      bureau: "TransUnion",
      status: "draft",
      createdDate: "2024-01-22",
      lastUpdate: "2024-01-22",
      dueDate: "2024-02-22",
      priority: "low",
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(
    () =>
      disputes.filter(d => {
        const matchesSearch =
          d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.client.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = selectedStatus === "all" || d.status === selectedStatus;
        return matchesSearch && matchesStatus;
      }),
    [disputes, searchTerm, selectedStatus]
  );

  const columns: Column<Dispute & { id: string }> [] = [
    {
      key: "id",
      label: "",
      render: (_v, item) => (
        <input
          type="checkbox"
          className="rounded border-border"
          checked={selected.includes(item.id)}
          onChange={() =>
            setSelected(prev =>
              prev.includes(item.id) ? prev.filter(v => v !== item.id) : [...prev, item.id]
            )
          }
        />
      ),
      width: "48px",
    },
    {
      key: "title",
      label: "Dispute",
      sortable: true,
      render: (_v, item) => (
        <div>
          <div className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer">
            {item.title}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {item.client}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {item.bureau}
            </span>
          </div>
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      filterable: true,
      render: (value) => {
        const cfg =
          value === "draft" ? { color: "badge-muted", icon: FileText, label: "Draft" } :
          value === "sent" ? { color: "badge-info", icon: Send, label: "Sent" } :
          value === "response" ? { color: "badge-warning", icon: Clock, label: "Response" } :
          { color: "badge-success", icon: CheckCircle, label: "Resolved" };
        const Icon = cfg.icon;
        return (
          <span className={`${cfg.color} inline-flex items-center gap-1`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
          </span>
        );
      }
    },
    {
      key: "createdDate",
      label: "Created",
      sortable: true,
    },
    {
      key: "dueDate",
      label: "Due",
      sortable: true,
    },
    {
      key: "lastUpdate",
      label: "Updated",
    },
    {
      key: "priority",
      label: "Priority",
      render: (value) => {
        const cls =
          value === "high" ? "badge-warning" :
          value === "medium" ? "badge-info" : "badge-muted";
        return <span className={cls}>{String(value)}</span>;
      }
    },
    {
      key: "id",
      label: "",
      render: () => (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      ),
      width: "48px",
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disputes"
        subtitle="Track and manage credit bureau disputes"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Disputes" }]}
        actions={
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Dispute
          </Button>
        }
        filters={
          <TableToolbar
            searchPlaceholder="Search disputes..."
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            chips={[
              { key: "all", label: "All" },
              { key: "draft", label: "Draft" },
              { key: "sent", label: "Sent" },
              { key: "response", label: "Response" },
              { key: "resolved", label: "Resolved" },
            ]}
            selectedChip={selectedStatus}
            onChipSelect={setSelectedStatus}
            rightActions={
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            }
          />
        }
      />

      {selected.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between"
        >
          <span className="text-sm font-medium text-primary">
            {selected.length} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Send</Button>
            <Button variant="outline" size="sm">Export</Button>
            <Button variant="outline" size="sm">Delete</Button>
          </div>
        </motion.div>
      )}

      <div className="card-modern p-0 overflow-hidden">
        <div className="border-b px-4 py-2 flex items-center gap-3">
          <input
            type="checkbox"
            className="rounded border-border"
            checked={selected.length > 0 && selected.length === filtered.length}
            onChange={() => {
              if (selected.length === filtered.length) {
                setSelected([]);
              } else {
                setSelected(filtered.map(d => d.id));
              }
            }}
          />
          <span className="text-sm text-muted-foreground">Select all</span>
        </div>

        <DataTable<Dispute>
          data={filtered}
          columns={columns as any}
          loading={loading}
          searchable={false}
          emptyMessage={searchTerm ? "No disputes match your search" : "No disputes found"}
          className="p-4"
        />
      </div>
    </div>
  );
}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
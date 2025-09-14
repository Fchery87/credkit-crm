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
  CheckSquare2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const handleSelectClient = (clientId: string) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    setSelectedClients(
      selectedClients.length === filteredClients.length 
        ? [] 
        : filteredClients.map(c => c.id)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "success";
      case "pending": return "warning";
      case "inactive": return "muted";
      default: return "muted";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-8 py-8">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="h1 text-foreground">Clients</h1>
              <p className="text-base text-muted-foreground mt-1">
                Manage your client relationships and track progress
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Client
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
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
          </div>

          {/* Bulk Actions */}
          {selectedClients.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between"
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
        </div>
      </motion.div>

      {/* Table Content */}
      <div className="container mx-auto px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut", delay: 0.1 }}
          className="card-modern overflow-hidden"
        >
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-border"
                  />
                </TableHead>
                <TableHead className="font-semibold text-foreground">Client</TableHead>
                <TableHead className="font-semibold text-foreground">Contact</TableHead>
                <TableHead className="font-semibold text-foreground">Stage</TableHead>
                <TableHead className="font-semibold text-foreground">Activity</TableHead>
                <TableHead className="font-semibold text-foreground">Progress</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client, index) => (
                <motion.tr
                  key={client.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.05 }}
                  className="group hover:bg-muted/30 transition-colors duration-150 border-b border-border/50"
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client.id)}
                      onChange={() => handleSelectClient(client.id)}
                      className="rounded border-border"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {client.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors duration-150">
                          {client.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {client.tags.map((tag) => (
                            <span key={tag} className="badge-info text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        {client.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {client.phone}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <span className={`badge-${getStatusColor(client.status)}`}>
                      {client.stage}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        Joined {client.joinDate}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last activity: {client.lastActivity}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{client.disputes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckSquare2 className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{client.tasks}</span>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem className="gap-2">
                          <Edit className="w-4 h-4" />
                          Edit Client
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Mail className="w-4 h-4" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Tag className="w-4 h-4" />
                          Manage Tags
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive">
                          <Trash2 className="w-4 h-4" />
                          Delete Client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>

          {/* Empty State */}
          {filteredClients.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="h4 text-foreground mb-2">No clients found</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first client"}
              </p>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Client
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Pagination */}
        {filteredClients.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.2 }}
            className="flex items-center justify-between mt-6"
          >
            <p className="text-sm text-muted-foreground">
              Showing {filteredClients.length} of {clients.length} clients
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                1
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Activity,
  Eye,
  Edit,
  Trash2,
  Plus,
  FileText,
  Settings
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
import { cn } from "@/lib/utils";
import { bgTint, textColor, type BrandColor } from "@/lib/color-variants";

interface AuditLog {
  id: string;
  timestamp: string;
  action: "create" | "read" | "update" | "delete" | "login" | "export";
  resource: "client" | "task" | "dispute" | "document" | "user" | "billing";
  resourceId: string;
  actor: string;
  actorRole: "admin" | "manager" | "user";
  ipAddress: string;
  userAgent: string;
  description: string;
  sensitive: boolean;
}

export default function AuditLogsPage() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedActor, setSelectedActor] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("7d");

  // Sample audit logs data
  const auditLogs: AuditLog[] = [
    {
      id: "1",
      timestamp: "2024-01-25T14:30:00Z",
      action: "create",
      resource: "client",
      resourceId: "client-123",
      actor: "john.agent@demo.com",
      actorRole: "user",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      description: "Created new client: Sarah Johnson",
      sensitive: true
    },
    {
      id: "2",
      timestamp: "2024-01-25T14:25:00Z",
      action: "update",
      resource: "task",
      resourceId: "task-456",
      actor: "jane.manager@demo.com",
      actorRole: "manager",
      ipAddress: "192.168.1.101",
      userAgent: "Mozilla/5.0 (macOS; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      description: "Updated task status to completed",
      sensitive: false
    },
    {
      id: "3",
      timestamp: "2024-01-25T14:20:00Z",
      action: "read",
      resource: "document",
      resourceId: "doc-789",
      actor: "admin@demo.com",
      actorRole: "admin",
      ipAddress: "192.168.1.102",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      description: "Viewed credit report document",
      sensitive: true
    },
    {
      id: "4",
      timestamp: "2024-01-25T14:15:00Z",
      action: "login",
      resource: "user",
      resourceId: "user-321",
      actor: "john.agent@demo.com",
      actorRole: "user",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      description: "User logged in successfully",
      sensitive: false
    },
    {
      id: "5",
      timestamp: "2024-01-25T14:10:00Z",
      action: "export",
      resource: "client",
      resourceId: "export-001",
      actor: "admin@demo.com",
      actorRole: "admin",
      ipAddress: "192.168.1.102",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      description: "Exported client data for compliance report",
      sensitive: true
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const getActionConfig = (action: string) => {
    switch (action) {
      case "create": return { color: "success", icon: Plus, label: "Create" };
      case "read": return { color: "info", icon: Eye, label: "Read" };
      case "update": return { color: "warning", icon: Edit, label: "Update" };
      case "delete": return { color: "destructive", icon: Trash2, label: "Delete" };
      case "login": return { color: "primary", icon: User, label: "Login" };
      case "export": return { color: "accent", icon: Download, label: "Export" };
      default: return { color: "muted", icon: Activity, label: "Unknown" };
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case "client": return User;
      case "task": return Activity;
      case "dispute": return FileText;
      case "document": return FileText;
      case "user": return User;
      case "billing": return Settings;
      default: return Activity;
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.actor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = selectedAction === "all" || log.action === selectedAction;
    const matchesActor = selectedActor === "all" || log.actorRole === selectedActor;
    return matchesSearch && matchesAction && matchesActor;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded-xl w-48"></div>
            <div className="h-12 bg-muted rounded-xl"></div>
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="h1 text-foreground">Audit Logs</h1>
            <p className="text-base text-muted-foreground mt-1">
              Monitor system activity and compliance events
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Logs
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Action Filter */}
          <div className="flex items-center gap-1 border border-border rounded-xl p-1">
            {["all", "create", "read", "update", "delete", "login", "export"].map((action) => (
              <button
                key={action}
                onClick={() => setSelectedAction(action)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
                  selectedAction === action
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {action.charAt(0).toUpperCase() + action.slice(1)}
              </button>
            ))}
          </div>

          {/* Actor Filter */}
          <div className="flex items-center gap-1 border border-border rounded-xl p-1">
            {["all", "admin", "manager", "user"].map((role) => (
              <button
                key={role}
                onClick={() => setSelectedActor(role)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
                  selectedActor === role
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-1 border border-border rounded-xl p-1">
            {["1d", "7d", "30d", "90d"].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
                  dateRange === range
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut", delay: 0.1 }}
          className="card-modern overflow-hidden"
        >
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="font-semibold text-foreground w-32">Time</TableHead>
                <TableHead className="font-semibold text-foreground w-24">Action</TableHead>
                <TableHead className="font-semibold text-foreground w-24">Resource</TableHead>
                <TableHead className="font-semibold text-foreground">Description</TableHead>
                <TableHead className="font-semibold text-foreground w-32">Actor</TableHead>
                <TableHead className="font-semibold text-foreground w-32">IP Address</TableHead>
                <TableHead className="font-semibold text-foreground w-16">Sensitive</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log, index) => {
                const actionConfig = getActionConfig(log.action);
                const ResourceIcon = getResourceIcon(log.resource);
                
                return (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.1, delay: index * 0.02 }}
                    className="group hover:bg-muted/20 transition-colors duration-150 border-b border-border/50"
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    
                    <TableCell>
                      <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-lg", bgTint[actionConfig.color as BrandColor], textColor[actionConfig.color as BrandColor])}>
                        <actionConfig.icon className="w-3 h-3" />
                        <span className="text-xs font-medium">{actionConfig.label}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ResourceIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground capitalize">{log.resource}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <p className="text-sm text-foreground">{log.description}</p>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        ID: {log.resourceId}
                      </p>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm text-foreground">{log.actor}</p>
                        <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${
                          log.actorRole === "admin" 
                            ? "bg-destructive/10 text-destructive"
                            : log.actorRole === "manager"
                            ? "bg-warning/10 text-warning"
                            : "bg-info/10 text-info"
                        }`}>
                          {log.actorRole}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.ipAddress}
                    </TableCell>
                    
                    <TableCell>
                      {log.sensitive && (
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3 text-warning" />
                          <span className="text-xs font-medium text-warning">Yes</span>
                        </div>
                      )}
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>

          {/* Empty State */}
          {filteredLogs.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="h4 text-foreground mb-2">No audit logs found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search terms or filters
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut", delay: 0.2 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          {[
            { label: "Total Events", value: auditLogs.length.toString(), color: "primary" },
            { label: "Sensitive Access", value: auditLogs.filter(l => l.sensitive).length.toString(), color: "warning" },
            { label: "Admin Actions", value: auditLogs.filter(l => l.actorRole === "admin").length.toString(), color: "destructive" },
            { label: "Today's Events", value: "24", color: "success" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15, delay: 0.3 + index * 0.05 }}
              className="card-modern p-6 text-center"
            >
              <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
              <p className={cn("h2", textColor[stat.color as BrandColor])}>{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Pagination */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.3 }}
          className="flex items-center justify-between mt-8"
        >
          <p className="text-sm text-muted-foreground">
            Showing {filteredLogs.length} of {auditLogs.length} events
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
              1
            </Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
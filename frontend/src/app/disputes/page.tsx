"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Eye,
  MoreHorizontal,
  Calendar,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";

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
  letterPreview: string;
}

export default function DisputesPage() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

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
      letterPreview: "Dear Experian, I am writing to dispute the following item on my credit report..."
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
      letterPreview: "Dear Equifax, Please investigate and remove the following collection account..."
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
      letterPreview: "Dear TransUnion, I am disputing the account balance for the following account..."
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "draft":
        return { color: "muted", icon: FileText, label: "Draft" };
      case "sent":
        return { color: "info", icon: Send, label: "Sent" };
      case "response":
        return { color: "warning", icon: Clock, label: "Response" };
      case "resolved":
        return { color: "success", icon: CheckCircle, label: "Resolved" };
      default:
        return { color: "muted", icon: FileText, label: "Unknown" };
    }
  };

  const getStepperProgress = (status: string) => {
    const steps = ["draft", "sent", "response", "resolved"];
    return steps.indexOf(status) + 1;
  };

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = dispute.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dispute.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || dispute.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded-xl w-48"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted rounded-xl"></div>
                ))}
              </div>
              <div className="h-96 bg-muted rounded-xl"></div>
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
        <PageHeader
          title="Disputes"
          subtitle="Track and manage credit bureau disputes"
          actions={
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Dispute
            </Button>
          }
        />

        {/* Search and Status Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search disputes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {[
              { key: "all", label: "All" },
              { key: "draft", label: "Draft" },
              { key: "sent", label: "Sent" },
              { key: "response", label: "Response" },
              { key: "resolved", label: "Resolved" }
            ].map((status) => (
              <button
                key={status.key}
                onClick={() => setSelectedStatus(status.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                  selectedStatus === status.key
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Disputes List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, ease: "easeOut", delay: 0.1 }}
            className="lg:col-span-2 space-y-4"
          >
            {filteredDisputes.map((dispute, index) => {
              const statusConfig = getStatusConfig(dispute.status);
              const progress = getStepperProgress(dispute.status);
              
              return (
                <motion.div
                  key={dispute.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.05 }}
                  className={`card-modern p-6 cursor-pointer transition-all duration-200 ${
                    selectedDispute?.id === dispute.id 
                      ? "ring-2 ring-primary/20 border-primary/30" 
                      : "hover:shadow-soft-md"
                  }`}
                  onClick={() => setSelectedDispute(dispute)}
                >
                  {/* Dispute Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-2">{dispute.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {dispute.client}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {dispute.bureau}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due {dispute.dueDate}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`badge-${statusConfig.color} flex items-center gap-1`}>
                        <statusConfig.icon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                      <button className="p-1 rounded-lg hover:bg-muted transition-colors duration-150">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Stepper */}
                  <div className="flex items-center gap-2 mb-4">
                    {["Draft", "Sent", "Response", "Resolved"].map((step, stepIndex) => (
                      <div key={step} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200 ${
                          stepIndex < progress
                            ? "bg-primary text-primary-foreground"
                            : stepIndex === progress - 1
                            ? "bg-primary/20 text-primary border-2 border-primary"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {stepIndex < progress - 1 ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            stepIndex + 1
                          )}
                        </div>
                        {stepIndex < 3 && (
                          <div className={`w-12 h-0.5 mx-2 transition-colors duration-200 ${
                            stepIndex < progress - 1 ? "bg-primary" : "bg-muted"
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Timeline */}
                  <div className="text-xs text-muted-foreground">
                    Created {dispute.createdDate} • Updated {dispute.lastUpdate}
                  </div>
                </motion.div>
              );
            })}

            {/* Empty State */}
            {filteredDisputes.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="card-modern p-12 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="h4 text-foreground mb-2">No disputes found</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {searchTerm ? "Try adjusting your search terms" : "Create your first dispute to get started"}
                </p>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create First Dispute
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* Letter Preview Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, ease: "easeOut", delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="card-modern p-6 sticky top-32">
              {selectedDispute ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="h4 text-foreground">Letter Preview</h3>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="w-4 h-4" />
                      Full View
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/30 rounded-xl">
                      <h4 className="font-medium text-foreground mb-2">{selectedDispute.title}</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Client: {selectedDispute.client}</p>
                        <p>Bureau: {selectedDispute.bureau}</p>
                        <p>Priority: {selectedDispute.priority}</p>
                      </div>
                    </div>
                    
                    <div className="border border-border rounded-xl p-4 bg-background">
                      <h5 className="text-sm font-medium text-foreground mb-3">Letter Content</h5>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {selectedDispute.letterPreview}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        Edit Letter
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Send Now
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h4 className="font-medium text-foreground mb-2">Select a dispute</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose a dispute from the list to preview the letter
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
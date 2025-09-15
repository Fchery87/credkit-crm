"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  FileText,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  MessageSquare,
  Calendar,
  TrendingUp,
  AlertCircle,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";

interface ClientData {
  name: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
  plan: string;
  status: string;
}

interface DisputeItem {
  id: string;
  title: string;
  bureau: string;
  status: "draft" | "sent" | "response" | "resolved";
  submittedDate: string;
  expectedResolution: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
}

export default function ClientPortalPage() {
  const [loading, setLoading] = useState(true);

  // Sample client data
  const clientData: ClientData = {
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 0123",
    address: "123 Main St, Anytown, ST 12345",
    joinDate: "January 15, 2024",
    plan: "Professional",
    status: "Active"
  };

  const disputes: DisputeItem[] = [
    {
      id: "1",
      title: "Capital One Late Payment",
      bureau: "Experian",
      status: "response",
      submittedDate: "Jan 20, 2024",
      expectedResolution: "Feb 20, 2024"
    },
    {
      id: "2",
      title: "Collection Account - ABC Collections",
      bureau: "Equifax",
      status: "sent",
      submittedDate: "Jan 18, 2024",
      expectedResolution: "Feb 18, 2024"
    },
    {
      id: "3",
      title: "Credit Inquiry - Auto Loan",
      bureau: "TransUnion",
      status: "resolved",
      submittedDate: "Jan 10, 2024",
      expectedResolution: "Feb 10, 2024"
    }
  ];

  const documents: Document[] = [
    {
      id: "1",
      name: "Credit Report - Experian",
      type: "PDF",
      uploadDate: "Jan 20, 2024",
      size: "2.4 MB"
    },
    {
      id: "2",
      name: "Dispute Letter - Capital One",
      type: "PDF",
      uploadDate: "Jan 20, 2024",
      size: "156 KB"
    },
    {
      id: "3",
      name: "Service Agreement",
      type: "PDF",
      uploadDate: "Jan 15, 2024",
      size: "890 KB"
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "draft": return { color: "muted", label: "Draft" };
      case "sent": return { color: "info", label: "Submitted" };
      case "response": return { color: "warning", label: "Under Review" };
      case "resolved": return { color: "success", label: "Resolved" };
      default: return { color: "muted", label: "Unknown" };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded-xl w-48"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded-xl"></div>
                ))}
              </div>
              <div className="lg:col-span-2 h-96 bg-muted rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={`Welcome back, ${clientData.name.split(' ')[0]}`}
        subtitle="Track your credit repair progress and manage your account"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Client Portal" }]}
        actions={
          <div className="flex items-center gap-3">
            <span className="badge-success">
              {clientData.status}
            </span>
            <Button variant="outline" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Contact Support
            </Button>
          </div>
        }
      />

      <div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Progress Overview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, ease: "easeOut", delay: 0.1 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Progress Card */}
            <div className="card-modern p-6">
              <h3 className="h4 text-foreground mb-6">Your Progress</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Disputes Filed</span>
                  <span className="font-semibold text-foreground">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Resolved</span>
                  <span className="font-semibold text-success">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">In Progress</span>
                  <span className="font-semibold text-warning">2</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-success">33% Success Rate</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  You're making great progress on your credit repair journey!
                </p>
              </div>
            </div>

            {/* Account Info */}
            <div className="card-modern p-6">
              <h3 className="h4 text-foreground mb-4">Account Info</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{clientData.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{clientData.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Joined {clientData.joinDate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{clientData.plan} Plan</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, ease: "easeOut", delay: 0.2 }}
            className="lg:col-span-3"
          >
            <Tabs defaultValue="disputes" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-muted/30 p-1 rounded-xl">
                <TabsTrigger value="disputes" className="rounded-lg">Disputes</TabsTrigger>
                <TabsTrigger value="documents" className="rounded-lg">Documents</TabsTrigger>
                <TabsTrigger value="billing" className="rounded-lg">Billing</TabsTrigger>
              </TabsList>

              {/* Disputes Tab */}
              <TabsContent value="disputes" className="space-y-6">
                <div className="card-modern p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="h2 text-foreground">Your Disputes</h2>
                      <p className="text-base text-muted-foreground mt-1">
                        Track the progress of your credit report disputes
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {disputes.map((dispute, index) => {
                      const statusConfig = getStatusConfig(dispute.status);
                      
                      return (
                        <motion.div
                          key={dispute.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15, delay: index * 0.05 }}
                          className="border border-border rounded-2xl p-6 hover:shadow-soft-md transition-all duration-200"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-foreground mb-2">{dispute.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Bureau: {dispute.bureau}</span>
                                <span>Submitted: {dispute.submittedDate}</span>
                              </div>
                            </div>
                            <span className={`badge-${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </div>

                          {/* Progress Timeline */}
                          <div className="flex items-center gap-2 mb-4">
                            {["Draft", "Submitted", "Under Review", "Resolved"].map((step, stepIndex) => {
                              const isActive = stepIndex <= ["draft", "sent", "response", "resolved"].indexOf(dispute.status);
                              const isCurrent = stepIndex === ["draft", "sent", "response", "resolved"].indexOf(dispute.status);
                              
                              return (
                                <div key={step} className="flex items-center">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200 ${
                                    isActive
                                      ? isCurrent
                                        ? "bg-primary text-primary-foreground border-2 border-primary"
                                        : "bg-success text-success-foreground"
                                      : "bg-muted text-muted-foreground"
                                  }`}>
                                    {isActive && !isCurrent ? (
                                      <CheckCircle className="w-4 h-4" />
                                    ) : (
                                      stepIndex + 1
                                    )}
                                  </div>
                                  {stepIndex < 3 && (
                                    <div className={`w-12 h-0.5 mx-2 transition-colors duration-200 ${
                                      stepIndex < ["draft", "sent", "response", "resolved"].indexOf(dispute.status) 
                                        ? "bg-success" 
                                        : "bg-muted"
                                    }`} />
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Expected resolution: {dispute.expectedResolution}</span>
                            <Button variant="ghost" size="sm" className="gap-1">
                              <FileText className="w-3 h-3" />
                              View Details
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-6">
                <div className="card-modern p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="h2 text-foreground">Your Documents</h2>
                      <p className="text-base text-muted-foreground mt-1">
                        Access your credit reports, letters, and agreements
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc, index) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.15, delay: index * 0.05 }}
                        className="border border-border rounded-xl p-4 hover:shadow-soft-md transition-all duration-200 group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground text-sm group-hover:text-primary transition-colors duration-150">
                              {doc.name}
                            </h4>
                            <p className="text-xs text-muted-foreground">{doc.size} • {doc.type}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{doc.uploadDate}</span>
                          <Button variant="ghost" size="sm" className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Download className="w-3 h-3" />
                            Download
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Billing Tab */}
              <TabsContent value="billing" className="space-y-6">
                <div className="card-modern p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="h2 text-foreground">Billing & Subscription</h2>
                      <p className="text-base text-muted-foreground mt-1">
                        Manage your subscription and view billing history
                      </p>
                    </div>
                  </div>

                  {/* Current Plan */}
                  <div className="border border-border rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="h3 text-foreground">{clientData.plan} Plan</h3>
                        <p className="text-sm text-muted-foreground">Active subscription</p>
                      </div>
                      <div className="text-right">
                        <p className="h3 text-foreground">$79.99</p>
                        <p className="text-sm text-muted-foreground">per month</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-muted/30 rounded-xl">
                        <p className="text-sm text-muted-foreground">Next Billing</p>
                        <p className="font-semibold text-foreground">Feb 15, 2024</p>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-xl">
                        <p className="text-sm text-muted-foreground">Letters Used</p>
                        <p className="font-semibold text-foreground">12 / 500</p>
                      </div>
                    </div>
                    
                    <Button variant="outline" className="w-full">
                      Manage Subscription
                    </Button>
                  </div>

                  {/* Recent Invoices */}
                  <div>
                    <h3 className="h4 text-foreground mb-4">Recent Invoices</h3>
                    <div className="space-y-3">
                      {[
                        { date: "Jan 15, 2024", amount: "$79.99", status: "Paid" },
                        { date: "Dec 15, 2023", amount: "$79.99", status: "Paid" },
                        { date: "Nov 15, 2023", amount: "$79.99", status: "Paid" }
                      ].map((invoice, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.15, delay: 0.3 + index * 0.05 }}
                          className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/30 transition-colors duration-150"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-success/10">
                              <CreditCard className="w-4 h-4 text-success" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{invoice.amount}</p>
                              <p className="text-sm text-muted-foreground">{invoice.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="badge-success">{invoice.status}</span>
                            <Button variant="ghost" size="sm" className="gap-1">
                              <Download className="w-3 h-3" />
                              PDF
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
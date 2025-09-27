"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  Users,
  FileText,
  Mail,
  CheckSquare,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Filter,
  Clock,
  AlertCircle,
} from "lucide-react";
import { DashboardChart } from "@/components/charts/DashboardChart";
import { cn } from "@/lib/utils";
import { bgTint, hoverBgTintGroup, textColor, bgSolid, type BrandColor } from "@/lib/color-variants";
import PageHeader from "@/components/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { addClient as persistClient } from "@/lib/client-directory";
import { AddClientDialog, type AddClientFormValues } from "@/components/clients/AddClientDialog";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const navigate = (path: string) => navigate(path as any);
  const [loading, setLoading] = useState(true);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [letterDialogOpen, setLetterDialogOpen] = useState(false);

  const initialTaskForm = {
    title: "",
    client: "",
    assignee: "",
    priority: "medium",
    due: "",
  };
  const initialDisputeForm = {
    client: "",
    bureau: "Experian",
    items: "",
  };
  const initialLetterForm = {
    client: "",
    template: "",
    delivery: "download",
    attachments: "",
  };

  const [taskForm, setTaskForm] = useState(initialTaskForm);
  const [disputeForm, setDisputeForm] = useState(initialDisputeForm);
  const [letterForm, setLetterForm] = useState(initialLetterForm);

  const role = user?.role?.toString().toLowerCase() ?? "";
  const canEditCharts = role === "admin" || role === "manager";

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleAddClient = (values: AddClientFormValues) => {
    const record = persistClient(values);
    navigate(`/clients?highlight=${encodeURIComponent(record.id)}`);
  };

  const resetTaskForm = () => setTaskForm(initialTaskForm);
  const resetDisputeForm = () => setDisputeForm(initialDisputeForm);
  const resetLetterForm = () => setLetterForm(initialLetterForm);

  const downloadCsv = (rows: Array<Record<string, unknown>>, filename: string) => {
    if (!rows.length || typeof window === "undefined") return;
    const headers = Object.keys(rows[0]);
    const csvRows = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const raw = row[header];
            const value = raw == null ? "" : String(raw).replace(/"/g, '""');
            return `"${value}"`;
          })
          .join(","),
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const copyChartLink = (path: string) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${path}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  };

  const handleLeadNavigate = (datum: Record<string, unknown>) => {
    const period = typeof datum.period === "string" ? datum.period : "";
    if (period) {
      navigate(`/analytics/leads?month=${period}`);
    }
  };

  const handleTaskNavigate = (datum: Record<string, unknown>) => {
    const week = typeof datum.week === "string" ? datum.week : "";
    if (week) {
      navigate(`/tasks?range=${week}&view=list`);
    }
  };

  const handleTaskSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newId = `task-${Date.now()}`;
    setTaskDialogOpen(false);
    await new Promise((resolve) => setTimeout(resolve, 250));
    resetTaskForm();
    navigate(`/tasks/${newId}`);
  };

  const handleDisputeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newId = `dispute-${Date.now()}`;
    setDisputeDialogOpen(false);
    await new Promise((resolve) => setTimeout(resolve, 250));
    resetDisputeForm();
    navigate(`/disputes/${newId}`);
  };

  const handleLetterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newId = `letter-${Date.now()}`;
    setLetterDialogOpen(false);
    await new Promise((resolve) => setTimeout(resolve, 250));
    resetLetterForm();
    navigate(`/letters/${newId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="text-lg text-muted-foreground"
        >
          Loading dashboard...
        </motion.div>
      </div>
    );
  }

  const kpiData = [
    {
      title: "Active Clients",
      value: "247",
      change: "+12%",
      trend: "up" as const,
      icon: Users,
      color: "primary" as BrandColor,
      description: "vs last month",
      href: "/clients?status=active",
    },
    {
      title: "Disputes Open",
      value: "89",
      change: "+5%",
      trend: "up" as const,
      icon: FileText,
      color: "secondary" as BrandColor,
      description: "in progress",
      href: "/disputes?status=open",
    },
    {
      title: "Letters Sent",
      value: "156",
      change: "+23%",
      trend: "up" as const,
      icon: Mail,
      color: "accent" as BrandColor,
      description: "this month",
      href: "/letters?period=this_month",
    },
    {
      title: "Tasks Due",
      value: "12",
      change: "-8%",
      trend: "down" as const,
      icon: CheckSquare,
      color: "warning" as BrandColor,
      description: "today",
      href: "/tasks?due=today",
    },
    {
      title: "Monthly Revenue",
      value: "$24,580",
      change: "+18%",
      trend: "up" as const,
      icon: DollarSign,
      color: "success" as BrandColor,
      description: "recurring",
      href: "/analytics/revenue?period=current",
    },
  ];

  const conversionData = [
    { name: "Jan", leads: 45, clients: 32, period: "2025-01" },
    { name: "Feb", leads: 52, clients: 38, period: "2025-02" },
    { name: "Mar", leads: 48, clients: 35, period: "2025-03" },
    { name: "Apr", leads: 61, clients: 42, period: "2025-04" },
    { name: "May", leads: 55, clients: 39, period: "2025-05" },
    { name: "Jun", leads: 67, clients: 48, period: "2025-06" },
  ];

  const throughputData = [
    { name: "Week 1", completed: 23, week: "2025-W01" },
    { name: "Week 2", completed: 31, week: "2025-W02" },
    { name: "Week 3", completed: 28, week: "2025-W03" },
    { name: "Week 4", completed: 35, week: "2025-W04" },
  ];

  const quickActions: Array<{ icon: any; label: string; desc: string; color: BrandColor; onClick: () => void }> = [
    {
      icon: Users,
      label: "Add Client",
      desc: "Start new case",
      color: "primary",
      onClick: () => setAddClientOpen(true),
    },
    {
      icon: CheckSquare,
      label: "Create Task",
      desc: "Add to pipeline",
      color: "secondary",
      onClick: () => setTaskDialogOpen(true),
    },
    {
      icon: FileText,
      label: "New Dispute",
      desc: "File dispute",
      color: "accent",
      onClick: () => setDisputeDialogOpen(true),
    },
    {
      icon: Mail,
      label: "Send Letter",
      desc: "Generate letter",
      color: "warning",
      onClick: () => setLetterDialogOpen(true),
    },
  ];

  const leadMenuActions = [
    { label: "Download CSV", onClick: () => downloadCsv(conversionData, "lead-conversion.csv") },
    { label: "Copy image", onClick: () => copyChartLink("/analytics/leads") },
    ...(canEditCharts ? [{ label: "Edit chart", onClick: () => navigate("/analytics/leads?edit=true") }] : []),
  ];

  const taskMenuActions = [
    { label: "Download CSV", onClick: () => downloadCsv(throughputData, "task-throughput.csv") },
    { label: "Copy image", onClick: () => copyChartLink("/tasks?view=charts") },
    ...(canEditCharts ? [{ label: "Edit chart", onClick: () => navigate("/tasks?view=analytics") }] : []),
  ];

  const activities = [
    {
      id: 1,
      type: "client_added",
      title: "New client added",
      description: "Sarah Johnson signed up for Professional plan",
      time: "2 minutes ago",
      icon: Users,
      color: "primary" as BrandColor,
      href: "/clients/1",
    },
    {
      id: 2,
      type: "dispute_resolved",
      title: "Dispute resolved",
      description: "Capital One account removed for Michael Brown",
      time: "1 hour ago",
      icon: CheckSquare,
      color: "success" as BrandColor,
      href: "/disputes/2",
    },
    {
      id: 3,
      type: "letter_sent",
      title: "Dispute letter sent",
      description: "3 letters sent to credit bureaus for Jane Doe",
      time: "3 hours ago",
      icon: Mail,
      color: "secondary" as BrandColor,
      href: "/letters/101",
    },
    {
      id: 4,
      type: "task_overdue",
      title: "Task overdue",
      description: "Follow-up call for David Wilson is 2 days overdue",
      time: "5 hours ago",
      icon: AlertCircle,
      color: "warning" as BrandColor,
      href: "/tasks/task-4",
    },
  ];

  const systemHealth = [
    {
      label: "API Status",
      status: "Operational",
      color: "success" as BrandColor,
      detail: "Uptime 99.9% last 7 days",
      incidentId: null,
    },
    {
      label: "Database",
      status: "Operational",
      color: "success" as BrandColor,
      detail: "Primary + replica healthy",
      incidentId: null,
    },
    {
      label: "Real-time",
      status: "Degraded",
      color: "warning" as BrandColor,
      detail: "Intermittent socket reconnects",
      incidentId: "rt-20250927",
    },
    {
      label: "Integrations",
      status: "Operational",
      color: "success" as BrandColor,
      detail: "All providers online",
      incidentId: null,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.22, ease: "easeOut" },
    },
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        subtitle="Monitor your credit repair business performance"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dashboard" }]}
        actions={
          <>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted transition-all duration-150 text-sm font-medium">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button
              type="button"
              onClick={() => setAddClientOpen(true)}
              className="button-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Client
            </button>
          </>
        }
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
      >
        {kpiData.map((kpi) => (
          <motion.button
            type="button"
            key={kpi.title}
            variants={itemVariants}
            onClick={() => navigate(kpi.href)}
            className="card-modern p-6 group text-left cursor-pointer hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={cn(
                  "p-3 rounded-xl transition-colors duration-200",
                  bgTint[kpi.color],
                  hoverBgTintGroup[kpi.color]
                )}
              >
                <kpi.icon className={cn("w-5 h-5", textColor[kpi.color])} />
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  kpi.trend === "up" ? "text-success" : "text-destructive"
                )}
              >
                {kpi.trend === "up" ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {kpi.change}
              </div>
            </div>
            <div>
              <p className="h2 text-foreground mb-1">{kpi.value}</p>
              <p className="text-sm text-muted-foreground">{kpi.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
            </div>
          </motion.button>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22, ease: "easeOut", delay: 0.3 }}
        >
          <DashboardChart
            type="line"
            data={conversionData}
            primaryKey="clients"
            xKey="name"
            color="hsl(210, 90%, 50%)"
            title="Lead Conversion"
            description="Leads to clients over time"
            onPointNavigate={handleLeadNavigate}
            menuActions={leadMenuActions}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22, ease: "easeOut", delay: 0.4 }}
        >
          <DashboardChart
            type="bar"
            data={throughputData}
            primaryKey="completed"
            xKey="name"
            color="hsl(174, 72%, 56%)"
            title="Task Throughput"
            description="Completed tasks per week"
            onPointNavigate={handleTaskNavigate}
            menuActions={taskMenuActions}
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut", delay: 0.5 }}
          className="lg:col-span-2"
        >
          <div className="card-modern p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="h3 text-foreground">Recent Activity</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Latest updates across your organization
                </p>
              </div>
              <Link
                href={{ pathname: "/activity", query: { view: "timeline" } }}
                className="text-sm font-medium text-primary hover:text-primary-hover transition-colors duration-150"
              >
                View all
              </Link>
            </div>

            <div className="space-y-6">
              {activities.map((activity, index) => (
                <motion.button
                  key={activity.id}
                  type="button"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: 0.6 + index * 0.05 }}
                  onClick={() => navigate(activity.href)}
                  className="flex w-full items-start gap-4 rounded-xl p-4 text-left transition-all duration-150 hover:bg-muted/50 group"
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg transition-colors duration-200",
                      bgTint[activity.color],
                      hoverBgTintGroup[activity.color]
                    )}
                  >
                    <activity.icon className={cn("w-4 h-4", textColor[activity.color])} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground transition-colors duration-150 group-hover:text-primary">
                      {activity.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut", delay: 0.6 }}
          className="space-y-6"
        >
          <div className="card-modern p-6">
            <h3 className="h4 text-foreground mb-6">Quick Actions</h3>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.label}
                  type="button"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: 0.7 + index * 0.05 }}
                  onClick={action.onClick}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/50 hover:border-primary/20 transition-all duration-150 text-left group"
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg transition-colors duration-200",
                      bgTint[action.color],
                      hoverBgTintGroup[action.color]
                    )}
                  >
                    <action.icon className={cn("w-4 h-4", textColor[action.color])} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground transition-colors duration-150 group-hover:text-primary">
                      {action.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="card-modern p-6">
            <h3 className="h4 text-foreground mb-4">System Health</h3>
            <div className="space-y-4">
              {systemHealth.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15, delay: 0.8 + index * 0.05 }}
                  className="rounded-lg border border-border p-3 transition-colors hover:border-primary/30 hover:bg-muted cursor-pointer"
                  onClick={() => navigate("/settings/system-health")}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", bgSolid[item.color])}></div>
                      <span className={cn("text-xs font-medium", textColor[item.color])}>{item.status}</span>
                    </div>
                  </div>
                  {item.incidentId ? (
                    <Button
                      variant="link"
                      size="sm"
                      className="px-0 text-xs"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/status/${item.incidentId}`);
                      }}
                    >
                      View incident
                    </Button>
                  ) : null}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <AddClientDialog open={addClientOpen} onOpenChange={setAddClientOpen} onCreate={handleAddClient} />

      <Dialog
        open={taskDialogOpen}
        onOpenChange={(open) => {
          setTaskDialogOpen(open);
          if (!open) resetTaskForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>
              Assign work to your team and track it in the pipeline.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTaskSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                required
                value={taskForm.title}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-client">Client (optional)</Label>
              <Input
                id="task-client"
                value={taskForm.client}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, client: event.target.value }))}
                placeholder="Client name or ID"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="task-assignee">Assignee</Label>
                <Input
                  id="task-assignee"
                  value={taskForm.assignee}
                  onChange={(event) => setTaskForm((prev) => ({ ...prev, assignee: event.target.value }))}
                  placeholder="Assign to"
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={taskForm.priority}
                  onValueChange={(value) => setTaskForm((prev) => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Due date</Label>
              <Input
                id="task-due"
                type="date"
                value={taskForm.due}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, due: event.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTaskDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={disputeDialogOpen}
        onOpenChange={(open) => {
          setDisputeDialogOpen(open);
          if (!open) resetDisputeForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Dispute</DialogTitle>
            <DialogDescription>
              Kick off the first round of bureau communication.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDisputeSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dispute-client">Client</Label>
              <Input
                id="dispute-client"
                required
                value={disputeForm.client}
                onChange={(event) => setDisputeForm((prev) => ({ ...prev, client: event.target.value }))}
                placeholder="Select or search client"
              />
            </div>
            <div className="space-y-2">
              <Label>Bureau</Label>
              <Select
                value={disputeForm.bureau}
                onValueChange={(value) => setDisputeForm((prev) => ({ ...prev, bureau: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose bureau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Experian">Experian</SelectItem>
                  <SelectItem value="Equifax">Equifax</SelectItem>
                  <SelectItem value="TransUnion">TransUnion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dispute-items">Items</Label>
              <Textarea
                id="dispute-items"
                rows={4}
                value={disputeForm.items}
                onChange={(event) => setDisputeForm((prev) => ({ ...prev, items: event.target.value }))}
                placeholder="List the accounts or items being disputed"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDisputeDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Dispute</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={letterDialogOpen}
        onOpenChange={(open) => {
          setLetterDialogOpen(open);
          if (!open) resetLetterForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Letter</DialogTitle>
            <DialogDescription>
              Generate and deliver a dispute or notification letter.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLetterSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="letter-client">Client</Label>
              <Input
                id="letter-client"
                required
                value={letterForm.client}
                onChange={(event) => setLetterForm((prev) => ({ ...prev, client: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="letter-template">Template</Label>
              <Input
                id="letter-template"
                value={letterForm.template}
                onChange={(event) => setLetterForm((prev) => ({ ...prev, template: event.target.value }))}
                placeholder="Choose template"
              />
            </div>
            <div className="space-y-2">
              <Label>Delivery method</Label>
              <Select
                value={letterForm.delivery}
                onValueChange={(value) => setLetterForm((prev) => ({ ...prev, delivery: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select delivery" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="download">Download PDF</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="fax">E-fax</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="letter-attachments">Attachments (optional)</Label>
              <Textarea
                id="letter-attachments"
                rows={3}
                value={letterForm.attachments}
                onChange={(event) => setLetterForm((prev) => ({ ...prev, attachments: event.target.value }))}
                placeholder="Describe or paste attachment URLs"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLetterDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Send Letter</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}



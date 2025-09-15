"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  MoreHorizontal,
  Clock,
  AlertCircle
} from "lucide-react";
import { ModernChart } from "@/components/charts/ModernChart";
import { cn } from "@/lib/utils";
import { bgTint, hoverBgTintGroup, textColor, bgSolid, type BrandColor } from "@/lib/color-variants";
import PageHeader from "@/components/PageHeader";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

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

  // KPI Data
  const kpiData = [
    {
      title: "Active Clients",
      value: "247",
      change: "+12%",
      trend: "up",
      icon: Users,
      color: "primary",
      description: "vs last month"
    },
    {
      title: "Disputes Open", 
      value: "89",
      change: "+5%",
      trend: "up",
      icon: FileText,
      color: "secondary",
      description: "in progress"
    },
    {
      title: "Letters Sent",
      value: "156",
      change: "+23%", 
      trend: "up",
      icon: Mail,
      color: "accent",
      description: "this month"
    },
    {
      title: "Tasks Due",
      value: "12",
      change: "-8%",
      trend: "down",
      icon: CheckSquare,
      color: "warning",
      description: "today"
    },
    {
      title: "Monthly Revenue",
      value: "$24,580",
      change: "+18%",
      trend: "up", 
      icon: DollarSign,
      color: "success",
      description: "recurring"
    }
  ] as Array<{
    title: string;
    value: string;
    change: string;
    trend: "up" | "down";
    icon: any;
    color: BrandColor;
    description: string;
  }>;

  // Chart Data
  const conversionData = [
    { name: "Jan", leads: 45, clients: 32 },
    { name: "Feb", leads: 52, clients: 38 },
    { name: "Mar", leads: 48, clients: 35 },
    { name: "Apr", leads: 61, clients: 42 },
    { name: "May", leads: 55, clients: 39 },
    { name: "Jun", leads: 67, clients: 48 }
  ];

  const throughputData = [
    { name: "Week 1", completed: 23 },
    { name: "Week 2", completed: 31 },
    { name: "Week 3", completed: 28 },
    { name: "Week 4", completed: 35 }
  ];

  // Activity Feed Data
  const activities = [
    {
      id: 1,
      type: "client_added",
      title: "New client added",
      description: "Sarah Johnson signed up for Professional plan",
      time: "2 minutes ago",
      icon: Users,
      color: "primary"
    },
    {
      id: 2,
      type: "dispute_resolved",
      title: "Dispute resolved",
      description: "Capital One account removed for Michael Brown",
      time: "1 hour ago",
      icon: CheckSquare,
      color: "success"
    },
    {
      id: 3,
      type: "letter_sent",
      title: "Dispute letter sent",
      description: "3 letters sent to credit bureaus for Jane Doe",
      time: "3 hours ago",
      icon: Mail,
      color: "secondary"
    },
    {
      id: 4,
      type: "task_overdue",
      title: "Task overdue",
      description: "Follow-up call for David Wilson is 2 days overdue",
      time: "5 hours ago",
      icon: AlertCircle,
      color: "warning"
    }
  ] as Array<{
    id: number;
    type: string;
    title: string;
    description: string;
    time: string;
    icon: any;
    color: BrandColor;
  }>;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.22, ease: "easeOut" }
    }
  };

  return (
    <div className="space-y-8">
      {/* dev badge removed */}
      {/* Page Header */}
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
            <button className="button-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Client
            </button>
          </>
        }
      />

      {/* KPI Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
      >
        {kpiData.map((kpi) => (
          <motion.div
            key={kpi.title}
            variants={itemVariants}
            className="card-modern p-6 group cursor-pointer hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-xl transition-colors duration-200", bgTint[kpi.color], hoverBgTintGroup[kpi.color])}>
                <kpi.icon className={cn("w-5 h-5", textColor[kpi.color])} />
              </div>
              <div className={cn("flex items-center gap-1 text-xs font-medium", kpi.trend === "up" ? "text-success" : "text-destructive")}>
                {kpi.trend === 'up' ? (
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
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22, ease: "easeOut", delay: 0.3 }}
          className="card-modern p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="h3 text-foreground">Lead Conversion</h3>
              <p className="text-sm text-muted-foreground mt-1">Leads to clients over time</p>
            </div>
            <button className="p-2 rounded-lg hover:bg-muted transition-colors duration-150">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <ModernChart
            data={conversionData}
            type="area"
            height={280}
            dataKey="clients"
            xAxisKey="name"
            showGrid={true}
            colors={["hsl(220, 91%, 54%)", "hsl(174, 72%, 56%)"]}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22, ease: "easeOut", delay: 0.4 }}
          className="card-modern p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="h3 text-foreground">Task Throughput</h3>
              <p className="text-sm text-muted-foreground mt-1">Completed tasks per week</p>
            </div>
            <button className="p-2 rounded-lg hover:bg-muted transition-colors duration-150">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <ModernChart
            data={throughputData}
            type="bar"
            height={280}
            dataKey="completed"
            xAxisKey="name"
            showGrid={true}
            colors={["hsl(174, 72%, 56%)"]}
          />
        </motion.div>
      </div>

      {/* Activity Feed & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Feed */}
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
                <p className="text-sm text-muted-foreground mt-1">Latest updates across your organization</p>
              </div>
              <button className="text-sm font-medium text-primary hover:text-primary-hover transition-colors duration-150">
                View all
              </button>
            </div>

            <div className="space-y-6">
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: 0.6 + index * 0.05 }}
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-all duration-150 group cursor-pointer"
                >
                  <div className={cn("p-2 rounded-lg transition-colors duration-200", bgTint[activity.color], hoverBgTintGroup[activity.color])}>
                    <activity.icon className={cn("w-4 h-4", textColor[activity.color])} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors duration-150">
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
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut", delay: 0.6 }}
          className="space-y-6"
        >
          {/* Quick Actions Card */}
          <div className="card-modern p-6">
            <h3 className="h4 text-foreground mb-6">Quick Actions</h3>
            <div className="space-y-3">
              {[
                { icon: Users, label: "Add Client", desc: "Start new case", color: "primary" },
                { icon: CheckSquare, label: "Create Task", desc: "Add to pipeline", color: "secondary" },
                { icon: FileText, label: "New Dispute", desc: "File dispute", color: "accent" },
                { icon: Mail, label: "Send Letter", desc: "Generate letter", color: "warning" }
              ].map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: 0.7 + index * 0.05 }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/50 hover:border-primary/20 transition-all duration-150 text-left group"
                >
                  <div className={cn("p-2 rounded-lg transition-colors duration-200", bgTint[action.color as BrandColor], hoverBgTintGroup[action.color as BrandColor])}>
                    <action.icon className={cn("w-4 h-4", textColor[action.color as BrandColor])} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground group-hover:text-primary transition-colors duration-150">
                      {action.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="card-modern p-6">
            <h3 className="h4 text-foreground mb-4">System Health</h3>
            <div className="space-y-4">
              {[
                { label: "API Status", status: "Operational", color: "success" },
                { label: "Database", status: "Connected", color: "success" },
                { label: "Real-time", status: "Active", color: "success" },
                { label: "Integrations", status: "All systems", color: "success" }
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15, delay: 0.8 + index * 0.05 }}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", bgSolid[item.color as BrandColor])}></div>
                    <span className={cn("text-xs font-medium", textColor[item.color as BrandColor])}>{item.status}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  CheckSquare, 
  Calendar, 
  TrendingUp,
  ArrowUpRight,
  Plus,
  Filter,
  Search
} from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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

  const kpiCards = [
    {
      title: "Active Clients",
      value: "247",
      change: "+12%",
      trend: "up",
      icon: Users,
      color: "primary"
    },
    {
      title: "Open Tasks",
      value: "89",
      change: "+5%",
      trend: "up",
      icon: CheckSquare,
      color: "secondary"
    },
    {
      title: "Due Today",
      value: "12",
      change: "-3%",
      trend: "down",
      icon: Calendar,
      color: "warning"
    },
    {
      title: "Monthly Revenue",
      value: "$24,580",
      change: "+18%",
      trend: "up",
      icon: TrendingUp,
      color: "accent"
    }
  ];

  const recentTasks = [
    {
      id: 1,
      title: "Review credit report for John Doe",
      client: "John Doe",
      priority: "high",
      status: "in_progress",
      dueDate: "Today"
    },
    {
      id: 2,
      title: "Prepare dispute letters for Jane Smith",
      client: "Jane Smith", 
      priority: "medium",
      status: "todo",
      dueDate: "Tomorrow"
    },
    {
      id: 3,
      title: "Follow up with Michael Johnson",
      client: "Michael Johnson",
      priority: "high",
      status: "todo",
      dueDate: "Today"
    }
  ];

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="h1 text-foreground">Good morning, Admin</h1>
              <p className="text-lg text-muted-foreground mt-2">
                Here's what's happening with your credit repair business today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted transition-all duration-150 text-sm font-medium">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button className="button-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Client
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-6 py-8">
        {/* KPI Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {kpiCards.map((card, index) => (
            <motion.div
              key={card.title}
              variants={itemVariants}
              className="card-modern p-6 group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-${card.color}/10`}>
                  <card.icon className={`w-6 h-6 text-${card.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  card.trend === 'up' ? 'text-success' : 'text-destructive'
                }`}>
                  <ArrowUpRight className={`w-3 h-3 ${card.trend === 'down' ? 'rotate-90' : ''}`} />
                  {card.change}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
                <p className="h2 text-foreground">{card.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Tasks */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, ease: "easeOut", delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="card-modern p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="h3 text-foreground">Recent Tasks</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your most important tasks requiring attention
                  </p>
                </div>
                <button className="text-sm font-medium text-primary hover:text-primary-hover transition-colors duration-150">
                  View all
                </button>
              </div>

              <div className="space-y-4">
                {recentTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/50 transition-all duration-150 group cursor-pointer"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground group-hover:text-primary transition-colors duration-150">
                        {task.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Client: {task.client}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge-${task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'info'}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {task.dueDate}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22, ease: "easeOut", delay: 0.3 }}
            className="space-y-6"
          >
            {/* Quick Actions Card */}
            <div className="card-modern p-6">
              <h3 className="h4 text-foreground mb-6">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-primary/5 hover:border-primary/20 transition-all duration-150 text-left group">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-150">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Add New Client</p>
                    <p className="text-xs text-muted-foreground">Start a new case</p>
                  </div>
                </button>
                
                <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-secondary/5 hover:border-secondary/20 transition-all duration-150 text-left group">
                  <div className="p-2 rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-colors duration-150">
                    <CheckSquare className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Create Task</p>
                    <p className="text-xs text-muted-foreground">Add to pipeline</p>
                  </div>
                </button>
                
                <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-accent/5 hover:border-accent/20 transition-all duration-150 text-left group">
                  <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors duration-150">
                    <TrendingUp className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">View Reports</p>
                    <p className="text-xs text-muted-foreground">Analytics & insights</p>
                  </div>
                </button>
              </div>
            </div>

            {/* System Status */}
            <div className="card-modern p-6">
              <h3 className="h4 text-foreground mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">API Status</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    <span className="text-xs font-medium text-success">Operational</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Database</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    <span className="text-xs font-medium text-success">Connected</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Real-time</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    <span className="text-xs font-medium text-success">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Getting Started Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut", delay: 0.4 }}
          className="mt-12"
        >
          <div className="card-modern p-8">
            <div className="text-center mb-8">
              <h2 className="h2 text-foreground mb-3">Welcome to CredKit CRM</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Your comprehensive credit repair management platform is ready. 
                Follow these steps to get started with your first client.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: "1",
                  title: "Set Up Your Profile",
                  description: "Complete your organization settings and user preferences",
                  color: "primary"
                },
                {
                  step: "2", 
                  title: "Add Your First Client",
                  description: "Import or manually add client information to begin",
                  color: "secondary"
                },
                {
                  step: "3",
                  title: "Create Pipeline Stages",
                  description: "Customize your workflow stages and automation rules",
                  color: "accent"
                },
                {
                  step: "4",
                  title: "Start Managing Cases",
                  description: "Begin tracking disputes, tasks, and client progress",
                  color: "success"
                }
              ].map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: 0.5 + index * 0.1 }}
                  className="relative p-6 rounded-2xl border border-border hover:border-primary/20 hover:bg-primary/5 transition-all duration-200 group cursor-pointer"
                >
                  <div className={`w-8 h-8 rounded-xl bg-${step.color}/10 flex items-center justify-center mb-4 group-hover:bg-${step.color}/20 transition-colors duration-200`}>
                    <span className={`text-sm font-bold text-${step.color}`}>
                      {step.step}
                    </span>
                  </div>
                  <h4 className="h4 text-foreground mb-2 group-hover:text-primary transition-colors duration-200">
                    {step.title}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
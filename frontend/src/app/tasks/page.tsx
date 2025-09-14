"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  MoreHorizontal,
  Calendar,
  User,
  Flag,
  Clock,
  CheckCircle,
  AlertCircle,
  Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Task {
  id: string;
  title: string;
  description: string;
  client: string;
  assignee: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string;
  status: "todo" | "in_progress" | "completed" | "cancelled";
  tags: string[];
}

interface Column {
  id: string;
  title: string;
  status: Task['status'];
  color: string;
  tasks: Task[];
  count: number;
}

export default function TasksPage() {
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Sample tasks data
  const tasks: Task[] = [
    {
      id: "1",
      title: "Review credit report for Sarah Johnson",
      description: "Analyze credit report and identify disputable items",
      client: "Sarah Johnson",
      assignee: "John Agent",
      priority: "high",
      dueDate: "2024-01-25",
      status: "in_progress",
      tags: ["Credit Report", "High Priority"]
    },
    {
      id: "2",
      title: "Prepare dispute letters for Michael Brown",
      description: "Draft dispute letters for 3 negative accounts",
      client: "Michael Brown",
      assignee: "Jane Manager",
      priority: "medium",
      dueDate: "2024-01-28",
      status: "todo",
      tags: ["Dispute Letters"]
    },
    {
      id: "3",
      title: "Follow up with Jennifer Davis",
      description: "Call client to discuss progress and next steps",
      client: "Jennifer Davis",
      assignee: "John Agent",
      priority: "urgent",
      dueDate: "2024-01-24",
      status: "todo",
      tags: ["Follow Up", "Urgent"]
    },
    {
      id: "4",
      title: "Send welcome package to David Wilson",
      description: "Email welcome materials and onboarding documents",
      client: "David Wilson",
      assignee: "Jane Manager",
      priority: "low",
      dueDate: "2024-01-23",
      status: "completed",
      tags: ["Onboarding"]
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Group tasks by status
  const columns: Column[] = [
    {
      id: "todo",
      title: "To Do",
      status: "todo",
      color: "border-muted bg-muted/10",
      tasks: tasks.filter(t => t.status === "todo"),
      count: tasks.filter(t => t.status === "todo").length
    },
    {
      id: "in_progress", 
      title: "In Progress",
      status: "in_progress",
      color: "border-primary bg-primary/10",
      tasks: tasks.filter(t => t.status === "in_progress"),
      count: tasks.filter(t => t.status === "in_progress").length
    },
    {
      id: "completed",
      title: "Completed",
      status: "completed", 
      color: "border-success bg-success/10",
      tasks: tasks.filter(t => t.status === "completed"),
      count: tasks.filter(t => t.status === "completed").length
    },
    {
      id: "cancelled",
      title: "Cancelled",
      status: "cancelled",
      color: "border-destructive bg-destructive/10",
      tasks: tasks.filter(t => t.status === "cancelled"),
      count: tasks.filter(t => t.status === "cancelled").length
    }
  ];

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "warning";
      case "medium": return "info";
      case "low": return "success";
      default: return "muted";
    }
  };

  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case "urgent": return AlertCircle;
      case "high": return Flag;
      case "medium": return Circle;
      case "low": return CheckCircle;
      default: return Circle;
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDrop = (targetStatus: Task['status']) => {
    if (draggedTask && draggedTask.status !== targetStatus) {
      // In a real app, this would update the task status via API
      console.log(`Moving task ${draggedTask.id} to ${targetStatus}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded-xl w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="h-12 bg-muted rounded-xl"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-24 bg-muted rounded-xl"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="h1 text-foreground">Task Pipeline</h1>
              <p className="text-base text-muted-foreground mt-1">
                Manage tasks across your workflow stages
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Column
              </Button>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Task
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Kanban Board */}
      <div className="container mx-auto px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut", delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {columns.map((column, columnIndex) => (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: columnIndex * 0.1 }}
              className="flex flex-col h-fit"
            >
              {/* Column Header */}
              <div className={`p-4 rounded-t-2xl border-2 ${column.color} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-foreground">{column.title}</h3>
                  <span className="px-2 py-1 rounded-lg bg-background/50 text-xs font-medium text-muted-foreground">
                    {column.count}
                  </span>
                </div>
                <button className="p-1 rounded-lg hover:bg-background/20 transition-colors duration-150">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Column Content */}
              <div 
                className="flex-1 p-4 border-x-2 border-b-2 border-border rounded-b-2xl bg-background min-h-[500px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(column.status)}
              >
                <div className="space-y-3">
                  {column.tasks.map((task, taskIndex) => {
                    const PriorityIcon = getPriorityIcon(task.priority);
                    
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.15, delay: taskIndex * 0.05 }}
                        draggable
                        onDragStart={() => handleDragStart(task)}
                        onDragEnd={handleDragEnd}
                        className={`card-modern p-4 cursor-grab active:cursor-grabbing group hover:shadow-soft-md transition-all duration-200 ${
                          draggedTask?.id === task.id ? "opacity-50 scale-95" : ""
                        }`}
                      >
                        {/* Task Header */}
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-foreground text-sm leading-snug group-hover:text-primary transition-colors duration-150">
                            {task.title}
                          </h4>
                          <button className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-muted transition-all duration-150">
                            <MoreHorizontal className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>

                        {/* Task Description */}
                        {task.description && (
                          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Task Tags */}
                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {task.tags.map((tag) => (
                              <span key={tag} className="badge-info text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Task Footer */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded-lg bg-${getPriorityColor(task.priority)}/10`}>
                              <PriorityIcon className={`w-3 h-3 text-${getPriorityColor(task.priority)}`} />
                            </div>
                            <span className={`text-xs font-medium text-${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {task.dueDate}
                          </div>
                        </div>

                        {/* Assignee */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                          <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-secondary">
                              {task.assignee.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">{task.assignee}</span>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Add Task Button */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.3 }}
                    className="w-full p-4 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-center gap-2 text-muted-foreground group-hover:text-primary transition-colors duration-200">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-medium">Add Task</span>
                    </div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut", delay: 0.4 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {columns.map((column) => (
            <div key={column.id} className="card-modern p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">{column.title}</p>
              <p className="h3 text-foreground">{column.count}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
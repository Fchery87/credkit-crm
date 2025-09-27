"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Calendar, ListTodo, User } from "lucide-react";
import { TASK_SEARCH_ITEMS } from "@/lib/global-search";

const fallbackDetails = {
  status: "In Progress",
  dueDate: "2024-01-25",
  assignee: "Team Member",
  client: "Client",
  summary: "Task details coming soon.",
};

const DETAIL_OVERRIDES: Record<string, Partial<typeof fallbackDetails>> = {
  "task-1": {
    status: "In Progress",
    dueDate: "2024-01-25",
    assignee: "John Agent",
    client: "Sarah Johnson",
    summary: "Analyze Sarah's credit report and flag disputable items.",
  },
  "task-2": {
    status: "To Do",
    dueDate: "2024-01-28",
    assignee: "Jane Manager",
    client: "Michael Brown",
    summary: "Draft dispute letters for three negative accounts.",
  },
  "task-3": {
    status: "Urgent",
    dueDate: "2024-01-24",
    assignee: "John Agent",
    client: "Jennifer Davis",
    summary: "Contact Jennifer to review progress and outline next steps.",
  },
  "task-4": {
    status: "Completed",
    dueDate: "2024-01-23",
    assignee: "Jane Manager",
    client: "David Wilson",
    summary: "Welcome packet sent with onboarding materials.",
  },
};

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const task = useMemo(() => {
    const catalogMatch = TASK_SEARCH_ITEMS.find((item) => item.id === id);
    const overrides = DETAIL_OVERRIDES[id] ?? {};
    return {
      id,
      title: catalogMatch?.title ?? "Task",
      ...fallbackDetails,
      ...overrides,
    };
  }, [id]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={task.title}
        subtitle={`Task ID: ${task.id}`}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Tasks", href: "/tasks" }, { label: task.id }]}
        actions={
          <Button className="gap-2">
            <ListTodo className="h-4 w-4" />
            Mark Complete
          </Button>
        }
      />

      <div className="card-modern p-6 space-y-4">
        <p className="text-sm text-muted-foreground">{task.summary}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Due {task.dueDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span>Assigned to {task.assignee}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span>Client {task.client}</span>
          </div>
        </div>
        <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm">
          <strong className="font-medium">Status:</strong> {task.status}
        </div>
      </div>
    </div>
  );
}
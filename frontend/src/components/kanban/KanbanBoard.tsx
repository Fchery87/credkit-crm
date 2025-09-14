"use client";

import { useState, useEffect } from 'react';
import { useTasks, type Task } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal, Calendar, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface KanbanColumn {
  id: string;
  title: string;
  status: Task['status'];
  color: string;
  tasks: Task[];
}

interface KanbanBoardProps {
  onTaskClick?: (task: Task) => void;
  onCreateTask?: () => void;
}

const KANBAN_COLUMNS: Omit<KanbanColumn, 'tasks'>[] = [
  { id: 'todo', title: 'To Do', status: 'todo', color: 'bg-gray-100 border-gray-300' },
  { id: 'in_progress', title: 'In Progress', status: 'in_progress', color: 'bg-blue-100 border-blue-300' },
  { id: 'completed', title: 'Completed', status: 'completed', color: 'bg-green-100 border-green-300' },
  { id: 'cancelled', title: 'Cancelled', status: 'cancelled', color: 'bg-red-100 border-red-300' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  onTaskClick,
  onCreateTask
}) => {
  const { tasks, updateTask, loading } = useTasks();
  const [columns, setColumns] = useState<KanbanColumn[]>([]);

  useEffect(() => {
    // Group tasks by status
    const groupedTasks = tasks.reduce((acc, task) => {
      const status = task.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(task);
      return acc;
    }, {} as Record<string, Task[]>);

    // Create columns with tasks
    const updatedColumns = KANBAN_COLUMNS.map(column => ({
      ...column,
      tasks: groupedTasks[column.status] || [],
    }));

    setColumns(updatedColumns);
  }, [tasks]);

  const handleTaskStatusChange = async (task: Task, newStatus: Task['status']) => {
    if (task.status === newStatus) return;

    await updateTask(task.id, { status: newStatus });
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <Card
      className="mb-2 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onTaskClick?.(task)}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {KANBAN_COLUMNS.map(column => (
                <DropdownMenuItem
                  key={column.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTaskStatusChange(task, column.status);
                  }}
                  disabled={task.status === column.status}
                >
                  Move to {column.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge
              variant="secondary"
              className={`text-xs text-white ${getPriorityColor(task.priority)}`}
            >
              {task.priority}
            </Badge>
          </div>

          {task.due_date && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDate(task.due_date)}
            </div>
          )}
        </div>

        {task.assigned_to && (
          <div className="flex items-center mt-2 text-xs text-muted-foreground">
            <User className="h-3 w-3 mr-1" />
            Assigned
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading kanban board...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Task Pipeline</h2>
        <Button onClick={onCreateTask}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col">
            <div className={`p-4 rounded-t-lg border-2 ${column.color}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{column.title}</h3>
                <Badge variant="secondary" className="text-sm">
                  {column.tasks.length}
                </Badge>
              </div>
            </div>

            <div className="flex-1 bg-gray-50 p-4 rounded-b-lg border-x-2 border-b-2 border-gray-200 min-h-[400px]">
              {column.tasks.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <div className="text-sm">No tasks</div>
                    <div className="text-xs">Drop tasks here</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {column.tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
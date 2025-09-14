"use client";

import { useState, useEffect, useMemo } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useClients } from '@/hooks/useClients';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AnalyticsDashboard: React.FC = () => {
  const { tasks, loading: tasksLoading } = useTasks();
  const { clients, loading: clientsLoading } = useClients();

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Calculate analytics data
  const analytics = useMemo(() => {
    if (tasksLoading || clientsLoading) return null;

    // Task status distribution
    const taskStatusData = [
      { name: 'To Do', value: tasks.filter(t => t.status === 'todo').length, color: '#8884d8' },
      { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: '#82ca9d' },
      { name: 'Completed', value: tasks.filter(t => t.status === 'completed').length, color: '#ffc658' },
      { name: 'Cancelled', value: tasks.filter(t => t.status === 'cancelled').length, color: '#ff7300' },
    ];

    // Task priority distribution
    const taskPriorityData = [
      { name: 'Low', value: tasks.filter(t => t.priority === 'low').length },
      { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length },
      { name: 'High', value: tasks.filter(t => t.priority === 'high').length },
      { name: 'Urgent', value: tasks.filter(t => t.priority === 'urgent').length },
    ];

    // Tasks created over time (last 30 days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    const tasksOverTime = last30Days.map(date => {
      const tasksOnDate = tasks.filter(task =>
        task.created_at.startsWith(date)
      ).length;

      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tasks: tasksOnDate,
      };
    });

    // Client acquisition over time
    const clientsOverTime = last30Days.map(date => {
      const clientsOnDate = clients.filter(client =>
        client.created_at.startsWith(date)
      ).length;

      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        clients: clientsOnDate,
      };
    });

    // Task completion rate
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Average tasks per client
    const avgTasksPerClient = clients.length > 0 ? Math.round((totalTasks / clients.length) * 10) / 10 : 0;

    // Overdue tasks
    const overdueTasks = tasks.filter(task => {
      if (!task.due_date || task.status === 'completed') return false;
      return new Date(task.due_date) < new Date();
    }).length;

    return {
      taskStatusData,
      taskPriorityData,
      tasksOverTime,
      clientsOverTime,
      completionRate,
      avgTasksPerClient,
      overdueTasks,
      totalTasks,
      totalClients: clients.length,
    };
  }, [tasks, clients, tasksLoading, clientsLoading]);

  if (tasksLoading || clientsLoading || !analytics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <div className="flex space-x-2">
          <Badge
            variant={timeRange === '7d' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setTimeRange('7d')}
          >
            7 Days
          </Badge>
          <Badge
            variant={timeRange === '30d' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setTimeRange('30d')}
          >
            30 Days
          </Badge>
          <Badge
            variant={timeRange === '90d' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setTimeRange('90d')}
          >
            90 Days
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              Active tasks in pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Registered clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
                <CardDescription>Current breakdown of task statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.taskStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Priority Distribution</CardTitle>
                <CardDescription>Priority breakdown of all tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.taskPriorityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Creation Trend</CardTitle>
              <CardDescription>Tasks created over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analytics.tasksOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="tasks" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Acquisition Trend</CardTitle>
              <CardDescription>New clients over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analytics.clientsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="clients" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Avg Tasks per Client</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.avgTasksPerClient}</div>
                <p className="text-sm text-muted-foreground">Tasks per client</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.completionRate}%</div>
                <p className="text-sm text-muted-foreground">Overall completion</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analytics.taskStatusData.find(d => d.name === 'In Progress')?.value || 0}
                </div>
                <p className="text-sm text-muted-foreground">Currently in progress</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api-client';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string | null;
  assigned_to: string | null;
  created_by: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface TaskFilters {
  search?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  assigned_to?: string;
  client_id?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  assigned_to?: string;
}

export const useTasks = () => {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (filters: TaskFilters = {}) => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const endpoint = `/api/v1/tasks/?${queryParams.toString()}`;
      const data = await apiClient.makeRequest(endpoint);
      setTasks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createTask = useCallback(async (taskData: CreateTaskData): Promise<Task | null> => {
    if (!token) return null;

    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.makeRequest('/api/v1/tasks/', {
        method: 'POST',
        body: JSON.stringify(taskData),
      });

      // Add to local state
      setTasks(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateTask = useCallback(async (taskId: string, updateData: UpdateTaskData): Promise<Task | null> => {
    if (!token) return null;

    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.makeRequest(`/api/v1/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      // Update local state
      setTasks(prev => prev.map(task =>
        task.id === taskId ? data : task
      ));
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const deleteTask = useCallback(async (taskId: string): Promise<boolean> => {
    if (!token) return false;

    setLoading(true);
    setError(null);

    try {
      await apiClient.makeRequest(`/api/v1/tasks/${taskId}`, {
        method: 'DELETE',
      });

      // Remove from local state
      setTasks(prev => prev.filter(task => task.id !== taskId));
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const bulkUpdateTasks = useCallback(async (updates: Array<{ id: string } & UpdateTaskData>): Promise<{ message: string } | null> => {
    if (!token) return null;

    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.makeRequest('/api/v1/tasks/bulk-update', {
        method: 'POST',
        body: JSON.stringify(updates),
      });

      // Refresh tasks to get updated data
      await fetchTasks();
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to bulk update tasks');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, fetchTasks]);

  const bulkDeleteTasks = useCallback(async (taskIds: string[]): Promise<{ message: string } | null> => {
    if (!token) return null;

    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.makeRequest('/api/v1/tasks/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ task_ids: taskIds }),
      });

      // Remove from local state
      setTasks(prev => prev.filter(task => !taskIds.includes(task.id)));
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to bulk delete tasks');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    bulkUpdateTasks,
    bulkDeleteTasks,
    clearError: () => setError(null),
  };
};

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api-client';

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  tenant_id: string;
  created_at: string;
}

export interface ClientFilters {
  search?: string;
  stage_id?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface CreateClientData {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
}

export interface UpdateClientData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

export const useClients = () => {
  const { token } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async (filters: ClientFilters = {}) => {
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

      const endpoint = `/api/v1/clients/?${queryParams.toString()}`;
      const data = await apiClient.makeRequest(endpoint, {}, token);
      setClients(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createClient = useCallback(async (clientData: CreateClientData): Promise<Client | null> => {
    if (!token) return null;

    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.makeRequest('/api/v1/clients/', {
        method: 'POST',
        body: JSON.stringify(clientData),
      }, token);

      // Add to local state
      setClients(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to create client');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateClient = useCallback(async (clientId: string, updateData: UpdateClientData): Promise<Client | null> => {
    if (!token) return null;

    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.makeRequest(`/api/v1/clients/${clientId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      }, token);

      // Update local state
      setClients(prev => prev.map(client =>
        client.id === clientId ? data : client
      ));
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to update client');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const deleteClient = useCallback(async (clientId: string): Promise<boolean> => {
    if (!token) return false;

    setLoading(true);
    setError(null);

    try {
      await apiClient.makeRequest(`/api/v1/clients/${clientId}`, {
        method: 'DELETE',
      }, token);

      // Remove from local state
      setClients(prev => prev.filter(client => client.id !== clientId));
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete client');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const bulkUpdateClients = useCallback(async (updates: Array<{ id: string } & UpdateClientData>): Promise<{ message: string } | null> => {
    if (!token) return null;

    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.makeRequest('/api/v1/clients/bulk-update', {
        method: 'POST',
        body: JSON.stringify(updates),
      }, token);

      // Refresh clients to get updated data
      await fetchClients();
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to bulk update clients');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, fetchClients]);

  return {
    clients,
    loading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    bulkUpdateClients,
    clearError: () => setError(null),
  };
};
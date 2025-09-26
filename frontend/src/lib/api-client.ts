"use client";

import { useAuth } from '@/contexts/auth-context';

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  public async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Tasks
  async getTasks(params?: Record<string, any>): Promise<any> {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.makeRequest(`/api/v1/tasks/${queryString}`);
  }

  async createTask(data: any): Promise<any> {
    return this.makeRequest('/api/v1/tasks/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: string, data: any): Promise<any> {
    return this.makeRequest(`/api/v1/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTask(id: string): Promise<any> {
    return this.makeRequest(`/api/v1/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Clients
  async getClients(params?: Record<string, any>): Promise<any> {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.makeRequest(`/api/v1/clients/${queryString}`);
  }

  async createClient(data: any): Promise<any> {
    return this.makeRequest('/api/v1/clients/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClient(id: string, data: any): Promise<any> {
    return this.makeRequest(`/api/v1/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteClient(id: string): Promise<any> {
    return this.makeRequest(`/api/v1/clients/${id}`, {
      method: 'DELETE',
    });
  }

  // Disputes
  async getDisputes(params?: Record<string, any>): Promise<any> {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.makeRequest(`/api/v1/disputes/${queryString}`);
  }

  async createDispute(data: any): Promise<any> {
    return this.makeRequest('/api/v1/disputes/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDispute(id: string, data: any): Promise<any> {
    return this.makeRequest(`/api/v1/disputes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDispute(id: string): Promise<any> {
    return this.makeRequest(`/api/v1/disputes/${id}`, {
      method: 'DELETE',
    });
  }

  async getDisputeSuggestions(clientId: string): Promise<any> {
    const query = new URLSearchParams({ client_id: clientId });
    return this.makeRequest(`/api/disputes/suggestions?${query.toString()}`);
  }

  // Analytics
  async getAnalytics(): Promise<any> {
    return this.makeRequest('/api/v1/analytics/');
  }

  // User
  async getCurrentUser(): Promise<any> {
    return this.makeRequest('/api/v1/auth/users/me');
  }
}

export const apiClient = new ApiClient();

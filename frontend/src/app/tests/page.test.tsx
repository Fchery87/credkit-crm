/// <reference types="vitest" />

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import DashboardPage from '../page'

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      role: 'admin'
    },
    token: 'mock-token',
    isAuthenticated: true
  })
}))

vi.mock('@/contexts/websocket-context', () => ({
  useWebSocket: () => ({
    isConnected: true,
    subscribe: vi.fn()
  })
}))

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getTasks: vi.fn().mockResolvedValue([
      {
        id: '1',
        title: 'Test Task',
        status: 'todo',
        priority: 'high',
        due_date: '2024-01-15',
        created_at: '2024-01-10'
      }
    ]),
    getClients: vi.fn().mockResolvedValue([
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        created_at: '2024-01-10'
      }
    ])
  }
}))

vi.mock('@/components/protected-route', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

describe('Dashboard Page', () => {
  it('renders dashboard title after loading', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    })
  })

  it('displays KPI cards with key metrics', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Active Clients')).toBeInTheDocument()
      expect(screen.getByText('Disputes Open')).toBeInTheDocument()
      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument()
    })
  })

  it('shows recent activity section', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument()
      expect(screen.getByText('New client added')).toBeInTheDocument()
    })
  })

  it('shows quick actions and system health panels', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument()
      expect(screen.getByText('System Health')).toBeInTheDocument()
    })
  })
})

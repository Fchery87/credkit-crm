import { render, screen, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import DashboardPage from '../page'

// Mock the hooks and components
jest.mock('@/contexts/auth-context', () => ({
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

jest.mock('@/contexts/websocket-context', () => ({
  useWebSocket: () => ({
    isConnected: true,
    subscribe: jest.fn()
  })
}))

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    getTasks: jest.fn().mockResolvedValue([
      {
        id: '1',
        title: 'Test Task',
        status: 'todo',
        priority: 'high',
        due_date: '2024-01-15',
        created_at: '2024-01-10'
      }
    ]),
    getClients: jest.fn().mockResolvedValue([
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

jest.mock('@/components/protected-route', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

describe('Dashboard Page', () => {
  it('renders dashboard title', async () => {
    render(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Credit Repair CRM Dashboard')).toBeInTheDocument()
    })
  })

  it('displays KPI cards', async () => {
    render(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Active Clients')).toBeInTheDocument()
      expect(screen.getByText('Open Tasks')).toBeInTheDocument()
      expect(screen.getByText('Tasks Due Today')).toBeInTheDocument()
      expect(screen.getByText('System Status')).toBeInTheDocument()
    })
  })

  it('shows getting started guide', async () => {
    render(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Getting Started')).toBeInTheDocument()
      expect(screen.getByText('1. Register/Login')).toBeInTheDocument()
      expect(screen.getByText('2. Add Your First Client')).toBeInTheDocument()
      expect(screen.getByText('3. Create Tasks')).toBeInTheDocument()
      expect(screen.getByText('4. Monitor Progress')).toBeInTheDocument()
    })
  })

  it('displays system ready message', async () => {
    render(<DashboardPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/Your CRM system is ready/)).toBeInTheDocument()
    })
  })
})
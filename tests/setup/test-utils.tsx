import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AgentProvider } from '@/contexts/AgentContext'
import { SessionProvider } from '@/contexts/SessionContext'
import { ModelProvider } from '@/contexts/ModelContext'
import { DropdownProvider } from '@/contexts/DropdownContext'

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
      },
    },
    status: 'authenticated',
  })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <AgentProvider>
        <ModelProvider>
          <SessionProvider>
            <DropdownProvider>
              {children}
            </DropdownProvider>
          </SessionProvider>
        </ModelProvider>
      </AgentProvider>
    </ThemeProvider>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render }
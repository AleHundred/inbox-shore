import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';

import { AuthProvider, useAuth } from '@/lib/contexts/AuthContext';

/**
 * Mock Next.js router for auth flow testing
 */
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

/**
 * Test component that uses the auth context
 */
function TestComponent() {
  const { isAuthenticated, isLoading, login, logout, user } = useAuth();

  return (
    <div>
      <div data-testid='auth-status'>
        {isLoading ? 'loading' : isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid='user-info'>{user?.email || 'no-user'}</div>
      <button data-testid='login-button' onClick={() => login('test@example.com', 'password')}>
        Login
      </button>
      <button data-testid='logout-button' onClick={logout}>
        Logout
      </button>
    </div>
  );
}

/**
 * Integration tests for the authentication context
 */
describe('AuthContext', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    global.fetch = jest.fn();
    mockPush.mockClear();
  });

  /**
   * Tests initial unauthenticated state
   */
  it('should start in unauthenticated state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    expect(screen.getByTestId('user-info')).toHaveTextContent('no-user');
  });

  /**
   * Tests successful login flow with proper async handling
   * Fixed to properly wait for navigation
   */
  it('should handle successful login', async () => {
    const mockLoginResponse = {
      success: true,
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      token: 'mock-token',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockLoginResponse,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('login-button'));
    });

    // Wait for authentication state to update
    await waitFor(
      () => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      },
      { timeout: 3000 }
    );

    expect(screen.getByTestId('user-info')).toHaveTextContent('test@example.com');

    // The navigation might be asynchronous, so let's wait for it
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith('/requests');
      },
      { timeout: 3000 }
    );
  });

  /**
   * Tests logout functionality
   */
  it('should handle logout', async () => {
    // Setup authenticated state first
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: { id: '1', email: 'test@example.com' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Login first
    await act(async () => {
      fireEvent.click(screen.getByTestId('login-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });

    // Then logout
    await act(async () => {
      fireEvent.click(screen.getByTestId('logout-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });

    expect(screen.getByTestId('user-info')).toHaveTextContent('no-user');
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});

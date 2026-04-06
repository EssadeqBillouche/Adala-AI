import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth, type SignupData } from './AuthContext';
import { api } from '../lib/api';
import { wrapper } from '../components/TestWrapper';

// Mock the API module
jest.mock('../lib/api', () => ({
  api: {
    getProfile: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
}));

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useAuth hook', () => {
    it.skip('throws error when used outside AuthProvider', () => {
      // Create a component that uses useAuth outside provider
      const TestComponent = () => {
        useAuth();
        return null;
      };

      expect(() => {
        renderHook(() => <TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');
    });
  });

  describe('AuthProvider', () => {
    it('provides auth context to children', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.login).toBeDefined();
      expect(result.current.signup).toBeDefined();
      expect(result.current.logout).toBeDefined();
      expect(result.current.clearError).toBeDefined();
    });

    it('initializes with default auth state', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('checks for existing session on mount', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'OWNER' as const,
        organizationId: 'org1',
        organization: { id: 'org1', name: 'Test Org' },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      (api.getProfile as jest.Mock).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(api.getProfile).toHaveBeenCalledTimes(1);
    });

    it('sets unauthenticated when no valid session exists on mount', async () => {
      (api.getProfile as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('handles auth check failure gracefully', async () => {
      (api.getProfile as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('login', () => {
    it('successfully logs in user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'OWNER' as const,
        organizationId: 'org1',
        organization: { id: 'org1', name: 'Test Org' },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const mockResponse = {
        access_token: 'fake-token',
        user: mockUser,
      };

      (api.login as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(api.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('sets error when login fails', async () => {
      (api.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'wrong-password');
        } catch (error) {
          // Expected error
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBe('Invalid credentials');
      expect(result.current.isLoading).toBe(false);
    });

    it('sets loading state during login', async () => {
      (api.login as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ access_token: 'token', user: {} }), 100))
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.login('test@example.com', 'password123');
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('signup', () => {
    it('successfully signs up user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'OWNER' as const,
        organizationId: 'org1',
        organization: { id: 'org1', name: 'Test Org' },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const mockResponse = {
        access_token: 'fake-token',
        user: mockUser,
      };

      (api.register as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      const signupData: SignupData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        acceptTerms: true,
        organizationName: 'Test Org',
      };

      await act(async () => {
        await result.current.signup(signupData);
      });

      expect(api.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Org',
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('sets error when signup fails', async () => {
      (api.register as jest.Mock).mockRejectedValue(new Error('Email already exists'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      const signupData: SignupData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        acceptTerms: true,
      };

      await act(async () => {
        try {
          await result.current.signup(signupData);
        } catch (error) {
          // Expected error
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBe('Email already exists');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('successfully logs out user', async () => {
      (api.logout as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Set authenticated state manually for testing
      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.isAuthenticated).toBe(true);

      await act(async () => {
        await result.current.logout();
      });

      expect(api.logout).toHaveBeenCalledTimes(1);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('clearError', () => {
    it('clears the error state', async () => {
      (api.login as jest.Mock).mockRejectedValue(new Error('Some error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'wrong-password');
        } catch (error) {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('state transitions', () => {
    it('transitions from loading to authenticated', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'OWNER' as const,
        organizationId: 'org1',
        organization: { id: 'org1', name: 'Test Org' },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const mockResponse = {
        access_token: 'fake-token',
        user: mockUser,
      };

      (api.login as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });
  });
});

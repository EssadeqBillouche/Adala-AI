/**
 * Centralized API Client for Adala AI Frontend
 * Handles JWT authentication, error handling, and type-safe API calls
 */

// Types matching backend DTOs
export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  organizationId: string;
  organization?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface CreateProjectRequest {
  title: string;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  legalDomain: string | null;
  language: 'EN' | 'FR' | 'AR';
  isArchived: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationRequest {
  title: string;
  summary?: string;
  language?: 'EN' | 'FR' | 'AR';
  projectId: string;
}

export interface Conversation {
  id: string;
  title: string;
  summary: string | null;
  language: 'EN' | 'FR' | 'AR';
  status: 'ACTIVE' | 'ARCHIVED';
  totalTokensUsed: number;
  totalCreditsUsed: number;
  vectorThreadIds: string[];
  projectId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessageRequest {
  role: 'USER' | 'ASSISTANT';
  content: string;
  tokensIn?: number;
  tokensOut?: number;
  latencyMs?: number;
  ragScore?: number;
  errorCode?: string;
  metadata?: Record<string, unknown>;
  conversationId: string;
}

export interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  tokensIn: number | null;
  tokensOut: number | null;
  latencyMs: number | null;
  ragScore: number | null;
  citationCount: number;
  errorCode: string | null;
  metadata: Record<string, unknown> | null;
  conversationId: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripePriceId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELED' | 'TRIALING' | 'PAST_DUE';
  monthlyCreditsAlloc: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionRequest {
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripePriceId: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'CANCELED' | 'TRIALING' | 'PAST_DUE';
  monthlyCreditsAlloc?: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd?: boolean;
  trialEndsAt?: string;
}

// API Error type
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

// API Client Class
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  }

  /**
   * Get the current auth token from localStorage
   */
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  /**
   * Set the auth token in localStorage
   */
  private setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_token', token);
  }

  /**
   * Remove the auth token from localStorage
   */
  private removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
  }

  /**
   * Build headers with optional auth token
   */
  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Handle API response and errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: ApiError | unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = { statusCode: response.status, message: 'Request failed', error: 'Unknown' };
      }

      const error = new Error(
        typeof errorData === 'object' && errorData !== null && 'message' in errorData
          ? Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : String(errorData.message)
          : `HTTP ${response.status}`
      ) as Error & { statusCode?: number; data?: unknown };

      error.statusCode = (errorData as ApiError).statusCode || response.status;
      error.data = errorData;
      throw error;
    }

    return response.json();
  }

  /**
   * Generic GET request
   */
  private async get<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(includeAuth),
    });
    return this.handleResponse<T>(response);
  }

  /**
   * Generic POST request
   */
  private async post<T>(endpoint: string, data?: unknown, includeAuth: boolean = true): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(includeAuth),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  /**
   * Generic PUT request
   */
  private async put<T>(endpoint: string, data?: unknown, includeAuth: boolean = true): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(includeAuth),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  /**
   * Generic PATCH request
   */
  private async patch<T>(endpoint: string, data?: unknown, includeAuth: boolean = true): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(includeAuth),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  /**
   * Generic DELETE request
   */
  private async delete<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(includeAuth),
    });
    return this.handleResponse<T>(response);
  }

  // ==================== AUTH ENDPOINTS ====================

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/auth/register', data, false);
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    return response;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/auth/login', data, false);
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    return response;
  }

  async getProfile(): Promise<User> {
    return this.get<User>('/auth/profile');
  }

  async logout(): Promise<void> {
    this.removeToken();
  }

  // ==================== PROJECTS ENDPOINTS ====================

  async createProject(data: CreateProjectRequest): Promise<Project> {
    return this.post<Project>('/projects', data);
  }

  async getProjects(): Promise<Project[]> {
    return this.get<Project[]>('/projects');
  }

  // ==================== CONVERSATIONS ENDPOINTS ====================

  async createConversation(data: CreateConversationRequest): Promise<Conversation> {
    return this.post<Conversation>('/conversations', data);
  }

  async getConversations(projectId?: string): Promise<Conversation[]> {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return this.get<Conversation[]>(`/conversations${query}`);
  }

  async getConversation(id: string): Promise<Conversation> {
    return this.get<Conversation>(`/conversations/${id}`);
  }

  async updateConversation(id: string, data: Partial<CreateConversationRequest>): Promise<Conversation> {
    return this.put<Conversation>(`/conversations/${id}`, data);
  }

  async archiveConversation(id: string): Promise<Conversation> {
    return this.post<Conversation>(`/conversations/${id}/archive`);
  }

  async restoreConversation(id: string): Promise<Conversation> {
    return this.post<Conversation>(`/conversations/${id}/restore`);
  }

  async deleteConversation(id: string): Promise<void> {
    return this.delete<void>(`/conversations/${id}`);
  }

  // ==================== MESSAGES ENDPOINTS ====================

  async createMessage(data: CreateMessageRequest): Promise<Message> {
    return this.post<Message>('/messages', data);
  }

  async getMessages(conversationId?: string): Promise<Message[]> {
    const query = conversationId ? `?conversationId=${encodeURIComponent(conversationId)}` : '';
    return this.get<Message[]>(`/messages${query}`);
  }

  async getMessage(id: string): Promise<Message> {
    return this.get<Message>(`/messages/${id}`);
  }

  async updateMessage(id: string, data: Partial<CreateMessageRequest>): Promise<Message> {
    return this.put<Message>(`/messages/${id}`, data);
  }

  async deleteMessage(id: string): Promise<void> {
    return this.delete<void>(`/messages/${id}`);
  }

  // ==================== SUBSCRIPTION ENDPOINTS ====================

  async createSubscription(data: CreateSubscriptionRequest): Promise<Subscription> {
    return this.post<Subscription>('/subscription', data);
  }

  async getSubscription(): Promise<Subscription> {
    return this.get<Subscription>('/subscription');
  }

  async updateSubscription(data: Partial<CreateSubscriptionRequest>): Promise<Subscription> {
    return this.put<Subscription>('/subscription', data);
  }

  // ==================== LEGAL SOURCES ENDPOINTS ====================

  async getLegalSources(): Promise<any[]> {
    return this.get<any[]>('/legal-sources');
  }

  async getLegalSource(id: string): Promise<any> {
    return this.get<any>(`/legal-sources/${id}`);
  }

  // ==================== AI STREAMING ENDPOINTS ====================

  /**
   * Stream a question to the AI engine via the backend SSE relay.
   * Returns an AsyncIterable of parsed SSE events.
   */
  async *streamAsk(
    data: { question: string; conversationId?: string },
    signal?: AbortSignal,
  ): AsyncGenerator<
    { type: string; content?: string; answer?: string; documents?: any[]; sources?: string[]; error?: string },
    void,
    unknown
  > {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/ai/ask-stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Streaming request failed (${response.status}): ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body for streaming');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const event = JSON.parse(dataStr);
              yield event;

              if (event.type === 'end' || event.type === 'error') return;
            } catch {
              // Skip unparseable SSE events
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            yield JSON.parse(trimmed.slice(6));
          } catch {
            // Skip
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export hook helpers for React
export const apiHooks = {
  /**
   * Check if user is authenticated (token exists)
   */
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('auth_token');
  },

  /**
   * Clear auth state (logout)
   */
  clearAuth: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
  },
};

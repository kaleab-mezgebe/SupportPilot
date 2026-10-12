import type {
  ApiHealthStatus,
  DashboardStats,
  Ticket,
  TicketDetail,
  TicketMessage,
  KnowledgeArticle,
  User,
  AuthResponse,
  UserRole,
  TicketStatus,
  TicketPriority,
  RagAnswerResponse,
  CopilotSuggestion,
  CsatSurvey,
  CsatMetrics,
  IntegrationStatus,
  InboundEmailResult,
  AnalyticsOverview
} from '../types';

const API_BASE_URL = typeof window !== 'undefined' && window.location.port === '5173'
  ? '/api'
  : 'http://localhost:5000/api';

const getAuthHeaders = (customToken?: string): HeadersInit => {
  const token = customToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('supportpilot_token') : null);
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const ApiService = {
  // --- Auth Endpoints ---
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Login failed (HTTP ${res.status})`);
    }
    return await res.json();
  },

  async register(data: { fullName: string; email: string; password: string; role?: UserRole; organizationName?: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Registration failed (HTTP ${res.status})`);
    }
    return await res.json();
  },

  async getCurrentUser(token?: string): Promise<User | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: getAuthHeaders(token)
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // --- Health Probe ---
  async checkHealth(): Promise<ApiHealthStatus> {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error(`Health check failed (HTTP ${res.status})`);
    return await res.json();
  },

  // --- Dashboard Analytics ---
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error(`Failed to load dashboard stats (HTTP ${res.status})`);
    }
    return await res.json();
  },

  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    const res = await fetch(`${API_BASE_URL}/dashboard/analytics`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error(`Failed to load analytics overview (HTTP ${res.status})`);
    }
    return await res.json();
  },

  // --- Tickets ---
  async getTickets(params?: { 
    status?: string; 
    priority?: string; 
    search?: string; 
    queue?: string;
    sortBy?: string;
  }): Promise<Ticket[]> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'All') query.append('status', params.status);
    if (params?.priority && params.priority !== 'All') query.append('priority', params.priority);
    if (params?.search) query.append('search', params.search);
    if (params?.queue) query.append('queue', params.queue);
    if (params?.sortBy) query.append('sortBy', params.sortBy);

    const res = await fetch(`${API_BASE_URL}/tickets?${query.toString()}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch tickets (HTTP ${res.status})`);
    }
    return await res.json();
  },

  async getTicketDetail(id: string): Promise<TicketDetail> {
    const res = await fetch(`${API_BASE_URL}/tickets/${id}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch ticket detail (HTTP ${res.status})`);
    }
    return await res.json();
  },

  async createTicket(data: {
    title: string;
    description: string;
    priority: Ticket['priority'];
    customerName: string;
    customerEmail: string;
    categoryName?: string;
  }): Promise<Ticket> {
    const res = await fetch(`${API_BASE_URL}/tickets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to create ticket (HTTP ${res.status})`);
    }
    return await res.json();
  },

  async updateTicketStatus(id: string, status: TicketStatus): Promise<Ticket> {
    const res = await fetch(`${API_BASE_URL}/tickets/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error(`Failed to update ticket status (HTTP ${res.status})`);
    return await res.json();
  },

  async updateTicketPriority(id: string, priority: TicketPriority): Promise<Ticket> {
    const res = await fetch(`${API_BASE_URL}/tickets/${id}/priority`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ priority })
    });
    if (!res.ok) throw new Error(`Failed to update priority (HTTP ${res.status})`);
    return await res.json();
  },

  async assignTicket(id: string, agentId: string | null): Promise<Ticket> {
    const res = await fetch(`${API_BASE_URL}/tickets/${id}/assign`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ agentId })
    });
    if (!res.ok) throw new Error(`Failed to assign agent (HTTP ${res.status})`);
    return await res.json();
  },

  async addMessage(
    ticketId: string,
    content: string,
    isInternalNote = false,
    isAiGenerated = false
  ): Promise<TicketMessage> {
    return this.addTicketMessage(ticketId, { content, isInternalNote, isAiGenerated });
  },

  async addTicketMessage(
    ticketId: string,
    data: { content: string; isInternalNote?: boolean; isAiGenerated?: boolean }
  ): Promise<TicketMessage> {
    const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        content: data.content,
        isInternalNote: data.isInternalNote ?? false,
        isAiGenerated: data.isAiGenerated ?? false
      })
    });
    if (!res.ok) throw new Error(`Failed to post message (HTTP ${res.status})`);
    return await res.json();
  },

  // --- Bulk Triage Operations ---
  async bulkUpdateStatus(ticketIds: string[], status: TicketStatus) {
    const res = await fetch(`${API_BASE_URL}/tickets/bulk-status`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ticketIds, status })
    });
    if (!res.ok) throw new Error(`Bulk status update failed (HTTP ${res.status})`);
    return await res.json();
  },

  async bulkAssign(ticketIds: string[], agentId: string | null) {
    const res = await fetch(`${API_BASE_URL}/tickets/bulk-assign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ticketIds, agentId })
    });
    if (!res.ok) throw new Error(`Bulk assignment failed (HTTP ${res.status})`);
    return await res.json();
  },

  async bulkAssignAgent(ticketIds: string[], agentId: string | null) {
    return this.bulkAssign(ticketIds, agentId);
  },

  async bulkUpdatePriority(ticketIds: string[], priority: TicketPriority) {
    const res = await fetch(`${API_BASE_URL}/tickets/bulk-priority`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ticketIds, priority })
    });
    if (!res.ok) throw new Error(`Bulk priority update failed (HTTP ${res.status})`);
    return await res.json();
  },

  async getSupportAgents(): Promise<User[]> {
    const res = await fetch(`${API_BASE_URL}/tickets/agents`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Failed to fetch agents (HTTP ${res.status})`);
    return await res.json();
  },

  // --- Knowledge Base & RAG ---
  async getKnowledgeArticles(search?: string, category?: string): Promise<KnowledgeArticle[]> {
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (category) query.append('category', category);

    const res = await fetch(`${API_BASE_URL}/kb?${query.toString()}`);
    if (!res.ok) throw new Error(`Failed to load knowledge articles (HTTP ${res.status})`);
    return await res.json();
  },

  async createKnowledgeArticle(data: { title: string; content: string; category: string }): Promise<KnowledgeArticle> {
    const res = await fetch(`${API_BASE_URL}/kb`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Failed to create article (HTTP ${res.status})`);
    return await res.json();
  },

  async queryGroundedRag(query: string, threshold = 0.55): Promise<RagAnswerResponse> {
    const res = await fetch(`${API_BASE_URL}/kb/rag`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query, confidenceThreshold: threshold })
    });
    if (!res.ok) throw new Error(`RAG query failed (HTTP ${res.status})`);
    return await res.json();
  },

  async askRagQuestion(query: string, threshold = 0.55): Promise<RagAnswerResponse> {
    return this.queryGroundedRag(query, threshold);
  },

  async getCopilotSuggestion(ticketId: string): Promise<CopilotSuggestion> {
    const res = await fetch(`${API_BASE_URL}/kb/copilot-suggest/${ticketId}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Copilot suggestion failed (HTTP ${res.status})`);
    return await res.json();
  },

  // --- CSAT & Enterprise Integrations ---
  async submitCsat(ticketId: string, rating: number, comment?: string): Promise<CsatSurvey> {
    const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/csat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rating, feedbackComment: comment })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to submit CSAT rating (HTTP ${res.status})`);
    }
    return await res.json();
  },

  async getCsatMetrics(): Promise<CsatMetrics> {
    const res = await fetch(`${API_BASE_URL}/dashboard/csat`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Failed to fetch CSAT metrics (HTTP ${res.status})`);
    return await res.json();
  },

  async getIntegrationStatus(): Promise<IntegrationStatus> {
    const res = await fetch(`${API_BASE_URL}/integrations/status`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Failed to fetch integration status (HTTP ${res.status})`);
    return await res.json();
  },

  async testSlackWebhook(webhookUrl: string, message?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/integrations/slack/test`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ webhookUrl, message })
    });
    return await res.json();
  },

  async sendInboundEmailWebhook(payload: { from: string; to: string; subject: string; bodyText: string }): Promise<InboundEmailResult> {
    const res = await fetch(`${API_BASE_URL}/webhooks/inbound-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Inbound email webhook failed (HTTP ${res.status})`);
    return await res.json();
  }
};

export const api = ApiService;
export default ApiService;

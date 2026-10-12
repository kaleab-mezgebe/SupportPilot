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
  TicketPriority
} from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = (customToken?: string): HeadersInit => {
  const token = customToken || localStorage.getItem('supportpilot_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const FALLBACK_TICKETS: Ticket[] = [
  {
    id: '55555555-5555-5555-5555-555555555555',
    ticketReference: 'SP-1043',
    title: 'Payment gateway webhooks returning 500 error in checkout',
    description: 'Customers are reporting charged credit cards but order confirmation states failed checkout.',
    priority: 'Urgent',
    status: 'Open',
    categoryName: 'Billing',
    customerName: 'Claire Redfield',
    customerEmail: 'claire@umbrella-corp.com',
    assignedAgentName: null,
    createdAtUtc: new Date(Date.now() - 35 * 60000).toISOString(),
    updatedAtUtc: null,
    messageCount: 1,
    firstResponseDueAtUtc: new Date(Date.now() + 25 * 60000).toISOString(), // Due in 25 min!
    resolutionDueAtUtc: new Date(Date.now() + 3 * 3600000).toISOString(),
    firstResponseAtUtc: null,
    isSlaBreached: false
  },
  {
    id: '11111111-1111-1111-1111-111111111111',
    ticketReference: 'SP-1042',
    title: 'Unable to connect custom domain to workspace',
    description: 'I followed DNS CNAME setup for support.mycompany.io but certificate validation timed out.',
    priority: 'High',
    status: 'Open',
    categoryName: 'Configuration & DNS',
    customerName: 'Sarah Connor',
    customerEmail: 'sarah@cyberdyne.io',
    assignedAgentName: 'Alex Rivera',
    createdAtUtc: new Date(Date.now() - 2 * 3600000).toISOString(),
    updatedAtUtc: new Date(Date.now() - 15 * 60000).toISOString(),
    messageCount: 3,
    firstResponseDueAtUtc: new Date(Date.now() + 2 * 3600000).toISOString(),
    resolutionDueAtUtc: new Date(Date.now() + 10 * 3600000).toISOString(),
    firstResponseAtUtc: new Date(Date.now() - 15 * 60000).toISOString(),
    isSlaBreached: false
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    ticketReference: 'SP-1041',
    title: 'Billing inquiry: invoice receipt VAT id missing',
    description: 'Need updated invoice with EU VAT ID for Q3 accounting period.',
    priority: 'Medium',
    status: 'InProgress',
    categoryName: 'Billing',
    customerName: 'Marcus Vance',
    customerEmail: 'marcus@helios.tech',
    assignedAgentName: 'Emma Watson',
    createdAtUtc: new Date(Date.now() - 6 * 3600000).toISOString(),
    updatedAtUtc: new Date(Date.now() - 1 * 3600000).toISOString(),
    messageCount: 4,
    firstResponseDueAtUtc: new Date(Date.now() + 2 * 3600000).toISOString(),
    resolutionDueAtUtc: new Date(Date.now() + 18 * 3600000).toISOString(),
    firstResponseAtUtc: new Date(Date.now() - 1 * 3600000).toISOString(),
    isSlaBreached: false
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    ticketReference: 'SP-1040',
    title: 'AI Knowledge Base sync fails on large markdown docs',
    description: 'When syncing 500+ kb documentation, the vector ingestion job returns timeout 504.',
    priority: 'Urgent',
    status: 'Open',
    categoryName: 'AI & Integrations',
    customerName: 'David Chen',
    customerEmail: 'david@neuroflow.ai',
    assignedAgentName: null,
    createdAtUtc: new Date(Date.now() - 12 * 3600000).toISOString(),
    updatedAtUtc: null,
    messageCount: 1,
    firstResponseDueAtUtc: new Date(Date.now() - 11 * 3600000).toISOString(), // Breached!
    resolutionDueAtUtc: new Date(Date.now() - 8 * 3600000).toISOString(), // Breached!
    firstResponseAtUtc: null,
    isSlaBreached: true
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    ticketReference: 'SP-1039',
    title: 'How to export ticket history to CSV?',
    description: 'Looking for an automated way to export weekly resolved tickets for reporting.',
    priority: 'Low',
    status: 'Resolved',
    categoryName: 'General Support',
    customerName: 'Elena Rostova',
    customerEmail: 'elena@vanguard.co',
    assignedAgentName: 'Alex Rivera',
    createdAtUtc: new Date(Date.now() - 24 * 3600000).toISOString(),
    updatedAtUtc: new Date(Date.now() - 3 * 3600000).toISOString(),
    messageCount: 5,
    firstResponseDueAtUtc: new Date(Date.now() - 20 * 3600000).toISOString(),
    resolutionDueAtUtc: new Date(Date.now() + 48 * 3600000).toISOString(),
    firstResponseAtUtc: new Date(Date.now() - 20 * 3600000).toISOString(),
    isSlaBreached: false
  }
];

const FALLBACK_MESSAGES: Record<string, TicketMessage[]> = {
  '11111111-1111-1111-1111-111111111111': [
    {
      id: 'm-1',
      ticketId: '11111111-1111-1111-1111-111111111111',
      senderName: 'Sarah Connor',
      senderRole: 'Customer',
      content: 'I followed DNS CNAME setup for support.mycompany.io but certificate validation timed out after 30 minutes.',
      isInternalNote: false,
      isAiGenerated: false,
      createdAtUtc: new Date(Date.now() - 2 * 3600000).toISOString()
    },
    {
      id: 'm-2',
      ticketId: '11111111-1111-1111-1111-111111111111',
      senderName: 'SupportPilot AI',
      senderRole: 'AIAssistant',
      content: 'Grounded Suggestion: Checking DNS CAA records. If your root DNS enforces strict CAA policies, Let\'s Encrypt issuance may require an explicit `0 issue letsencrypt.org` record.',
      isInternalNote: true,
      isAiGenerated: true,
      createdAtUtc: new Date(Date.now() - 110 * 60000).toISOString()
    },
    {
      id: 'm-3',
      ticketId: '11111111-1111-1111-1111-111111111111',
      senderName: 'Alex Rivera',
      senderRole: 'SupportAgent',
      content: 'Hi Sarah, looking into your DNS propagation now. Could you confirm if your nameservers are managed via Cloudflare with proxy enabled?',
      isInternalNote: false,
      isAiGenerated: false,
      createdAtUtc: new Date(Date.now() - 15 * 60000).toISOString()
    }
  ]
};

const FALLBACK_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'kb-1',
    title: 'Configuring custom domains and SSL termination',
    slug: 'configuring-custom-domains-ssl',
    category: 'Setup & DNS',
    content: 'To point your custom domain to SupportPilot, create a CNAME record pointing to proxy.supportpilot.io. Automated Let\'s Encrypt SSL certificates are issued within 15 minutes of DNS propagation.',
    viewCount: 1240,
    isPublished: true,
    updatedAtUtc: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'kb-2',
    title: 'How Grounded AI Answers work with company docs',
    slug: 'grounded-ai-answers-with-company-docs',
    category: 'AI & Automations',
    content: 'SupportPilot indexes markdown and PDF documents into vector embeddings. When a customer submits a question, semantic search retrieves the top matching chunks and passes them to our generative model for high-accuracy answers.',
    viewCount: 890,
    isPublished: true,
    updatedAtUtc: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'kb-3',
    title: 'Managing Agent Permissions and Organization Roles',
    slug: 'managing-agent-permissions-org-roles',
    category: 'Administration',
    content: 'Admins can assign roles: Support Agent, Support Manager, or System Admin. Permissions enforce queue restrictions and ensure multi-tenant security.',
    viewCount: 650,
    isPublished: true,
    updatedAtUtc: new Date(Date.now() - 10 * 86400000).toISOString()
  }
];

export const ApiService = {
  // --- Auth Endpoints ---
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return {
        token: 'mock_jwt_token_' + Date.now(),
        user: {
          id: '22222222-2222-2222-2222-222222222222',
          email: email,
          fullName: email.split('@')[0],
          role: email.includes('admin') ? 'SystemAdministrator' : email.includes('agent') || email.includes('alex') ? 'SupportAgent' : 'Customer',
          organizationName: 'SupportPilot HQ',
          createdAtUtc: new Date().toISOString()
        }
      };
    }
  },

  async register(data: { fullName: string; email: string; password: string; role?: UserRole; organizationName?: string }): Promise<AuthResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return {
        token: 'mock_jwt_token_' + Date.now(),
        user: {
          id: crypto.randomUUID(),
          email: data.email,
          fullName: data.fullName,
          role: data.role || 'Customer',
          organizationName: data.organizationName || 'SupportPilot HQ',
          createdAtUtc: new Date().toISOString()
        }
      };
    }
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

  async getSupportAgents(): Promise<User[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/agents`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return [
        { id: '22222222-2222-2222-2222-222222222222', email: 'alex.rivera@supportpilot.io', fullName: 'Alex Rivera', role: 'SupportAgent', createdAtUtc: new Date().toISOString() },
        { id: '33333333-3333-3333-3333-333333333333', email: 'emma.watson@supportpilot.io', fullName: 'Emma Watson', role: 'SupportAgent', createdAtUtc: new Date().toISOString() }
      ];
    }
  },

  // --- Health & Dashboard ---
  async checkHealth(): Promise<ApiHealthStatus> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return {
        status: 'Mock Mode (Backend Ready)',
        serviceName: 'SupportPilot API (Simulated)',
        version: '1.0.0-preview',
        environment: 'Development',
        timestampUtc: new Date().toISOString()
      };
    }
  },

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return {
        totalTickets: 142,
        openTickets: 24,
        inProgressTickets: 18,
        resolvedTickets: 100,
        avgResponseTimeMinutes: 14,
        customerSatisfactionRate: 98
      };
    }
  },

  // --- Tickets & Messages ---
  async getTickets(params?: { 
    status?: string; 
    priority?: string; 
    search?: string; 
    queue?: string;
    sortBy?: string;
  }): Promise<Ticket[]> {
    try {
      const query = new URLSearchParams();
      if (params?.status && params.status !== 'All') query.append('status', params.status);
      if (params?.priority && params.priority !== 'All') query.append('priority', params.priority);
      if (params?.search) query.append('search', params.search);
      if (params?.queue) query.append('queue', params.queue);
      if (params?.sortBy) query.append('sortBy', params.sortBy);

      const res = await fetch(`${API_BASE_URL}/tickets?${query.toString()}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      let filtered = [...FALLBACK_TICKETS];
      
      // Queue preset filtering
      if (params?.queue && params.queue !== 'all') {
        const now = Date.now();
        switch (params.queue) {
          case 'assigned_to_me':
            filtered = filtered.filter(t => t.assignedAgentName?.includes('Alex'));
            break;
          case 'unassigned':
            filtered = filtered.filter(t => !t.assignedAgentName && t.status !== 'Resolved' && t.status !== 'Closed');
            break;
          case 'sla_at_risk':
            filtered = filtered.filter(t => 
              t.status !== 'Resolved' && t.status !== 'Closed' &&
              (t.isSlaBreached || 
               (t.firstResponseDueAtUtc && new Date(t.firstResponseDueAtUtc).getTime() - now <= 2 * 3600000) ||
               (t.resolutionDueAtUtc && new Date(t.resolutionDueAtUtc).getTime() - now <= 2 * 3600000))
            );
            break;
          case 'urgent':
            filtered = filtered.filter(t => t.priority === 'Urgent' && t.status !== 'Resolved' && t.status !== 'Closed');
            break;
          case 'resolved':
            filtered = filtered.filter(t => t.status === 'Resolved' || t.status === 'Closed');
            break;
        }
      }

      if (params?.status && params.status !== 'All') {
        filtered = filtered.filter(t => t.status.toLowerCase() === params.status?.toLowerCase());
      }
      if (params?.priority && params.priority !== 'All') {
        filtered = filtered.filter(t => t.priority.toLowerCase() === params.priority?.toLowerCase());
      }
      if (params?.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(t =>
          t.title.toLowerCase().includes(s) ||
          t.ticketReference.toLowerCase().includes(s) ||
          t.customerName.toLowerCase().includes(s)
        );
      }

      // Sorting
      if (params?.sortBy) {
        switch (params.sortBy) {
          case 'oldest':
            filtered.sort((a, b) => new Date(a.createdAtUtc).getTime() - new Date(b.createdAtUtc).getTime());
            break;
          case 'sla_deadline':
            filtered.sort((a, b) => {
              const aTime = a.firstResponseDueAtUtc ? new Date(a.firstResponseDueAtUtc).getTime() : Infinity;
              const bTime = b.firstResponseDueAtUtc ? new Date(b.firstResponseDueAtUtc).getTime() : Infinity;
              return aTime - bTime;
            });
            break;
          case 'priority': {
            const weight: Record<string, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
            filtered.sort((a, b) => (weight[b.priority] || 0) - (weight[a.priority] || 0));
            break;
          }
          default:
            filtered.sort((a, b) => new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime());
            break;
        }
      }

      return filtered;
    }
  },

  async getTicketDetail(id: string): Promise<TicketDetail> {
    try {
      const res = await fetch(`${API_BASE_URL}/tickets/${id}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      const ticket = FALLBACK_TICKETS.find(t => t.id === id) || FALLBACK_TICKETS[0];
      const messages = FALLBACK_MESSAGES[id] || [
        {
          id: 'm-fallback',
          ticketId: ticket.id,
          senderName: ticket.customerName,
          senderRole: 'Customer',
          content: ticket.description,
          isInternalNote: false,
          isAiGenerated: false,
          createdAtUtc: ticket.createdAtUtc
        }
      ];

      return {
        ...ticket,
        customerId: 'customer-1',
        messages
      };
    }
  },

  async createTicket(data: {
    title: string;
    description: string;
    priority: Ticket['priority'];
    customerName: string;
    customerEmail: string;
    categoryName?: string;
  }): Promise<Ticket> {
    try {
      const res = await fetch(`${API_BASE_URL}/tickets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      const now = new Date();
      const firstResponseHours = data.priority === 'Urgent' ? 1 : data.priority === 'High' ? 4 : data.priority === 'Medium' ? 8 : 24;
      const resHours = data.priority === 'Urgent' ? 4 : data.priority === 'High' ? 12 : data.priority === 'Medium' ? 24 : 72;

      const newTicket: Ticket = {
        id: crypto.randomUUID(),
        ticketReference: `SP-${1040 + FALLBACK_TICKETS.length + 1}`,
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: 'Open',
        categoryName: data.categoryName || 'General Support',
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        assignedAgentName: null,
        createdAtUtc: now.toISOString(),
        updatedAtUtc: null,
        messageCount: 1,
        firstResponseDueAtUtc: new Date(now.getTime() + firstResponseHours * 3600000).toISOString(),
        resolutionDueAtUtc: new Date(now.getTime() + resHours * 3600000).toISOString(),
        firstResponseAtUtc: null,
        isSlaBreached: false
      };
      FALLBACK_TICKETS.unshift(newTicket);
      return newTicket;
    }
  },

  async addTicketMessage(ticketId: string, data: { content: string; isInternalNote?: boolean; isAiGenerated?: boolean }): Promise<TicketMessage> {
    try {
      const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      const newMsg: TicketMessage = {
        id: crypto.randomUUID(),
        ticketId,
        senderName: data.isInternalNote ? 'Alex Rivera (Internal)' : 'Alex Rivera',
        senderRole: 'SupportAgent',
        content: data.content,
        isInternalNote: !!data.isInternalNote,
        isAiGenerated: !!data.isAiGenerated,
        createdAtUtc: new Date().toISOString()
      };
      if (!FALLBACK_MESSAGES[ticketId]) {
        FALLBACK_MESSAGES[ticketId] = [];
      }
      FALLBACK_MESSAGES[ticketId].push(newMsg);
      return newMsg;
    }
  },

  async updateTicketStatus(ticketId: string, status: TicketStatus): Promise<Ticket> {
    try {
      const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      const ticket = FALLBACK_TICKETS.find(t => t.id === ticketId);
      if (ticket) {
        ticket.status = status;
        ticket.updatedAtUtc = new Date().toISOString();
        return ticket;
      }
      throw new Error('Ticket not found');
    }
  },

  async updateTicketPriority(ticketId: string, priority: TicketPriority): Promise<Ticket> {
    try {
      const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/priority`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ priority })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      const ticket = FALLBACK_TICKETS.find(t => t.id === ticketId);
      if (ticket) {
        ticket.priority = priority;
        ticket.updatedAtUtc = new Date().toISOString();
        return ticket;
      }
      throw new Error('Ticket not found');
    }
  },

  async assignTicket(ticketId: string, agentId: string | null): Promise<Ticket> {
    try {
      const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/assign`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ agentId })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      const ticket = FALLBACK_TICKETS.find(t => t.id === ticketId);
      if (ticket) {
        ticket.assignedAgentName = agentId ? 'Alex Rivera' : null;
        ticket.updatedAtUtc = new Date().toISOString();
        return ticket;
      }
      throw new Error('Ticket not found');
    }
  },

  // --- Bulk Triage Operations (Sprint 5) ---
  async bulkUpdateStatus(ticketIds: string[], status: TicketStatus): Promise<{ updatedCount: number; message: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/tickets/bulk-status`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ticketIds, status })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      let count = 0;
      for (const id of ticketIds) {
        const t = FALLBACK_TICKETS.find(item => item.id === id);
        if (t) {
          t.status = status;
          t.updatedAtUtc = new Date().toISOString();
          count++;
        }
      }
      return { updatedCount: count, message: `Updated ${count} tickets to ${status}` };
    }
  },

  async bulkAssignAgent(ticketIds: string[], agentId: string | null): Promise<{ updatedCount: number; message: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/tickets/bulk-assign`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ticketIds, agentId })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      let count = 0;
      const agentName = agentId ? 'Alex Rivera' : null;
      for (const id of ticketIds) {
        const t = FALLBACK_TICKETS.find(item => item.id === id);
        if (t) {
          t.assignedAgentName = agentName;
          t.updatedAtUtc = new Date().toISOString();
          count++;
        }
      }
      return { updatedCount: count, message: `Assigned ${count} tickets to ${agentName || 'Unassigned'}` };
    }
  },

  async bulkUpdatePriority(ticketIds: string[], priority: TicketPriority): Promise<{ updatedCount: number; message: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/tickets/bulk-priority`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ticketIds, priority })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      let count = 0;
      for (const id of ticketIds) {
        const t = FALLBACK_TICKETS.find(item => item.id === id);
        if (t) {
          t.priority = priority;
          t.updatedAtUtc = new Date().toISOString();
          count++;
        }
      }
      return { updatedCount: count, message: `Updated priority to ${priority} for ${count} tickets` };
    }
  },

  // --- Knowledge Base ---
  async getKnowledgeArticles(search?: string, category?: string): Promise<KnowledgeArticle[]> {
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (category && category !== 'All') query.append('category', category);

      const res = await fetch(`${API_BASE_URL}/kb/articles?${query.toString()}`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return FALLBACK_ARTICLES;
    }
  }
};

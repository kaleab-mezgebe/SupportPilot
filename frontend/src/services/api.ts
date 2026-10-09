import type { ApiHealthStatus, DashboardStats, Ticket, KnowledgeArticle } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

const FALLBACK_TICKETS: Ticket[] = [
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
    messageCount: 3
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
    messageCount: 4
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
    messageCount: 1
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
    messageCount: 5
  }
];

const FALLBACK_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'kb-1',
    title: 'Configuring custom domains and SSL termination',
    category: 'Setup & DNS',
    content: 'To point your custom domain to SupportPilot, create a CNAME record pointing to proxy.supportpilot.io. Automated Let\'s Encrypt SSL certificates are issued within 15 minutes of DNS propagation.',
    viewCount: 1240,
    isPublished: true,
    updatedAtUtc: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'kb-2',
    title: 'How Grounded AI Answers work with company docs',
    category: 'AI & Automations',
    content: 'SupportPilot indexes markdown and PDF documents into vector embeddings. When a customer submits a question, the semantic search retrieves the top matching chunks and passes them to our generative model for high-accuracy answers.',
    viewCount: 890,
    isPublished: true,
    updatedAtUtc: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'kb-3',
    title: 'Managing Agent Permissions and Organization Roles',
    category: 'Administration',
    content: 'Admins can assign roles: Support Agent, Support Manager, or System Admin. Permissions enforce queue restrictions and ensure multi-tenant security.',
    viewCount: 650,
    isPublished: true,
    updatedAtUtc: new Date(Date.now() - 10 * 86400000).toISOString()
  }
];

export const ApiService = {
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
      const res = await fetch(`${API_BASE_URL}/dashboard/stats`);
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

  async getTickets(params?: { status?: string; priority?: string; search?: string }): Promise<Ticket[]> {
    try {
      const query = new URLSearchParams();
      if (params?.status && params.status !== 'All') query.append('status', params.status);
      if (params?.priority && params.priority !== 'All') query.append('priority', params.priority);
      if (params?.search) query.append('search', params.search);

      const res = await fetch(`${API_BASE_URL}/tickets?${query.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      let filtered = [...FALLBACK_TICKETS];
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
      return filtered;
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
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
        createdAtUtc: new Date().toISOString(),
        updatedAtUtc: null,
        messageCount: 1
      };
      FALLBACK_TICKETS.unshift(newTicket);
      return newTicket;
    }
  },

  async getKnowledgeArticles(): Promise<KnowledgeArticle[]> {
    return FALLBACK_ARTICLES;
  }
};

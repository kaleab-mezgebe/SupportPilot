export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TicketStatus = 'Open' | 'InProgress' | 'PendingCustomer' | 'Resolved' | 'Closed';

export interface Ticket {
  id: string;
  ticketReference: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  categoryName?: string;
  customerName: string;
  customerEmail: string;
  assignedAgentName?: string | null;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
  messageCount: number;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderName: string;
  senderRole: 'Customer' | 'SupportAgent' | 'System' | 'AIAssistant';
  content: string;
  isInternalNote: boolean;
  isAiGenerated: boolean;
  createdAtUtc: string;
}

export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  avgResponseTimeMinutes: number;
  customerSatisfactionRate: number;
}

export interface ApiHealthStatus {
  status: string;
  serviceName: string;
  version: string;
  environment: string;
  timestampUtc: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  viewCount: number;
  isPublished: boolean;
  updatedAtUtc: string;
}

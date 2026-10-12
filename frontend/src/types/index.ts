export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TicketStatus = 'Open' | 'InProgress' | 'PendingCustomer' | 'Resolved' | 'Closed';
export type UserRole = 'Customer' | 'SupportAgent' | 'SupportManager' | 'SystemAdministrator';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organizationId?: string | null;
  organizationName?: string | null;
  createdAtUtc: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type QueuePreset = 'all' | 'assigned_to_me' | 'unassigned' | 'sla_at_risk' | 'urgent' | 'resolved';
export type SortOption = 'newest' | 'oldest' | 'sla_deadline' | 'priority';

export interface BulkOperationResult {
  updatedCount: number;
  affectedTicketIds: string[];
  message: string;
}

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
  firstResponseDueAtUtc?: string | null;
  resolutionDueAtUtc?: string | null;
  firstResponseAtUtc?: string | null;
  isSlaBreached?: boolean;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId?: string;
  senderName: string;
  senderRole: string;
  content: string;
  isInternalNote: boolean;
  isAiGenerated: boolean;
  createdAtUtc: string;
}

export interface TicketDetail extends Ticket {
  categoryId?: string | null;
  customerId: string;
  assignedAgentId?: string | null;
  resolvedAtUtc?: string | null;
  messages: TicketMessage[];
}

export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  avgResponseTimeMinutes: number;
  customerSatisfactionRate: number;
  recentTickets?: Ticket[];
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
  slug?: string;
  category: string;
  content: string;
  viewCount: number;
  isPublished: boolean;
  createdAtUtc?: string;
  updatedAtUtc?: string | null;
}

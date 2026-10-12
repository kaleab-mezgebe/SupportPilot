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

// Sprint 6: RAG & Semantic Types
export interface RagCitation {
  articleId: string;
  title: string;
  slug: string;
  category: string;
  relevanceScore: number;
  excerpt: string;
}

export interface RagAnswerResponse {
  query: string;
  answer: string;
  confidenceScore: number;
  isGrounded: boolean;
  citations: RagCitation[];
  escalationReason?: string | null;
}

export interface CopilotSuggestion {
  ticketId: string;
  suggestedResponse: string;
  sourceArticleTitle: string;
  confidenceScore: number;
  citations: string[];
}

// Sprint 9: CSAT & Integrations
export interface CsatSurvey {
  id: string;
  ticketId: string;
  ticketReference: string;
  customerId: string;
  customerName: string;
  rating: number; // 1-5
  feedbackComment?: string | null;
  submittedAtUtc: string;
}

export interface CsatMetrics {
  averageRating: number;
  totalResponses: number;
  satisfactionPercentage: number;
  ratingDistribution: Record<string, number>;
  recentFeedback: CsatSurvey[];
}

export interface IntegrationStatus {
  slackConfigured: boolean;
  emailInboundActive: boolean;
  activeLlmProvider: string;
  timestampUtc: string;
}

export interface InboundEmailResult {
  success: boolean;
  action: string;
  ticketReference: string;
  ticketId: string;
  message: string;
}

export interface CategoryMetric {
  name: string;
  count: number;
  percentage: number;
  colorHex: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  actorName: string;
  timestampUtc: string;
}

export interface AnalyticsOverview {
  avgFirstResponseFormatted: string;
  avgFirstResponseMinutes: number;
  slaComplianceRate: number;
  csatAverageRating: number;
  csatSatisfactionPercentage: number;
  csatTotalCount: number;
  aiDeflectionRate: number;
  aiDeflectedCount: number;
  categoryBreakdown: CategoryMetric[];
  recentActivity: AuditLogItem[];
}


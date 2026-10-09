import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Send,
  Sparkles,
  CheckCircle,
  Lock,
  MessageSquare
} from 'lucide-react';
import { ApiService } from '../services/api';
import type { Ticket, TicketDetail, TicketStatus, User } from '../types';

interface TicketsPageProps {
  initialSelectedTicket?: Ticket | null;
}

export const TicketsPage: React.FC<TicketsPageProps> = ({ initialSelectedTicket }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(initialSelectedTicket?.id || null);
  const [ticketDetail, setTicketDetail] = useState<TicketDetail | null>(null);
  const [agents, setAgents] = useState<User[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Message reply states
  const [replyText, setReplyText] = useState('');
  const [replyMode, setReplyMode] = useState<'public' | 'internal' | 'ai'>('public');
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const loadTickets = async () => {
    const list = await ApiService.getTickets({
      status: statusFilter,
      search: searchQuery
    });
    setTickets(list);
    if (!selectedTicketId && list.length > 0) {
      setSelectedTicketId(list[0].id);
    }
  };

  const loadAgents = async () => {
    try {
      const agentList = await ApiService.getSupportAgents();
      setAgents(agentList);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadTickets();
    loadAgents();
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    if (selectedTicketId) {
      ApiService.getTicketDetail(selectedTicketId).then(detail => {
        setTicketDetail(detail);
      });
    }
  }, [selectedTicketId]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicketId) return;

    setIsSending(true);
    try {
      const isInternal = replyMode === 'internal';
      const isAi = replyMode === 'ai';

      const newMsg = await ApiService.addTicketMessage(selectedTicketId, {
        content: replyText.trim(),
        isInternalNote: isInternal,
        isAiGenerated: isAi
      });

      if (ticketDetail) {
        setTicketDetail({
          ...ticketDetail,
          messages: [...ticketDetail.messages, newMsg]
        });
      }
      setReplyText('');
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!selectedTicketId || !ticketDetail) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await ApiService.updateTicketStatus(selectedTicketId, newStatus);
      setTicketDetail({
        ...ticketDetail,
        status: updated.status
      });
      setTickets(prev => prev.map(t => t.id === selectedTicketId ? { ...t, status: updated.status } : t));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignAgent = async (agentId: string | null) => {
    if (!selectedTicketId || !ticketDetail) return;
    setIsAssigning(true);
    try {
      await ApiService.assignTicket(selectedTicketId, agentId);
      const agentName = agents.find(a => a.id === agentId)?.fullName || null;
      setTicketDetail({
        ...ticketDetail,
        assignedAgentName: agentName
      });
      setTickets(prev => prev.map(t => t.id === selectedTicketId ? { ...t, assignedAgentName: agentName } : t));
    } finally {
      setIsAssigning(false);
    }
  };

  const handleApplyAiSuggestion = () => {
    setReplyMode('ai');
    setReplyText('Based on our documentation for Custom Domain Setup (KB-101), verify that your authoritative CNAME points to proxy.supportpilot.io with TTL <= 300s. We have re-queued the SSL challenge.');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '24px', height: 'calc(100vh - 140px)' }}>
      {/* Left: Ticket List Queue */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Filters Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>Ticket Queues</h2>
            <span className="badge badge-open">{tickets.length} tickets</span>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Filter by ref, keyword or customer..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field" 
              style={{ paddingLeft: '34px', height: '36px', fontSize: '0.8rem' }}
            />
          </div>

          {/* Quick Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {['All', 'Open', 'InProgress', 'PendingCustomer', 'Resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: statusFilter === st ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  background: statusFilter === st ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: statusFilter === st ? '#a5b4fc' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets Scroll List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {tickets.map((t) => {
            const isSelected = selectedTicketId === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTicketId(t.id)}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  borderLeft: isSelected ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono' }}>
                    {t.ticketReference}
                  </span>
                  <span className={`badge badge-${t.priority.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                    {t.priority}
                  </span>
                </div>

                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.title}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>{t.customerName}</span>
                  <span className={`badge badge-${t.status.toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                    {t.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Ticket Detail & Conversation Workspace */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {ticketDetail ? (
          <>
            {/* Ticket Header Bar */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.01)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono' }}>
                      {ticketDetail.ticketReference}
                    </span>
                    <span className={`badge badge-${ticketDetail.priority.toLowerCase()}`}>
                      {ticketDetail.priority} Priority
                    </span>
                    <span className={`badge badge-${ticketDetail.status.toLowerCase()}`}>
                      {ticketDetail.status}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>
                    {ticketDetail.title}
                  </h2>
                </div>

                {/* Status & Assignment Actions */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {/* Status Dropdown */}
                  <select
                    value={ticketDetail.status}
                    disabled={isUpdatingStatus}
                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--border-focus)',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Open">Status: Open</option>
                    <option value="InProgress">Status: InProgress</option>
                    <option value="PendingCustomer">Status: PendingCustomer</option>
                    <option value="Resolved">Status: Resolved</option>
                    <option value="Closed">Status: Closed</option>
                  </select>

                  {/* Agent Assignment Dropdown */}
                  <select
                    value={ticketDetail.assignedAgentId || ''}
                    disabled={isAssigning}
                    onChange={(e) => handleAssignAgent(e.target.value ? e.target.value : null)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">👤 Unassigned</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>👤 {a.fullName}</option>
                    ))}
                  </select>

                  {/* Quick Resolve Button */}
                  {ticketDetail.status !== 'Resolved' && (
                    <button 
                      onClick={() => handleStatusChange('Resolved')}
                      className="btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--accent-success)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                    >
                      <CheckCircle size={14} />
                      <span>Resolve</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Metadata strip */}
              <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <div>Customer: <strong style={{ color: 'var(--text-main)' }}>{ticketDetail.customerName}</strong> ({ticketDetail.customerEmail})</div>
                <div>Category: <strong style={{ color: 'var(--accent-secondary)' }}>{ticketDetail.categoryName || 'General'}</strong></div>
                <div>Assigned: <strong style={{ color: '#fff' }}>{ticketDetail.assignedAgentName || 'Unassigned'}</strong></div>
              </div>
            </div>

            {/* Conversation Thread */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {ticketDetail.messages && ticketDetail.messages.length > 0 ? (
                ticketDetail.messages.map((m) => {
                  const isInternal = m.isInternalNote;
                  const isAi = m.isAiGenerated;
                  const isAgent = m.senderRole === 'SupportAgent' || m.senderRole === 'SupportManager' || m.senderRole === 'SystemAdministrator';

                  return (
                    <div 
                      key={m.id}
                      style={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        background: isInternal
                          ? 'rgba(234, 179, 8, 0.08)'
                          : isAi 
                            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)' 
                            : isAgent
                              ? 'rgba(99, 102, 241, 0.1)'
                              : 'rgba(255, 255, 255, 0.03)',
                        border: isInternal
                          ? '1px dashed rgba(234, 179, 8, 0.4)'
                          : isAi 
                            ? '1px solid rgba(99, 102, 241, 0.3)' 
                            : '1px solid var(--border-subtle)',
                        maxWidth: '85%',
                        alignSelf: isAgent || isInternal ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.75rem' }}>
                        <span style={{ 
                          fontWeight: 700, 
                          color: isInternal ? '#facc15' : isAi ? '#a5b4fc' : isAgent ? '#818cf8' : 'var(--text-main)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px' 
                        }}>
                          {isInternal && <Lock size={12} />}
                          {isAi && <Sparkles size={14} color="#818cf8" />}
                          {m.senderName} {isInternal && '(Internal Note)'}
                        </span>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                          {new Date(m.createdAtUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {m.content}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '20px' }}>
                  No messages in this ticket yet.
                </div>
              )}
            </div>

            {/* AI Copilot Suggestion Bar */}
            <div style={{
              padding: '10px 24px',
              background: 'rgba(99, 102, 241, 0.08)',
              borderTop: '1px solid rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#a5b4fc' }}>
                <Sparkles size={14} />
                <span>AI Grounding: Matched KB article with high confidence score (94%)</span>
              </div>
              <button 
                onClick={handleApplyAiSuggestion}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Insert Grounded AI Response
              </button>
            </div>

            {/* Reply Input Bar with Mode Toggles */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(15, 23, 42, 0.6)' }}>
              {/* Mode Toggle Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => setReplyMode('public')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: replyMode === 'public' ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    background: replyMode === 'public' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    color: replyMode === 'public' ? '#a5b4fc' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <MessageSquare size={13} />
                  <span>Public Reply</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReplyMode('internal')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: replyMode === 'internal' ? '#eab308' : 'var(--border-subtle)',
                    background: replyMode === 'internal' ? 'rgba(234, 179, 8, 0.15)' : 'transparent',
                    color: replyMode === 'internal' ? '#facc15' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Lock size={13} />
                  <span>Internal Note (Agents Only)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReplyMode('ai')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: replyMode === 'ai' ? '#06b6d4' : 'var(--border-subtle)',
                    background: replyMode === 'ai' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                    color: replyMode === 'ai' ? '#22d3ee' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Sparkles size={13} />
                  <span>AI Co-Pilot</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <textarea 
                  rows={2}
                  placeholder={
                    replyMode === 'internal' 
                      ? 'Add a private note visible only to team agents...' 
                      : replyMode === 'ai'
                        ? 'Draft AI assistance response...'
                        : 'Type a reply to the customer...'
                  }
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="input-field"
                  style={{ 
                    resize: 'none',
                    borderColor: replyMode === 'internal' ? 'rgba(234, 179, 8, 0.4)' : undefined
                  }}
                />
                <button 
                  onClick={handleSendReply} 
                  disabled={isSending || !replyText.trim()} 
                  className="btn-primary" 
                  style={{ 
                    padding: '10px 18px',
                    background: replyMode === 'internal' ? '#ca8a04' : undefined 
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)' }}>
            Select a ticket from the queue to view details and reply.
          </div>
        )}
      </div>
    </div>
  );
};

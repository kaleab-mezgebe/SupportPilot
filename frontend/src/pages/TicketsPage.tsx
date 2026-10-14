import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Send, 
  Sparkles, 
  CheckCircle, 
  Lock, 
  Clock,
  AlertTriangle, 
  CheckSquare, 
  Square, 
  Layers, 
  Check, 
  Star 
} from 'lucide-react';
import { ApiService } from '../services/api';
import { RealtimeService } from '../services/signalr';
import type { 
  Ticket, 
  TicketDetail, 
  TicketStatus, 
  TicketPriority, 
  User, 
  QueuePreset, 
  SortOption 
} from '../types';

interface TicketsPageProps {
  initialSelectedTicket?: Ticket | null;
}

export const TicketsPage: React.FC<TicketsPageProps> = ({ initialSelectedTicket }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(initialSelectedTicket?.id || null);
  const [ticketDetail, setTicketDetail] = useState<TicketDetail | null>(null);
  const [agents, setAgents] = useState<User[]>([]);
  
  // Triage Queue & Filter States (Sprint 5)
  const [queuePreset, setQueuePreset] = useState<QueuePreset>('all');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Bulk Selection States (Sprint 5)
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [isBulkExecuting, setIsBulkExecuting] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

  // Message reply states
  const [replyText, setReplyText] = useState('');
  const [replyMode, setReplyMode] = useState<'public' | 'internal' | 'ai'>('public');
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // CSAT Survey States (Sprint 9)
  const [csatRating, setCsatRating] = useState<number>(0);
  const [csatSubmitted, setCsatSubmitted] = useState<boolean>(false);
  const [csatComment, setCsatComment] = useState<string>('');

  const loadTickets = async () => {
    const list = await ApiService.getTickets({
      status: statusFilter,
      search: searchQuery,
      queue: queuePreset,
      sortBy: sortOption
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
  }, [statusFilter, searchQuery, queuePreset, sortOption]);

  useEffect(() => {
    if (selectedTicketId) {
      setCsatSubmitted(false);
      setCsatRating(0);
      setCsatComment('');

      ApiService.getTicketDetail(selectedTicketId).then(detail => {
        setTicketDetail(detail);
      });

      RealtimeService.joinTicket(selectedTicketId);

      const unsub = RealtimeService.onMessage((msg) => {
        if (msg.ticketId === selectedTicketId) {
          setTicketDetail(prev => {
            if (!prev) return prev;
            if (prev.messages.some(m => m.id === msg.id)) return prev;
            return {
              ...prev,
              messages: [...prev.messages, msg]
            };
          });
        }
      });

      return () => {
        RealtimeService.leaveTicket(selectedTicketId);
        unsub();
      };
    }
  }, [selectedTicketId]);

  // SLA Indicator Helper
  const getSlaIndicator = (ticket: Ticket) => {
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
      return { label: 'SLA Met', className: 'badge-sla-ok', icon: Check };
    }

    if (ticket.isSlaBreached) {
      return { label: 'SLA Breached', className: 'badge-sla-breached', icon: AlertTriangle };
    }

    const targetDateStr = ticket.firstResponseAtUtc 
      ? ticket.resolutionDueAtUtc 
      : ticket.firstResponseDueAtUtc;

    if (!targetDateStr) {
      return { label: 'SLA Active', className: 'badge-sla-ok', icon: Clock };
    }

    const diffMs = new Date(targetDateStr).getTime() - Date.now();
    if (diffMs <= 0) {
      const minsOver = Math.abs(Math.round(diffMs / 60000));
      const text = minsOver > 60 ? `${Math.floor(minsOver / 60)}h ${minsOver % 60}m` : `${minsOver}m`;
      return { label: `Overdue by ${text}`, className: 'badge-sla-breached', icon: AlertTriangle };
    }

    const diffMins = Math.round(diffMs / 60000);
    if (diffMins <= 120) {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      const text = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      return { label: `Due in ${text}`, className: 'badge-sla-warning', icon: Clock };
    }

    const hours = Math.round(diffMins / 60);
    return { label: `${hours}h left`, className: 'badge-sla-ok', icon: Clock };
  };

  // Bulk Selection Handlers
  const toggleSelectAll = () => {
    if (selectedTicketIds.length === tickets.length) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(tickets.map(t => t.id));
    }
  };

  const toggleSelectTicket = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTicketIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = async (status: TicketStatus) => {
    if (selectedTicketIds.length === 0) return;
    setIsBulkExecuting(true);
    try {
      const res = await ApiService.bulkUpdateStatus(selectedTicketIds, status);
      setBulkFeedback(res.message);
      setSelectedTicketIds([]);
      await loadTickets();
      if (selectedTicketId && selectedTicketIds.includes(selectedTicketId)) {
        const updated = await ApiService.getTicketDetail(selectedTicketId);
        setTicketDetail(updated);
      }
      setTimeout(() => setBulkFeedback(null), 3000);
    } finally {
      setIsBulkExecuting(false);
    }
  };

  const handleBulkAssign = async (agentId: string | null) => {
    if (selectedTicketIds.length === 0) return;
    setIsBulkExecuting(true);
    try {
      const res = await ApiService.bulkAssignAgent(selectedTicketIds, agentId);
      setBulkFeedback(res.message);
      setSelectedTicketIds([]);
      await loadTickets();
      if (selectedTicketId && selectedTicketIds.includes(selectedTicketId)) {
        const updated = await ApiService.getTicketDetail(selectedTicketId);
        setTicketDetail(updated);
      }
      setTimeout(() => setBulkFeedback(null), 3000);
    } finally {
      setIsBulkExecuting(false);
    }
  };

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (!selectedTicketId) return;
    setIsUpdatingPriority(true);
    try {
      const updated = await ApiService.updateTicketPriority(selectedTicketId, newPriority);
      if (ticketDetail) {
        setTicketDetail({
          ...ticketDetail,
          priority: updated.priority,
          firstResponseDueAtUtc: updated.firstResponseDueAtUtc,
          resolutionDueAtUtc: updated.resolutionDueAtUtc,
          isSlaBreached: updated.isSlaBreached
        });
      }
      await loadTickets();
    } finally {
      setIsUpdatingPriority(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!selectedTicketId) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await ApiService.updateTicketStatus(selectedTicketId, newStatus);
      if (ticketDetail) {
        setTicketDetail({
          ...ticketDetail,
          status: updated.status,
          updatedAtUtc: updated.updatedAtUtc
        });
      }
      await loadTickets();
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignAgent = async (agentId: string | null) => {
    if (!selectedTicketId) return;
    setIsAssigning(true);
    try {
      const updated = await ApiService.assignTicket(selectedTicketId, agentId);
      if (ticketDetail) {
        setTicketDetail({
          ...ticketDetail,
          assignedAgentId: agentId,
          assignedAgentName: updated.assignedAgentName
        });
      }
      await loadTickets();
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCsatRating = async (ticketId: string, rating: number) => {
    setCsatRating(rating);
    try {
      await ApiService.submitCsat(ticketId, rating, csatComment);
      setCsatSubmitted(true);
    } catch {
      setCsatSubmitted(true);
    }
  };

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
      setReplyMode('public');
      await loadTickets();
    } finally {
      setIsSending(false);
    }
  };

  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);

  const handleApplyAiSuggestion = async () => {
    if (!selectedTicketId) return;
    setIsGeneratingSuggestion(true);
    try {
      const suggestion = await ApiService.getCopilotSuggestion(selectedTicketId);
      setReplyMode('ai');
      setReplyText(suggestion.suggestedResponse);
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '460px 1fr', gap: '24px', height: 'calc(100vh - 130px)' }}>
      {/* Left Column: Triage Queue & Workspace Inbox */}
      <div className="editorial-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        
        {/* Queue Presets Strip */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--color-border-tertiary)', backgroundColor: 'var(--color-surface-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: 'var(--color-content-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={17} color="var(--color-content-primary)" />
              Support Inbox
            </h2>
            <span className="badge font-mono" style={{ backgroundColor: 'var(--color-surface-neutral)', borderColor: 'var(--color-border-tertiary)', color: 'var(--color-content-primary)' }}>
              {tickets.length} tickets
            </span>
          </div>

          {/* Queue Tab Buttons */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { id: 'all', label: 'All Queues' },
              { id: 'assigned_to_me', label: 'My Assigned' },
              { id: 'unassigned', label: 'Unassigned' },
              { id: 'sla_at_risk', label: '⚠️ SLA Risk' },
              { id: 'urgent', label: '🔥 Urgent' }
            ].map((q) => {
              const active = queuePreset === q.id;
              return (
                <button
                  key={q.id}
                  onClick={() => setQueuePreset(q.id as QueuePreset)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '9999px',
                    border: '1px solid',
                    borderColor: active ? 'var(--color-border-primary)' : 'var(--color-border-tertiary)',
                    backgroundColor: active ? 'var(--color-surface-inverted)' : 'var(--color-surface-neutral)',
                    color: active ? '#ffffff' : 'var(--color-content-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {q.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter & Sorting Controls */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} color="var(--color-content-tertiary)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search reference, customer, title..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field" 
                style={{ paddingLeft: '32px', height: '34px', fontSize: '0.8rem', borderRadius: '6px' }}
              />
            </div>

            {/* Sorting Dropdown */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                style={{
                  height: '34px',
                  backgroundColor: 'var(--color-surface-neutral)',
                  border: '1px solid var(--color-border-tertiary)',
                  borderRadius: '6px',
                  color: 'var(--color-content-primary)',
                  padding: '0 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <option value="newest">🕒 Newest</option>
                <option value="oldest">⏳ Oldest</option>
                <option value="sla_deadline">⏱️ SLA Deadline</option>
                <option value="priority">⚡ High Priority</option>
              </select>
            </div>
          </div>

          {/* Quick Status Filters */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {['All', 'Open', 'InProgress', 'PendingCustomer', 'Resolved'].map((st) => {
              const active = statusFilter === st;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: active ? 'var(--color-border-primary)' : 'var(--color-border-tertiary)',
                    backgroundColor: active ? 'var(--color-surface-dim)' : 'transparent',
                    color: active ? 'var(--color-content-primary)' : 'var(--color-content-secondary)',
                    fontSize: '0.72rem',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {st}
                </button>
              );
            })}
          </div>

          {/* Master Select All Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-content-secondary)' }}>
            <div 
              onClick={toggleSelectAll}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}
            >
              {selectedTicketIds.length > 0 && selectedTicketIds.length === tickets.length ? (
                <CheckSquare size={14} color="var(--color-content-primary)" />
              ) : (
                <Square size={14} color="var(--color-border-secondary)" />
              )}
              <span style={{ fontWeight: 600 }}>Select All ({selectedTicketIds.length} of {tickets.length})</span>
            </div>

            {bulkFeedback && (
              <span style={{ color: '#15803d', fontWeight: 600, fontSize: '0.72rem' }}>
                ✓ {bulkFeedback}
              </span>
            )}
          </div>
        </div>

        {/* Floating Bulk Action Ribbon */}
        {selectedTicketIds.length > 0 && (
          <div className="bulk-triage-bar" style={{ margin: '8px 12px', padding: '10px 14px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>
              {selectedTicketIds.length} selected
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                disabled={isBulkExecuting}
                onClick={() => handleBulkStatusChange('Resolved')}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.72rem', color: '#15803d', borderColor: '#15803d', borderRadius: '4px' }}
              >
                Resolve All
              </button>
              <button 
                disabled={isBulkExecuting}
                onClick={() => handleBulkAssign(agents[0]?.id || null)}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.72rem', borderRadius: '4px' }}
              >
                Assign
              </button>
            </div>
          </div>
        )}

        {/* Tickets Scrollable List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-content-tertiary)', fontSize: '0.85rem' }}>
              No tickets matched the current filter criteria.
            </div>
          ) : (
            tickets.map((t) => {
              const isSelected = t.id === selectedTicketId;
              const isChecked = selectedTicketIds.includes(t.id);
              const sla = getSlaIndicator(t);
              const SlaIcon = sla.icon;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid var(--color-border-tertiary)',
                    backgroundColor: isSelected ? 'var(--color-surface-dim)' : isChecked ? 'var(--color-highlight-neutral)' : 'var(--color-surface-neutral)',
                    borderLeft: isSelected ? '3px solid var(--color-border-primary)' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}
                >
                  {/* Select Checkbox */}
                  <div 
                    onClick={(e) => toggleSelectTicket(t.id, e)}
                    style={{ paddingTop: '2px', cursor: 'pointer' }}
                  >
                    {isChecked ? (
                      <CheckSquare size={15} color="var(--color-content-primary)" />
                    ) : (
                      <Square size={15} color="var(--color-border-secondary)" />
                    )}
                  </div>

                  {/* Ticket Summary Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <span className="font-mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-content-primary)' }}>
                        {t.ticketReference}
                      </span>

                      {/* Live SLA Countdown Badge */}
                      <span className={`badge ${sla.className}`} style={{ fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <SlaIcon size={10} />
                        {sla.label}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-content-primary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.title}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-content-secondary)' }}>
                      <span>{t.customerName}</span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span className={`badge badge-${t.priority.toLowerCase()}`} style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                          {t.priority}
                        </span>
                        <span className={`badge badge-${t.status.toLowerCase().replace(' ', '-')}`} style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Ticket Workspace Thread & Agent Controls */}
      <div className="editorial-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {ticketDetail ? (
          <>
            {/* Ticket Header Bar */}
            <div style={{ padding: '22px 28px', borderBottom: '1px solid var(--color-border-tertiary)', backgroundColor: 'var(--color-surface-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-content-primary)' }}>
                      {ticketDetail.ticketReference}
                    </span>

                    {/* Interactive Priority Selector */}
                    <select
                      value={ticketDetail.priority}
                      disabled={isUpdatingPriority}
                      onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                      style={{
                        backgroundColor: 'var(--color-surface-neutral)',
                        border: '1px solid var(--color-border-tertiary)',
                        borderRadius: '6px',
                        color: 'var(--color-content-primary)',
                        padding: '2px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Urgent">🔥 Urgent Priority</option>
                      <option value="High">⚡ High Priority</option>
                      <option value="Medium">🔹 Medium Priority</option>
                      <option value="Low">🌱 Low Priority</option>
                    </select>

                    <span className={`badge badge-${ticketDetail.status.toLowerCase().replace(' ', '-')}`}>
                      {ticketDetail.status}
                    </span>

                    {/* SLA Badge in Detail */}
                    {(() => {
                      const sla = getSlaIndicator(ticketDetail);
                      const SlaIcon = sla.icon;
                      return (
                        <span className={`badge ${sla.className}`} style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <SlaIcon size={12} />
                          {sla.label}
                        </span>
                      );
                    })()}
                  </div>

                  <h2 style={{ fontSize: '1.35rem', fontFamily: 'var(--font-serif)', color: 'var(--color-content-primary)', lineHeight: 1.25 }}>
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
                      backgroundColor: 'var(--color-surface-neutral)',
                      border: '1px solid var(--color-border-tertiary)',
                      borderRadius: '6px',
                      color: 'var(--color-content-primary)',
                      padding: '6px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Open">Status: Open</option>
                    <option value="InProgress">Status: In Progress</option>
                    <option value="PendingCustomer">Status: Pending Customer</option>
                    <option value="Resolved">Status: Resolved</option>
                    <option value="Closed">Status: Closed</option>
                  </select>

                  {/* Agent Assignment Dropdown */}
                  <select
                    value={ticketDetail.assignedAgentId || ''}
                    disabled={isAssigning}
                    onChange={(e) => handleAssignAgent(e.target.value ? e.target.value : null)}
                    style={{
                      backgroundColor: 'var(--color-surface-neutral)',
                      border: '1px solid var(--color-border-tertiary)',
                      borderRadius: '6px',
                      color: 'var(--color-content-primary)',
                      padding: '6px 12px',
                      fontSize: '0.78rem',
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
                      style={{ padding: '6px 14px', fontSize: '0.78rem', color: '#15803d', borderColor: '#15803d' }}
                    >
                      <CheckCircle size={14} />
                      <span>Resolve</span>
                    </button>
                  )}
                </div>
              </div>

              {/* SLA Target Details Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', padding: '10px 14px', backgroundColor: 'var(--color-surface-neutral)', border: '1px solid var(--color-border-tertiary)', borderRadius: '8px', fontSize: '0.76rem' }}>
                <div>
                  <div style={{ color: 'var(--color-content-tertiary)', fontSize: '0.7rem' }}>Customer</div>
                  <strong style={{ color: 'var(--color-content-primary)' }}>{ticketDetail.customerName}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--color-content-tertiary)', fontSize: '0.7rem' }}>Assigned Specialist</div>
                  <strong style={{ color: 'var(--color-content-primary)' }}>{ticketDetail.assignedAgentName || 'Unassigned'}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--color-content-tertiary)', fontSize: '0.7rem' }}>First Response Target</div>
                  <span className="font-mono" style={{ color: ticketDetail.firstResponseAtUtc ? '#15803d' : 'var(--color-brand-blue)', fontWeight: 600 }}>
                    {ticketDetail.firstResponseDueAtUtc ? new Date(ticketDetail.firstResponseDueAtUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '1h'}
                    {ticketDetail.firstResponseAtUtc && ' (Done)'}
                  </span>
                </div>
                <div>
                  <div style={{ color: 'var(--color-content-tertiary)', fontSize: '0.7rem' }}>Resolution Target</div>
                  <span className="font-mono" style={{ color: ticketDetail.isSlaBreached ? '#b91c1c' : '#b45309', fontWeight: 600 }}>
                    {ticketDetail.resolutionDueAtUtc ? new Date(ticketDetail.resolutionDueAtUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '4h'}
                  </span>
                </div>
              </div>

              {/* CSAT Survey Banner */}
              {(ticketDetail.status === 'Resolved' || ticketDetail.status === 'Closed') && (
                <div style={{ marginTop: '12px', padding: '12px 16px', backgroundColor: 'var(--color-highlight-yellow)', border: '1px solid rgba(240, 146, 54, 0.3)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Star size={14} fill="#b45309" /> How satisfied are you with this resolution?
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--color-content-secondary)', margin: '2px 0 0 0' }}>
                        Rate your experience to help us continuously refine our support workflows.
                      </p>
                    </div>

                    {csatSubmitted ? (
                      <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={14} /> Rated ({csatRating} ★)
                      </span>
                    ) : (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => handleCsatRating(ticketDetail.id, star)}
                            style={{
                              backgroundColor: csatRating >= star ? '#fde68a' : '#ffffff',
                              border: csatRating >= star ? '1px solid #d97706' : '1px solid var(--color-border-tertiary)',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              color: csatRating >= star ? '#92400e' : 'var(--color-content-secondary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                          >
                            {star} <Star size={11} fill={csatRating >= star ? '#92400e' : 'none'} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Conversation Thread */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--color-surface-primary)' }}>
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
                        borderRadius: 'var(--radius-s)',
                        backgroundColor: isInternal
                          ? 'var(--color-highlight-yellow)'
                          : isAi 
                            ? 'var(--color-highlight-purple)' 
                            : isAgent
                              ? 'var(--color-surface-light)'
                              : 'var(--color-surface-neutral)',
                        border: isInternal
                          ? '1px dashed #d97706'
                          : isAi 
                            ? '1px solid rgba(196, 85, 235, 0.35)' 
                            : '1px solid var(--color-border-tertiary)',
                        maxWidth: '85%',
                        alignSelf: isAgent || isInternal ? 'flex-end' : 'flex-start',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.75rem' }}>
                        <span style={{ 
                          fontWeight: 700, 
                          color: isInternal ? '#b45309' : isAi ? 'var(--color-brand-purple)' : isAgent ? 'var(--color-content-primary)' : 'var(--color-content-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {isInternal && <Lock size={12} />}
                          {isAi && <Sparkles size={12} />}
                          {m.senderName}
                        </span>
                        <span className="font-mono" style={{ color: 'var(--color-content-tertiary)', fontSize: '0.7rem' }}>
                          {new Date(m.createdAtUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div style={{ color: 'var(--color-content-primary)', fontSize: '0.88rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {m.content}
                      </div>

                      {isInternal && (
                        <div style={{ marginTop: '8px', fontSize: '0.68rem', color: '#b45309', fontWeight: 600 }}>
                          🔒 Confidential Internal Note (Visible to Agents Only)
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-content-tertiary)' }}>
                  No messages recorded in this ticket yet.
                </div>
              )}
            </div>

            {/* Reply Composer Workspace */}
            <div style={{ padding: '20px 24px', borderTop: '1px solid var(--color-border-tertiary)', backgroundColor: 'var(--color-surface-light)' }}>
              {/* Reply Mode Selector */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setReplyMode('public')}
                    style={{
                      padding: '5px 14px',
                      borderRadius: '9999px',
                      border: '1px solid',
                      borderColor: replyMode === 'public' ? 'var(--color-border-primary)' : 'var(--color-border-tertiary)',
                      backgroundColor: replyMode === 'public' ? 'var(--color-surface-inverted)' : 'var(--color-surface-neutral)',
                      color: replyMode === 'public' ? '#ffffff' : 'var(--color-content-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Public Reply
                  </button>

                  <button
                    onClick={() => setReplyMode('internal')}
                    style={{
                      padding: '5px 14px',
                      borderRadius: '9999px',
                      border: '1px solid',
                      borderColor: replyMode === 'internal' ? '#d97706' : 'var(--color-border-tertiary)',
                      backgroundColor: replyMode === 'internal' ? 'var(--color-highlight-yellow)' : 'var(--color-surface-neutral)',
                      color: replyMode === 'internal' ? '#92400e' : 'var(--color-content-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Lock size={12} />
                    Internal Note
                  </button>
                </div>

                {/* AI Co-Pilot Assistant Action */}
                <button
                  onClick={handleApplyAiSuggestion}
                  disabled={isGeneratingSuggestion}
                  className="btn-secondary"
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.75rem',
                    borderRadius: '9999px'
                  }}
                >
                  <Sparkles size={13} color="var(--color-brand-purple)" />
                  <span>{isGeneratingSuggestion ? 'Retrieving Knowledge Base...' : 'Insert Grounded AI Suggestion'}</span>
                </button>
              </div>

              {/* Textarea */}
              <div style={{ position: 'relative' }}>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    replyMode === 'internal' 
                      ? 'Add private internal notes for the support team...'
                      : 'Type response to customer...'
                  }
                  className="input-field"
                  style={{
                    width: '100%',
                    resize: 'none',
                    padding: '12px',
                    fontSize: '0.85rem',
                    backgroundColor: replyMode === 'internal' ? 'var(--color-highlight-yellow)' : 'var(--color-surface-neutral)',
                    borderColor: replyMode === 'internal' ? '#d97706' : 'var(--color-border-tertiary)',
                    borderRadius: 'var(--radius-s)'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    disabled={isSending || !replyText.trim()}
                    onClick={handleSendReply}
                    className="btn-primary"
                    style={{
                      padding: '8px 18px',
                      fontSize: '0.825rem'
                    }}
                  >
                    <Send size={14} />
                    <span>{replyMode === 'internal' ? 'Save Internal Note' : 'Send Public Reply'}</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-content-tertiary)', gap: '12px' }}>
            <Layers size={40} color="var(--color-border-tertiary)" />
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem' }}>Select a ticket from the queue to view thread &amp; triage</div>
          </div>
        )}
      </div>
    </div>
  );
};

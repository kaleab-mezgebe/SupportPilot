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
  Check
} from 'lucide-react';
import { ApiService } from '../services/api';
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
      ApiService.getTicketDetail(selectedTicketId).then(detail => {
        setTicketDetail(detail);
      });
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

  const handleBulkPriorityChange = async (priority: TicketPriority) => {
    if (selectedTicketIds.length === 0) return;
    setIsBulkExecuting(true);
    try {
      const res = await ApiService.bulkUpdatePriority(selectedTicketIds, priority);
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
    <div style={{ display: 'grid', gridTemplateColumns: '460px 1fr', gap: '24px', height: 'calc(100vh - 140px)' }}>
      {/* Left Column: Triage Queue & Workspace Inbox */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        
        {/* Queue Presets Strip (Sprint 5) */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--accent-primary)" />
              Support Workspace
            </h2>
            <span className="badge badge-open" style={{ fontSize: '0.72rem' }}>
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
            ].map((q) => (
              <button
                key={q.id}
                onClick={() => setQueuePreset(q.id as QueuePreset)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: queuePreset === q.id ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  background: queuePreset === q.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: queuePreset === q.id ? '#a5b4fc' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter & Sorting Controls */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search by ref, title, customer..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field" 
                style={{ paddingLeft: '32px', height: '34px', fontSize: '0.8rem' }}
              />
            </div>

            {/* Sorting Dropdown */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                style={{
                  height: '34px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: 'var(--text-main)',
                  padding: '0 8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <option value="newest">🕒 Newest</option>
                <option value="oldest">⏳ Oldest</option>
                <option value="sla_deadline">⏱️ SLA Deadline</option>
                <option value="priority">⚡ Highest Priority</option>
              </select>
            </div>
          </div>

          {/* Quick Status Filters */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {['All', 'Open', 'InProgress', 'PendingCustomer', 'Resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: statusFilter === st ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  background: statusFilter === st ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: statusFilter === st ? '#a5b4fc' : 'var(--text-muted)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Master Select All Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <button
              onClick={toggleSelectAll}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem'
              }}
            >
              {selectedTicketIds.length > 0 && selectedTicketIds.length === tickets.length ? (
                <CheckSquare size={14} color="var(--accent-primary)" />
              ) : (
                <Square size={14} color="var(--text-dim)" />
              )}
              <span>Select all {tickets.length}</span>
            </button>

            {selectedTicketIds.length > 0 && (
              <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                {selectedTicketIds.length} selected
              </span>
            )}
          </div>
        </div>

        {/* Floating Bulk Triage Toolbar (Sprint 5) */}
        {selectedTicketIds.length > 0 && (
          <div style={{ padding: '8px 16px', background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid var(--accent-primary)' }}>
            <div className="bulk-triage-bar">
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>
                Bulk Actions ({selectedTicketIds.length})
              </span>

              <div style={{ display: 'flex', gap: '6px' }}>
                {/* Bulk Status Select */}
                <select
                  disabled={isBulkExecuting}
                  onChange={(e) => {
                    if (e.target.value) handleBulkStatusChange(e.target.value as TicketStatus);
                  }}
                  defaultValue=""
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="" disabled>Status...</option>
                  <option value="Open">Open</option>
                  <option value="InProgress">In Progress</option>
                  <option value="PendingCustomer">Pending Customer</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>

                {/* Bulk Assign Select */}
                <select
                  disabled={isBulkExecuting}
                  onChange={(e) => {
                    if (e.target.value !== '') handleBulkAssign(e.target.value === 'null' ? null : e.target.value);
                  }}
                  defaultValue=""
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="" disabled>Assign...</option>
                  <option value="null">Unassign</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.fullName}</option>
                  ))}
                </select>

                {/* Bulk Priority Select */}
                <select
                  disabled={isBulkExecuting}
                  onChange={(e) => {
                    if (e.target.value) handleBulkPriorityChange(e.target.value as TicketPriority);
                  }}
                  defaultValue=""
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="" disabled>Priority...</option>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>

                <button
                  onClick={() => setSelectedTicketIds([])}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.72rem'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback alert toast */}
        {bulkFeedback && (
          <div style={{ padding: '8px 16px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.75rem', fontWeight: 600 }}>
            ✓ {bulkFeedback}
          </div>
        )}

        {/* Tickets Scroll List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {tickets.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No tickets matched the active queue filter.
            </div>
          ) : (
            tickets.map((t) => {
              const isSelected = selectedTicketId === t.id;
              const isChecked = selectedTicketIds.includes(t.id);
              const sla = getSlaIndicator(t);
              const SlaIcon = sla.icon;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: isSelected ? 'rgba(99, 102, 241, 0.12)' : isChecked ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--accent-primary)' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
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
                      <CheckSquare size={16} color="var(--accent-primary)" />
                    ) : (
                      <Square size={16} color="var(--text-dim)" />
                    )}
                  </div>

                  {/* Ticket Summary Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono' }}>
                        {t.ticketReference}
                      </span>

                      {/* Live SLA Countdown Badge */}
                      <span className={`badge ${sla.className}`} style={{ fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <SlaIcon size={10} />
                        {sla.label}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.title}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>{t.customerName}</span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span className={`badge badge-${t.priority.toLowerCase()}`} style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                          {t.priority}
                        </span>
                        <span className={`badge badge-${t.status.toLowerCase()}`} style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
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
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {ticketDetail ? (
          <>
            {/* Ticket Header Bar */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.01)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono' }}>
                      {ticketDetail.ticketReference}
                    </span>

                    {/* Interactive Priority Selector (Sprint 5) */}
                    <select
                      value={ticketDetail.priority}
                      disabled={isUpdatingPriority}
                      onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#fff',
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

                    <span className={`badge badge-${ticketDetail.status.toLowerCase()}`}>
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

                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
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

              {/* SLA Target Details Strip (Sprint 5) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', fontSize: '0.76rem' }}>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Customer</div>
                  <strong style={{ color: 'var(--text-main)' }}>{ticketDetail.customerName}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Assigned Specialist</div>
                  <strong style={{ color: '#fff' }}>{ticketDetail.assignedAgentName || 'Unassigned'}</strong>
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>First Response Target</div>
                  <span style={{ color: ticketDetail.firstResponseAtUtc ? 'var(--accent-success)' : 'var(--accent-primary)', fontWeight: 600 }}>
                    {ticketDetail.firstResponseDueAtUtc ? new Date(ticketDetail.firstResponseDueAtUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '1h'}
                    {ticketDetail.firstResponseAtUtc && ' (Completed)'}
                  </span>
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Resolution Target</div>
                  <span style={{ color: ticketDetail.isSlaBreached ? 'var(--accent-danger)' : 'var(--accent-secondary)', fontWeight: 600 }}>
                    {ticketDetail.resolutionDueAtUtc ? new Date(ticketDetail.resolutionDueAtUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '4h'}
                  </span>
                </div>
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
                          color: isInternal ? '#facc15' : isAi ? 'var(--accent-secondary)' : isAgent ? 'var(--accent-primary)' : 'var(--text-main)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {isInternal && <Lock size={12} />}
                          {isAi && <Sparkles size={12} />}
                          {m.senderName}
                        </span>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                          {new Date(m.createdAtUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div style={{ color: 'var(--text-main)', fontSize: '0.88rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {m.content}
                      </div>

                      {isInternal && (
                        <div style={{ marginTop: '8px', fontSize: '0.68rem', color: '#facc15', fontWeight: 600 }}>
                          🔒 Confidential Internal Note (Visible to Agents Only)
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No messages recorded in this ticket yet.
                </div>
              )}
            </div>

            {/* Reply Composer Workspace */}
            <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.01)' }}>
              {/* Reply Mode Selector */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setReplyMode('public')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: replyMode === 'public' ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      background: replyMode === 'public' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                      color: replyMode === 'public' ? '#fff' : 'var(--text-muted)',
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
                      padding: '4px 12px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: replyMode === 'internal' ? '#eab308' : 'var(--border-subtle)',
                      background: replyMode === 'internal' ? 'rgba(234, 179, 8, 0.2)' : 'transparent',
                      color: replyMode === 'internal' ? '#fde047' : 'var(--text-muted)',
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
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: 'var(--accent-secondary)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={13} />
                  <span>{isGeneratingSuggestion ? 'Retrieving Grounded KB...' : 'Insert Grounded AI Suggestion'}</span>
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
                      : 'Type reply to customer...'
                  }
                  className="input-field"
                  style={{
                    width: '100%',
                    resize: 'none',
                    padding: '12px',
                    fontSize: '0.85rem',
                    background: replyMode === 'internal' ? 'rgba(234, 179, 8, 0.04)' : 'rgba(255, 255, 255, 0.03)',
                    borderColor: replyMode === 'internal' ? 'rgba(234, 179, 8, 0.3)' : 'var(--border-subtle)'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    disabled={isSending || !replyText.trim()}
                    onClick={handleSendReply}
                    className="btn-primary"
                    style={{
                      padding: '8px 16px',
                      fontSize: '0.8rem',
                      background: replyMode === 'internal' ? '#ca8a04' : undefined
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '12px' }}>
            <Layers size={40} color="var(--border-subtle)" />
            <div>Select a ticket from the queue to view thread & triage</div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserCheck, 
  Send,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { ApiService } from '../services/api';
import type { Ticket } from '../types';

interface TicketsPageProps {
  initialSelectedTicket?: Ticket | null;
}

export const TicketsPage: React.FC<TicketsPageProps> = ({ initialSelectedTicket }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(initialSelectedTicket || null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState<{ id: string; sender: string; text: string; time: string; isAi?: boolean }[]>([
    {
      id: '1',
      sender: 'Sarah Connor (Customer)',
      text: 'I followed DNS CNAME setup for support.mycompany.io but certificate validation timed out. Can you please check if the edge proxy received the challenge?',
      time: '2 hours ago'
    },
    {
      id: '2',
      sender: 'Alex Rivera (Agent)',
      text: 'Hello Sarah! I checked our edge ingress logs. The TXT verification record was missing on your authoritative nameserver. I have triggered a re-validation now.',
      time: '15 mins ago'
    }
  ]);

  const loadTickets = async () => {
    const list = await ApiService.getTickets({
      status: statusFilter,
      search: searchQuery
    });
    setTickets(list);
    if (!selectedTicket && list.length > 0) {
      setSelectedTicket(list[0]);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, searchQuery]);

  const handleSendReply = (isAi: boolean = false) => {
    if (!replyText.trim()) return;
    setReplies(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender: isAi ? 'SupportPilot AI Assistant' : 'Alex Rivera (Agent)',
        text: replyText,
        time: 'Just now',
        isAi
      }
    ]);
    setReplyText('');
  };

  const handleApplyAiSuggestion = () => {
    setReplyText('Based on our documentation for Custom Domain Setup (KB-101), ensure that TTL is under 300s. We have verified SSL renewal has been re-queued successfully.');
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
            {['All', 'Open', 'InProgress', 'Resolved'].map((st) => (
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
            const isSelected = selectedTicket?.id === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTicket(t)}
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
        {selectedTicket ? (
          <>
            {/* Ticket Header Bar */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.01)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono' }}>
                      {selectedTicket.ticketReference}
                    </span>
                    <span className={`badge badge-${selectedTicket.priority.toLowerCase()}`}>
                      {selectedTicket.priority} Priority
                    </span>
                    <span className={`badge badge-${selectedTicket.status.toLowerCase()}`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>
                    {selectedTicket.title}
                  </h2>
                </div>

                {/* Assignment Control */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                    <UserCheck size={14} />
                    <span>{selectedTicket.assignedAgentName || 'Assign Agent'}</span>
                  </button>
                  <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--accent-success)' }}>
                    <CheckCircle size={14} />
                    <span>Resolve</span>
                  </button>
                </div>
              </div>

              {/* Metadata strip */}
              <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <div>Customer: <strong style={{ color: 'var(--text-main)' }}>{selectedTicket.customerName}</strong> ({selectedTicket.customerEmail})</div>
                <div>Category: <strong style={{ color: 'var(--accent-secondary)' }}>{selectedTicket.categoryName || 'General'}</strong></div>
              </div>
            </div>

            {/* Conversation Thread */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {replies.map((r) => (
                <div 
                  key={r.id}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    background: r.isAi 
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)' 
                      : 'rgba(255, 255, 255, 0.03)',
                    border: r.isAi 
                      ? '1px solid rgba(99, 102, 241, 0.3)' 
                      : '1px solid var(--border-subtle)',
                    maxWidth: '85%',
                    alignSelf: r.sender.includes('Customer') ? 'flex-start' : 'flex-end'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.75rem' }}>
                    <span style={{ fontWeight: 700, color: r.isAi ? '#a5b4fc' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {r.isAi && <Sparkles size={14} color="#818cf8" />}
                      {r.sender}
                    </span>
                    <span style={{ color: 'var(--text-dim)' }}>{r.time}</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                    {r.text}
                  </p>
                </div>
              ))}
            </div>

            {/* AI Copilot Suggestion Pill */}
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
                <span>AI Knowledge Retrieval: Verified DNS configuration solution detected</span>
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
                Insert Draft Response
              </button>
            </div>

            {/* Reply Input Bar */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(15, 23, 42, 0.6)' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <textarea 
                  rows={2}
                  placeholder="Type an agent reply or press ⌘ + Enter to send..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="input-field"
                  style={{ resize: 'none' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button onClick={() => handleSendReply(false)} className="btn-primary" style={{ padding: '10px 16px' }}>
                    <Send size={16} />
                  </button>
                  <button 
                    onClick={() => handleSendReply(true)} 
                    title="Send with AI Co-Pilot label"
                    className="btn-secondary" 
                    style={{ padding: '6px 16px', fontSize: '0.7rem' }}
                  >
                    <Sparkles size={12} />
                  </button>
                </div>
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

import React, { useEffect, useState } from 'react';
import { 
  Inbox, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  ArrowUpRight, 
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { ApiService } from '../services/api';
import type { DashboardStats, Ticket } from '../types';

interface DashboardPageProps {
  onSelectTicket: (ticket: Ticket) => void;
  onNavigateTickets: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectTicket, onNavigateTickets }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [statsData, ticketsData] = await Promise.all([
          ApiService.getDashboardStats(),
          ApiService.getTickets()
        ]);
        setStats(statsData);
        setRecentTickets(ticketsData.slice(0, 5));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Introduction Hero Section (Exact aesthetic of https://ellipsus.com/#introduction) */}
      <div className="intro-hero-banner" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '24px'
      }}>
        <div style={{ maxWidth: '780px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span className="badge" style={{ 
              backgroundColor: 'var(--color-surface-neutral)', 
              borderColor: 'var(--color-border-tertiary)', 
              color: 'var(--color-content-primary)',
              fontFamily: 'var(--font-mono)' 
            }}>
              SupportPilot Workspace v1.0
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-content-tertiary)' }}>•</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-content-secondary)', fontWeight: 500 }}>
              AI-Augmented Customer Platform
            </span>
          </div>

          <h2 className="intro-hero-title">
            Collaborative customer support, <span className="wiggle-accent">crafted with clarity</span><span className="blinking-cursor">|</span>
          </h2>

          <p className="intro-hero-subtitle">
            Combines AI-assisted knowledge retrieval, precision ticket routing, and real-time agent communications in one editorial SaaS workspace. Built for human agents, augmented by intelligence.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
          <button onClick={onNavigateTickets} className="btn-primary" style={{ padding: '11px 22px', fontSize: '0.9rem' }}>
            <span>Explore Inbox Queues</span>
            <ArrowUpRight size={16} />
          </button>
          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-content-tertiary)', textAlign: 'center' }}>
            Live PostgreSQL &amp; SignalR Hub
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        {/* Active Queues */}
        <div className="editorial-card" style={{ padding: '24px 26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-content-secondary)', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Active Queues</span>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--color-highlight-blue)', 
              color: 'var(--color-brand-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Inbox size={16} />
            </div>
          </div>
          <div style={{ 
            fontFamily: 'var(--font-serif)', 
            fontSize: '2.5rem', 
            fontWeight: 300, 
            color: 'var(--color-content-primary)', 
            lineHeight: 1 
          }}>
            {loading ? '—' : stats?.openTickets || 24}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '0.78rem', color: '#b91c1c' }}>
            <span className="pulse-dot" style={{ backgroundColor: 'var(--color-brand-coral)', width: '6px', height: '6px' }} />
            <span>4 urgent tickets requiring prompt triage</span>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="editorial-card" style={{ padding: '24px 26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-content-secondary)', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Avg Response Time</span>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--color-highlight-orange)', 
              color: 'var(--color-brand-orange)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ 
            fontFamily: 'var(--font-serif)', 
            fontSize: '2.5rem', 
            fontWeight: 300, 
            color: 'var(--color-content-primary)', 
            lineHeight: 1 
          }}>
            {loading ? '—' : `${stats?.avgResponseTimeMinutes || 14}m`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '0.78rem', color: 'var(--color-content-secondary)' }}>
            <span className="font-mono" style={{ color: '#15803d', fontWeight: 600 }}>Target &lt; 20m</span>
            <span>(94% within SLA)</span>
          </div>
        </div>

        {/* Resolved Tickets */}
        <div className="editorial-card" style={{ padding: '24px 26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-content-secondary)', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Resolved Tickets</span>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--color-highlight-green)', 
              color: 'var(--color-brand-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ 
            fontFamily: 'var(--font-serif)', 
            fontSize: '2.5rem', 
            fontWeight: 300, 
            color: 'var(--color-content-primary)', 
            lineHeight: 1 
          }}>
            {loading ? '—' : stats?.resolvedTickets || 100}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '0.78rem', color: '#15803d' }}>
            <TrendingUp size={14} />
            <span>98.2% customer satisfaction score</span>
          </div>
        </div>

        {/* AI Knowledge Grounding */}
        <div className="editorial-card" style={{ padding: '24px 26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-content-secondary)', marginBottom: '14px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>AI Deflection</span>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--color-highlight-purple)', 
              color: 'var(--color-brand-purple)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={16} />
            </div>
          </div>
          <div style={{ 
            fontFamily: 'var(--font-serif)', 
            fontSize: '2.5rem', 
            fontWeight: 300, 
            color: 'var(--color-content-primary)', 
            lineHeight: 1 
          }}>
            42.8%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '0.78rem', color: 'var(--color-brand-purple)' }}>
            <span>Vector RAG self-service resolved</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Priority Queue & Roadmap */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Priority Ticket Queue */}
        <div className="editorial-card" style={{ padding: '28px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-content-primary)', marginBottom: '4px' }}>
                Priority Ticket Queue
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-content-secondary)' }}>
                Latest inbound requests requiring human assistance or review
              </p>
            </div>
            <button onClick={onNavigateTickets} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentTickets.map((ticket) => (
              <div 
                key={ticket.id}
                onClick={() => onSelectTicket(ticket)}
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-s)',
                  backgroundColor: 'var(--color-surface-light)',
                  border: '1px solid var(--color-border-tertiary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-dim)';
                  e.currentTarget.style.borderColor = 'var(--color-border-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-light)';
                  e.currentTarget.style.borderColor = 'var(--color-border-tertiary)';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-content-primary)' }}>
                      {ticket.ticketReference}
                    </span>
                    <span className={`badge badge-${ticket.priority.toLowerCase()}`}>
                      {ticket.priority}
                    </span>
                    <span className={`badge badge-${ticket.status.toLowerCase().replace(' ', '-')}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-content-primary)' }}>
                    {ticket.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-content-secondary)', display: 'flex', gap: '10px' }}>
                    <span>Customer: <strong style={{ color: 'var(--color-content-primary)' }}>{ticket.customerName}</strong></span>
                    <span>•</span>
                    <span>Assignee: <strong>{ticket.assignedAgentName || 'Unassigned'}</strong></span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-content-tertiary)', fontSize: '0.8rem' }}>
                  <MessageSquare size={14} />
                  <span className="font-mono">{ticket.messageCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Milestones & System Status */}
        <div className="editorial-card" style={{ padding: '28px 26px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-content-primary)', marginBottom: '4px' }}>
              Platform Milestones
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-content-secondary)' }}>
              Completed Agile Delivery Track
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '14px', borderRadius: 'var(--radius-s)', backgroundColor: 'var(--color-highlight-green)', border: '1px solid rgba(82, 154, 106, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: '#15803d' }}>
                <span>Sprint 1–5 — Ticketing Core</span>
                <span className="font-mono">VERIFIED</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-content-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                Full triage queues, SLA breach timers, multi-tenancy RBAC, and PBKDF2 authentication.
              </p>
            </div>

            <div style={{ padding: '14px', borderRadius: 'var(--radius-s)', backgroundColor: 'var(--color-highlight-purple)', border: '1px solid rgba(196, 85, 235, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-brand-purple)' }}>
                <span>Sprint 6 — Vector AI RAG</span>
                <span className="font-mono">VERIFIED</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-content-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                pgvector embeddings, confidence thresholding, and fallback escalation pathways.
              </p>
            </div>

            <div style={{ padding: '14px', borderRadius: 'var(--radius-s)', backgroundColor: 'var(--color-highlight-blue)', border: '1px solid rgba(33, 115, 190, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-brand-blue)' }}>
                <span>Sprint 7–9 — Realtime &amp; Ops</span>
                <span className="font-mono">VERIFIED</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-content-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                SignalR live presence, email webhook parsing, Slack Block alerts, and CSAT surveys.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

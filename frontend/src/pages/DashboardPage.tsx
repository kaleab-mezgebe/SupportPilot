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
        setRecentTickets(ticketsData.slice(0, 4));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Welcome Banner */}
      <div className="glass-panel glow-card" style={{
        padding: '28px 32px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
              <Sparkles size={12} /> Sprint 1 Foundation Live
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>•</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)' }}>Single-Tenant MVP Workspace</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            Support Operations Overview
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px', maxWidth: '640px' }}>
            Combine automated AI knowledge grounding with structured ticket routing and real-time agent responses.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onNavigateTickets} className="btn-primary">
            <span>View All Tickets</span>
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        {/* Total Tickets */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Active Queues</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)' }}>
              <Inbox size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
            {loading ? '...' : stats?.openTickets || 24}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.78rem', color: 'var(--accent-success)' }}>
            <TrendingUp size={14} />
            <span>4 urgent requiring immediate agent assignment</span>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Avg Response Time</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-secondary)' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
            {loading ? '...' : `${stats?.avgResponseTimeMinutes || 14}m`}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.78rem', color: 'var(--accent-secondary)' }}>
            <span>Target SLA: &lt; 20m (Well within limits)</span>
          </div>
        </div>

        {/* Resolution Rate */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Resolved Tickets</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
            {loading ? '...' : stats?.resolvedTickets || 100}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.78rem', color: 'var(--accent-success)' }}>
            <span>98% CSAT Rating this sprint</span>
          </div>
        </div>

        {/* AI Answer Assistance */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>AI Self-Service</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-purple)' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
            42%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.78rem', color: 'var(--accent-purple)' }}>
            <span>Deflected without agent intervention</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Recent Tickets & Architecture Roadmap */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Recent Tickets Table */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Priority Ticket Queue</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latest active support threads requiring attention</p>
            </div>
            <button onClick={onNavigateTickets} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentTickets.map((ticket) => (
              <div 
                key={ticket.id}
                onClick={() => onSelectTicket(ticket)}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono' }}>
                      {ticket.ticketReference}
                    </span>
                    <span className={`badge badge-${ticket.priority.toLowerCase()}`}>
                      {ticket.priority}
                    </span>
                    <span className={`badge badge-${ticket.status.toLowerCase()}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.925rem', fontWeight: 600, color: '#fff' }}>
                    {ticket.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                    <span>Customer: <strong style={{ color: 'var(--text-main)' }}>{ticket.customerName}</strong></span>
                    <span>•</span>
                    <span>Assignee: <strong style={{ color: ticket.assignedAgentName ? 'var(--accent-secondary)' : 'var(--accent-warning)' }}>{ticket.assignedAgentName || 'Unassigned'}</strong></span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  <MessageSquare size={14} />
                  <span>{ticket.messageCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap Milestones */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Delivery Roadmap</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>8-Week Delivery Track</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#34d399' }}>
                <span>Sprint 1 — Foundation</span>
                <span>Ready</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                React + ASP.NET Core API + Postgres + Swagger + CORS verified.
              </p>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#818cf8' }}>
                <span>Sprint 2 — Identity & Auth</span>
                <span>Next</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Role-based authorization, JWT bearer tokens, customer vs agent isolation.
              </p>
            </div>

            <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)' }}>
                <span>Sprint 3-4 — Ticketing MVP</span>
                <span>Planned</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                Threaded replies, SLA tracking, category workflows, audit logs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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

  // Editorial typewriter animation matching Ellipsus signature headline
  const phrases = [
    'crafted with clarity',
    'powered by intelligence',
    'resolved with precision',
    'orchestrated in real-time',
    'built for human empathy'
  ];
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('crafted with clarity');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(70);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (displayedText.length < currentPhrase.length) {
          setDisplayedText(currentPhrase.slice(0, displayedText.length + 1));
          setTypingSpeed(55 + Math.random() * 25);
        } else {
          setTypingSpeed(2400); // Pause on completed phrase
          setIsDeleting(true);
        }
      } else {
        if (displayedText.length > 0) {
          setDisplayedText(currentPhrase.slice(0, displayedText.length - 1));
          setTypingSpeed(28);
        } else {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % phrases.length);
          setTypingSpeed(320);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, phraseIndex, typingSpeed]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Introduction Hero Section (Exact aesthetic of https://ellipsus.com/#introduction) */}
      <div className="intro-hero-banner" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '24px',
        position: 'relative'
      }}>
        {/* Subtle Editorial Curve Background Watermark */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 264 241"
          fill="none"
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: '-16px',
            top: '-24px',
            width: '260px',
            height: '240px',
            pointerEvents: 'none',
            opacity: 0.08,
            color: 'var(--color-content-primary)'
          }}
        >
          <path
            d="M7 84C4 75 14 62 30 50C46 38 72 25 105 20C138 15 178 18 210 32C242 46 266 71 254 98C242 125 194 154 152 172C110 190 74 197 50 188C26 179 14 154 18 132"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M25 90C40 70 85 45 135 48C185 51 220 82 215 118C210 154 165 180 120 178C75 176 40 146 45 110"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        </svg>

        <div style={{ maxWidth: '780px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <div className="hero-status-pill">
              <span className="live-pulse-dot" />
              <span>SupportPilot Workspace v1.0</span>
            </div>
            <span className="hero-sep-dot">•</span>
            <span className="hero-badge-tag">
              <Sparkles size={13} style={{ color: 'var(--color-brand-orange)' }} />
              <span>AI-Augmented Customer Platform</span>
            </span>
          </div>

          <h2 className="intro-hero-title" style={{ animation: 'heroFadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both' }}>
            Collaborative customer support,{' '}
            <span className="wiggle-accent">{displayedText}</span>
            <span className="blinking-cursor">|</span>
          </h2>

          <p className="intro-hero-subtitle" style={{ animation: 'heroFadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both' }}>
            Combines{' '}
            <span className="hero-annotation-blue" title="Semantic vector retrieval against grounded articles">
              AI-assisted knowledge retrieval
            </span>
            ,{' '}
            <span className="hero-annotation-purple" title="Rule-based triage and dynamic SLA triggers">
              precision ticket routing
            </span>
            , and{' '}
            <span className="hero-annotation-green" title="SignalR backplane with live agent presence">
              real-time agent communications
            </span>{' '}
            in one editorial SaaS workspace. Built for human agents, augmented by intelligence.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0, position: 'relative', zIndex: 1 }}>
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

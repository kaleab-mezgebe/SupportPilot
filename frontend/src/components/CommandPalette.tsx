import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  TicketCheck, 
  BookOpen, 
  MessageSquareCode, 
  BarChart3, 
  Plus, 
  User, 
  ArrowRight, 
  Layers, 
  Sparkles,
  X
} from 'lucide-react';
import { ApiService } from '../services/api';
import type { Ticket, KnowledgeArticle } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onSelectTicket: (ticket: Ticket) => void;
  onOpenNewTicket: () => void;
  onOpenAuth: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectTicket,
  onOpenNewTicket,
  onOpenAuth
}) => {
  const [query, setQuery] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Load initial search datasets
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      ApiService.getTickets().then(t => setTickets(t)).catch(() => {});
      ApiService.getKnowledgeArticles().then(a => setArticles(a)).catch(() => {});
    }
  }, [isOpen]);

  // Actions available in the command palette
  const defaultActions = [
    {
      id: 'action-new-ticket',
      category: 'Actions',
      title: 'Create New Support Ticket',
      subtitle: 'Open submission modal for customer issue',
      icon: Plus,
      badge: 'Action',
      run: () => { onClose(); onOpenNewTicket(); }
    },
    {
      id: 'action-inbox',
      category: 'Actions',
      title: 'Jump to Support Inbox',
      subtitle: 'Filter queues, triage tickets, and manage SLAs',
      icon: Layers,
      badge: 'Queue',
      run: () => { onClose(); onNavigate('tickets'); }
    },
    {
      id: 'action-kb',
      category: 'Actions',
      title: 'Explore Knowledge Base & Vector AI',
      subtitle: 'Browse grounded articles and ask semantic queries',
      icon: BookOpen,
      badge: 'AI',
      run: () => { onClose(); onNavigate('knowledge'); }
    },
    {
      id: 'action-chat',
      category: 'Actions',
      title: 'Open Live Realtime Hub',
      subtitle: 'SignalR instant chat channels with active presence',
      icon: MessageSquareCode,
      badge: 'Live',
      run: () => { onClose(); onNavigate('chat'); }
    },
    {
      id: 'action-analytics',
      category: 'Actions',
      title: 'View Analytics & CSAT Metrics',
      subtitle: 'First response horizons, SLA compliance, webhooks',
      icon: BarChart3,
      badge: 'Reports',
      run: () => { onClose(); onNavigate('analytics'); }
    },
    {
      id: 'action-auth',
      category: 'Actions',
      title: 'Sign In / Account Access',
      subtitle: 'Authenticate with email & password or create an account',
      icon: User,
      badge: 'Auth',
      run: () => { onClose(); onOpenAuth(); }
    }
  ];

  // Filter actions
  const filteredActions = defaultActions.filter(a => 
    a.title.toLowerCase().includes(query.toLowerCase()) || 
    a.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  // Filter tickets
  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(query.toLowerCase()) || 
    t.ticketReference.toLowerCase().includes(query.toLowerCase()) ||
    t.customerName.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  // Filter articles
  const filteredArticles = articles.filter(art => 
    art.title.toLowerCase().includes(query.toLowerCase()) || 
    art.category.toLowerCase().includes(query.toLowerCase()) ||
    art.content.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  // Consolidated items list for keyboard navigation
  const flatItems: Array<{
    id: string;
    type: 'action' | 'ticket' | 'article';
    category: string;
    title: string;
    subtitle: string;
    icon: any;
    badge?: string;
    onExecute: () => void;
  }> = [
    ...filteredActions.map(a => ({
      id: a.id,
      type: 'action' as const,
      category: 'Quick Actions',
      title: a.title,
      subtitle: a.subtitle,
      icon: a.icon,
      badge: a.badge,
      onExecute: a.run
    })),
    ...filteredTickets.map(t => ({
      id: t.id,
      type: 'ticket' as const,
      category: 'Tickets',
      title: `${t.ticketReference} — ${t.title}`,
      subtitle: `Customer: ${t.customerName} • Status: ${t.status} • Priority: ${t.priority}`,
      icon: TicketCheck,
      badge: t.priority,
      onExecute: () => {
        onClose();
        onSelectTicket(t);
        onNavigate('tickets');
      }
    })),
    ...filteredArticles.map(art => ({
      id: art.id,
      type: 'article' as const,
      category: 'Knowledge Base',
      title: art.title,
      subtitle: `Category: ${art.category} • Grounded RAG Documentation`,
      icon: BookOpen,
      badge: 'Article',
      onExecute: () => {
        onClose();
        onNavigate('knowledge');
      }
    }))
  ];

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, flatItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + flatItems.length) % Math.max(1, flatItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          flatItems[selectedIndex].onExecute();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(25, 25, 23, 0.55)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '10vh',
      zIndex: 120,
      animation: 'heroFadeSlideUp 0.15s ease'
    }}>
      <div 
        className="editorial-card" 
        style={{
          width: '640px',
          maxHeight: '75vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          padding: 0
        }}
      >
        {/* Command Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border-tertiary)',
          backgroundColor: 'var(--color-surface-light)'
        }}>
          <Search size={18} color="var(--color-content-secondary)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tickets, articles, commands, customers..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '1rem',
              fontFamily: 'var(--font-sans)',
              color: 'var(--color-content-primary)'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'var(--color-surface-dim)',
              color: 'var(--color-content-tertiary)'
            }}>
              ESC to close
            </span>
            <button 
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--color-content-tertiary)', cursor: 'pointer', display: 'flex', padding: '4px' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Results Container */}
        <div style={{ overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '52vh' }}>
          {flatItems.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--color-content-tertiary)' }}>
              <Sparkles size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ fontSize: '0.9rem', color: 'var(--color-content-secondary)' }}>No matching results found for "{query}"</p>
              <p style={{ fontSize: '0.78rem', marginTop: '4px' }}>Try searching by ticket reference (e.g. SP-1043) or topic (DNS, Billing)</p>
            </div>
          ) : (
            flatItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.onExecute()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-s)',
                    backgroundColor: isSelected ? 'var(--color-surface-dim)' : 'transparent',
                    border: isSelected ? '1px solid var(--color-border-secondary)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: isSelected ? 'var(--color-surface-inverted)' : 'var(--color-surface-neutral)',
                    color: isSelected ? '#ffffff' : 'var(--color-content-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--color-border-tertiary)',
                    flexShrink: 0
                  }}>
                    <Icon size={16} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-content-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className="badge font-mono" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-content-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                      {item.subtitle}
                    </div>
                  </div>

                  {isSelected && (
                    <ArrowRight size={14} color="var(--color-content-secondary)" style={{ flexShrink: 0 }} />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Command Palette Footer */}
        <div style={{
          padding: '10px 20px',
          borderTop: '1px solid var(--color-border-tertiary)',
          backgroundColor: 'var(--color-surface-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.72rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-content-tertiary)'
        }}>
          <div style={{ display: 'flex', gap: '14px' }}>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Dismiss</span>
          </div>
          <div>
            SupportPilot Editorial Assistant
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  AlertTriangle, 
  MessageSquare, 
  Sparkles, 
  ShieldCheck, 
  X,
  ExternalLink 
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  type: 'sla_alert' | 'message' | 'ai_resolved' | 'assignment' | 'system';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  ticketReference?: string;
  tabTarget?: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenTicketReference?: (ticketRef: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenTicketReference
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      type: 'sla_alert',
      title: 'SLA Horizon Warning: SP-1043',
      description: 'Payment gateway error ticket approaching first response threshold (25m remaining).',
      timestamp: '10m ago',
      isRead: false,
      ticketReference: 'SP-1043',
      tabTarget: 'tickets'
    },
    {
      id: 'notif-2',
      type: 'message',
      title: 'Customer Reply: Sarah Connor',
      description: 'Sarah updated SSO configuration notes on ticket TCK-20261012-001.',
      timestamp: '28m ago',
      isRead: false,
      ticketReference: 'TCK-20261012-001',
      tabTarget: 'tickets'
    },
    {
      id: 'notif-3',
      type: 'ai_resolved',
      title: 'Vector RAG Query Deflected',
      description: 'Customer question regarding custom domain CNAME records was auto-answered with 94% confidence.',
      timestamp: '1h ago',
      isRead: false,
      tabTarget: 'knowledge'
    },
    {
      id: 'notif-4',
      type: 'assignment',
      title: 'Ticket Assigned: SP-1042',
      description: 'Alex Rivera assigned to "DNS CNAME propagation delay after nameserver transfer".',
      timestamp: '2h ago',
      isRead: true,
      ticketReference: 'SP-1042',
      tabTarget: 'tickets'
    }
  ]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? ({ ...n, isRead: true }) : n));
  };

  const handleItemClick = (item: NotificationItem) => {
    markAsRead(item.id);
    onClose();
    if (item.ticketReference && onOpenTicketReference) {
      onOpenTicketReference(item.ticketReference);
    } else if (item.tabTarget) {
      onNavigateTab(item.tabTarget);
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'sla_alert':
        return <AlertTriangle size={15} color="var(--color-brand-coral)" />;
      case 'message':
        return <MessageSquare size={15} color="var(--color-brand-blue)" />;
      case 'ai_resolved':
        return <Sparkles size={15} color="var(--color-brand-purple)" />;
      case 'assignment':
        return <ShieldCheck size={15} color="#15803d" />;
      default:
        return <Bell size={15} color="var(--color-content-secondary)" />;
    }
  };

  return (
    <div style={{
      position: 'absolute',
      right: '48px',
      top: 'calc(var(--header-height) - 4px)',
      width: '380px',
      backgroundColor: 'var(--color-surface-neutral)',
      border: '1px solid var(--color-border-tertiary)',
      borderRadius: 'var(--radius-m)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      animation: 'heroFadeSlideUp 0.15s ease'
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--color-border-tertiary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'var(--color-surface-light)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h4 style={{ fontSize: '0.95rem', fontFamily: 'var(--font-serif)', color: 'var(--color-content-primary)' }}>
            Notifications
          </h4>
          {unreadCount > 0 && (
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-highlight-coral)',
              color: 'var(--color-brand-coral)',
              border: '1px solid rgba(235, 91, 85, 0.3)'
            }}>
              {unreadCount} new
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              title="Mark all as read"
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.72rem',
                color: 'var(--color-brand-blue)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600
              }}
            >
              <CheckCheck size={14} />
              <span>Mark read</span>
            </button>
          )}
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--color-content-tertiary)', cursor: 'pointer', display: 'flex', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--color-content-tertiary)' }}>
            <Bell size={20} style={{ margin: '0 auto 6px', opacity: 0.5 }} />
            <p style={{ fontSize: '0.85rem' }}>No new notifications</p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid var(--color-border-tertiary)',
                backgroundColor: item.isRead ? 'transparent' : 'var(--color-surface-dim)',
                cursor: 'pointer',
                transition: 'background-color 0.12s ease',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-surface-light)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = item.isRead ? 'transparent' : 'var(--color-surface-dim)';
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-surface-neutral)',
                border: '1px solid var(--color-border-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px'
              }}>
                {getIcon(item.type)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: item.isRead ? 500 : 700, color: 'var(--color-content-primary)' }}>
                    {item.title}
                  </span>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--color-content-tertiary)' }}>
                    {item.timestamp}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-content-secondary)', lineHeight: 1.35, margin: 0 }}>
                  {item.description}
                </p>
              </div>

              {!item.isRead && (
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-brand-blue)',
                  marginTop: '8px',
                  flexShrink: 0
                }} />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 18px',
        backgroundColor: 'var(--color-surface-light)',
        borderTop: '1px solid var(--color-border-tertiary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--color-content-tertiary)' }}>
          Realtime SignalR Dispatch
        </span>
        <button
          onClick={() => { onClose(); onNavigateTab('tickets'); }}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '0.72rem',
            color: 'var(--color-brand-blue)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 600
          }}
        >
          <span>View all in Inbox</span>
          <ExternalLink size={12} />
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { 
  LayoutDashboard, 
  TicketCheck, 
  BookOpen, 
  MessageSquareCode, 
  BarChart3, 
  Settings
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openTicketCount?: number;
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  openTicketCount,
  onOpenSettings 
}) => {
  const { user } = useAuth();

  const userInitials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SP';

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, badge: null },
    { id: 'tickets', label: 'Ticket Inbox', icon: TicketCheck, badge: openTicketCount ? String(openTicketCount) : '7' },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen, badge: 'AI' },
    { id: 'chat', label: 'Live Hub', icon: MessageSquareCode, badge: 'Live' },
    { id: 'analytics', label: 'Analytics & SLAs', icon: BarChart3, badge: null },
  ];

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      backgroundColor: 'var(--color-surface-light)',
      borderRight: '1px solid var(--color-border-tertiary)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50
    }}>
      {/* Brand Logo - Ellipsus Editorial Style */}
      <div style={{
        padding: '24px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid var(--color-border-tertiary)'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: 'var(--color-surface-inverted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontFamily: 'var(--font-serif)',
          fontSize: '1.1rem',
          fontWeight: 600
        }}>
          S
        </div>
        <div>
          <h1 style={{ 
            fontSize: '1.2rem', 
            fontFamily: 'var(--font-serif)', 
            fontWeight: 400, 
            letterSpacing: '-0.02em', 
            color: 'var(--color-content-primary)',
            lineHeight: 1.1
          }}>
            Support<em>Pilot</em>
          </h1>
          <span style={{ 
            fontSize: '0.68rem', 
            fontFamily: 'var(--font-mono)', 
            color: 'var(--color-content-tertiary)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.06em' 
          }}>
            Editorial Desk
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '24px 14px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        <div style={{ 
          padding: '0 12px 10px', 
          fontSize: '0.7rem', 
          fontFamily: 'var(--font-mono)',
          fontWeight: 600, 
          color: 'var(--color-content-tertiary)', 
          textTransform: 'uppercase', 
          letterSpacing: '0.08em' 
        }}>
          Workspace
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-s)',
                border: isActive ? '1px solid var(--color-border-tertiary)' : '1px solid transparent',
                backgroundColor: isActive ? 'var(--color-surface-neutral)' : 'transparent',
                color: isActive ? 'var(--color-content-primary)' : 'var(--color-content-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease',
                position: 'relative',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <Icon size={17} color={isActive ? 'var(--color-content-primary)' : 'var(--color-content-tertiary)'} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  backgroundColor: item.badge === 'AI' ? 'var(--color-highlight-purple)' : item.badge === 'Live' ? 'var(--color-highlight-green)' : 'var(--color-highlight-neutral)',
                  color: item.badge === 'AI' ? 'var(--color-brand-purple)' : item.badge === 'Live' ? '#15803d' : 'var(--color-content-primary)',
                  border: item.badge === 'AI' ? '1px solid rgba(196, 85, 235, 0.3)' : item.badge === 'Live' ? '1px solid rgba(82, 154, 106, 0.3)' : '1px solid var(--color-border-tertiary)'
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Organization & User Profile Footer */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--color-border-tertiary)',
        backgroundColor: 'var(--color-surface-light)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 10px',
          borderRadius: 'var(--radius-s)',
          border: '1px solid var(--color-border-tertiary)',
          backgroundColor: 'var(--color-surface-neutral)'
        }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: user?.role === 'Customer' ? 'var(--color-brand-blue)' : 'var(--color-surface-intro)',
            border: '1px solid var(--color-border-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            color: user?.role === 'Customer' ? '#ffffff' : 'var(--color-content-primary)'
          }}>
            {userInitials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-content-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.fullName || 'Guest User'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span className="pulse-dot" style={{ width: '6px', height: '6px' }} />
              {user?.role ? `${user.role} Active` : 'Workspace Active'}
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            title="Workspace Settings"
            style={{ background: 'none', border: 'none', padding: 0, display: 'flex', cursor: 'pointer', color: 'var(--color-content-tertiary)' }}
          >
            <Settings size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
};

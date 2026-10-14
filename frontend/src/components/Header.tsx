import React, { useEffect, useState } from 'react';
import { Search, Bell, RefreshCw, Plus, User as UserIcon, Shield, LogOut, ChevronDown, LogIn, UserPlus } from 'lucide-react';
import { ApiService } from '../services/api';
import { useAuth } from '../features/auth/AuthContext';
import { NotificationCenter } from './NotificationCenter';
import type { ApiHealthStatus, UserRole } from '../types';

interface HeaderProps {
  onNewTicketClick?: () => void;
  onOpenSearch?: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenTicketReference?: (ticketRef: string) => void;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onNewTicketClick,
  onOpenSearch,
  onNavigateTab,
  onOpenTicketReference,
  onOpenAuthModal
}) => {
  const { user, switchDemoUser, logout } = useAuth();
  const [health, setHealth] = useState<ApiHealthStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await ApiService.checkHealth();
      setHealth(res);
    } catch {
      setHealth(null);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRoleSwitch = async (role: UserRole) => {
    await switchDemoUser(role);
    setIsProfileMenuOpen(false);
  };

  return (
    <header style={{
      height: 'var(--header-height)',
      padding: '0 48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--color-border-tertiary)',
      backgroundColor: 'var(--color-surface-primary)',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      {/* Search Bar (Command Palette Trigger) */}
      <div 
        onClick={onOpenSearch}
        style={{ position: 'relative', width: '380px', cursor: 'pointer' }}
      >
        <Search size={15} color="var(--color-content-tertiary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input 
          type="text" 
          readOnly
          onClick={onOpenSearch}
          placeholder="Search tickets, articles, customers (⌘ + K)..." 
          className="input-field" 
          style={{ 
            paddingLeft: '38px', 
            paddingRight: '60px',
            height: '38px', 
            fontSize: '0.85rem',
            borderRadius: '9999px',
            backgroundColor: 'var(--color-surface-neutral)',
            cursor: 'pointer'
          }} 
        />
        <span style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '0.7rem',
          fontFamily: 'var(--font-mono)',
          padding: '2px 6px',
          borderRadius: '4px',
          backgroundColor: 'var(--color-surface-dim)',
          color: 'var(--color-content-tertiary)',
          pointerEvents: 'none'
        }}>
          ⌘K
        </span>
      </div>

      {/* Status & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* API Health Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '9999px',
          backgroundColor: 'var(--color-highlight-green)',
          border: '1px solid rgba(82, 154, 106, 0.3)',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: '#15803d'
        }}>
          <span className="pulse-dot" />
          <span>API: {health?.status || 'Online'}</span>
          <button 
            onClick={checkStatus} 
            disabled={checking}
            title="Refresh API Health"
            style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', display: 'flex', padding: 0 }}
          >
            <RefreshCw size={12} style={{ animation: checking ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* Create Ticket Button */}
        {onNewTicketClick && (
          <button onClick={onNewTicketClick} className="btn-primary" style={{ borderRadius: '9999px', padding: '8px 16px', fontSize: '0.825rem' }}>
            <Plus size={15} />
            <span>New Ticket</span>
          </button>
        )}

        {/* Notifications Icon Button */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            title="Real-time Alerts & Notifications"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid var(--color-border-tertiary)',
              backgroundColor: isNotificationOpen ? 'var(--color-surface-dim)' : 'var(--color-surface-neutral)',
              color: 'var(--color-content-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              position: 'relative'
            }}
          >
            <Bell size={16} />
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-brand-coral)',
              border: '1.5px solid var(--color-surface-neutral)'
            }} />
          </button>

          <NotificationCenter
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
            onNavigateTab={onNavigateTab || (() => {})}
            onOpenTicketReference={onOpenTicketReference}
          />
        </div>

        {/* User Identity / Persona Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '5px 12px',
              borderRadius: '9999px',
              border: '1px solid var(--color-border-tertiary)',
              backgroundColor: 'var(--color-surface-neutral)',
              color: 'var(--color-content-primary)',
              cursor: 'pointer',
              transition: 'border-color 0.15s ease'
            }}
          >
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: user?.role === 'Customer' ? 'var(--color-brand-blue)' : 'var(--color-surface-inverted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.72rem',
              color: '#ffffff'
            }}>
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-content-primary)' }}>
                {user?.fullName || 'Guest User'}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-content-tertiary)' }}>
                {user?.role || 'Viewer'}
              </div>
            </div>
            <ChevronDown size={14} color="var(--color-content-tertiary)" />
          </button>

          {isProfileMenuOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '44px',
              width: '260px',
              backgroundColor: 'var(--color-surface-neutral)',
              border: '1px solid var(--color-border-tertiary)',
              borderRadius: 'var(--radius-m)',
              padding: '8px',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 50
            }}>
              {/* Custom Authentication Trigger */}
              <div style={{ padding: '4px 6px', marginBottom: '4px' }}>
                <button
                  onClick={() => { setIsProfileMenuOpen(false); onOpenAuthModal?.('login'); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    backgroundColor: 'var(--color-surface-light)',
                    border: '1px solid var(--color-border-tertiary)',
                    borderRadius: '6px',
                    color: 'var(--color-content-primary)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    marginBottom: '6px'
                  }}
                >
                  <LogIn size={14} color="var(--color-brand-blue)" />
                  <span>Sign In with Password...</span>
                </button>
                <button
                  onClick={() => { setIsProfileMenuOpen(false); onOpenAuthModal?.('register'); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    backgroundColor: 'transparent',
                    border: '1px solid transparent',
                    borderRadius: '6px',
                    color: 'var(--color-content-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <UserPlus size={14} />
                  <span>Create New Account</span>
                </button>
              </div>

              <div style={{ padding: '8px 12px 6px', borderTop: '1px solid var(--color-border-tertiary)', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-content-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Switch Identity (Demo)
                </span>
              </div>

              <button
                onClick={() => handleRoleSwitch('SupportAgent')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: user?.role === 'SupportAgent' ? 'var(--color-highlight-neutral)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'var(--color-content-primary)',
                  fontSize: '0.8rem',
                  fontWeight: user?.role === 'SupportAgent' ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Shield size={14} color="var(--color-brand-blue)" />
                <span>Alex Rivera (Support Agent)</span>
              </button>

              <button
                onClick={() => handleRoleSwitch('Customer')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: user?.role === 'Customer' ? 'var(--color-highlight-neutral)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'var(--color-content-primary)',
                  fontSize: '0.8rem',
                  fontWeight: user?.role === 'Customer' ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <UserIcon size={14} color="var(--color-brand-green)" />
                <span>Sarah Connor (Customer)</span>
              </button>

              <button
                onClick={() => handleRoleSwitch('SystemAdministrator')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: user?.role === 'SystemAdministrator' ? 'var(--color-highlight-neutral)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'var(--color-content-primary)',
                  fontSize: '0.8rem',
                  fontWeight: user?.role === 'SystemAdministrator' ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Shield size={14} color="var(--color-brand-purple)" />
                <span>Admin (System Admin)</span>
              </button>

              <div style={{ borderTop: '1px solid var(--color-border-tertiary)', marginTop: '6px', paddingTop: '6px' }}>
                <button
                  onClick={() => { logout(); setIsProfileMenuOpen(false); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'var(--color-brand-coral)',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <LogOut size={14} />
                  <span>Reset / Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

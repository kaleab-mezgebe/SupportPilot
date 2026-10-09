import React, { useEffect, useState } from 'react';
import { Search, Bell, RefreshCw, Plus, User as UserIcon, Shield, LogOut, ChevronDown } from 'lucide-react';
import { ApiService } from '../services/api';
import { useAuth } from '../features/auth/AuthContext';
import type { ApiHealthStatus, UserRole } from '../types';

interface HeaderProps {
  onNewTicketClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNewTicketClick }) => {
  const { user, switchDemoUser, logout } = useAuth();
  const [health, setHealth] = useState<ApiHealthStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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
      padding: '0 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--border-subtle)',
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      {/* Search Bar */}
      <div style={{ position: 'relative', width: '380px' }}>
        <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input 
          type="text" 
          placeholder="Search tickets, articles, customers (⌘ + K)..." 
          className="input-field" 
          style={{ paddingLeft: '38px', height: '40px', fontSize: '0.85rem' }} 
        />
      </div>

      {/* Status & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* API Health Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#34d399'
        }}>
          <span className="pulse-dot" />
          <span>ASP.NET Core API: {health?.status || 'Online'}</span>
          <button 
            onClick={checkStatus} 
            disabled={checking}
            title="Refresh API Health"
            style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', display: 'flex' }}
          >
            <RefreshCw size={12} />
          </button>
        </div>

        {/* Create Ticket Button */}
        {onNewTicketClick && (
          <button onClick={onNewTicketClick} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.825rem' }}>
            <Plus size={16} />
            <span>New Ticket</span>
          </button>
        )}

        {/* Notifications */}
        <button style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          background: 'rgba(255, 255, 255, 0.03)',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}>
          <Bell size={18} />
        </button>

        {/* User Identity / Persona Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-main)',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: user?.role === 'Customer' ? '#06b6d4' : 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.75rem',
              color: '#fff'
            }}>
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>
                {user?.fullName || 'Guest User'}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {user?.role || 'Viewer'}
              </div>
            </div>
            <ChevronDown size={14} color="var(--text-dim)" />
          </button>

          {isProfileMenuOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '46px',
              width: '240px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-focus)',
              borderRadius: '12px',
              padding: '8px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
              zIndex: 50
            }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                  background: user?.role === 'SupportAgent' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: user?.role === 'SupportAgent' ? 'var(--accent-primary)' : 'var(--text-main)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Shield size={14} />
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
                  background: user?.role === 'Customer' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: user?.role === 'Customer' ? '#22d3ee' : 'var(--text-main)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <UserIcon size={14} />
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
                  background: user?.role === 'SystemAdministrator' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: user?.role === 'SystemAdministrator' ? '#c084fc' : 'var(--text-main)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Shield size={14} />
                <span>Admin (System Admin)</span>
              </button>

              <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '6px', paddingTop: '6px' }}>
                <button
                  onClick={() => { logout(); setIsProfileMenuOpen(false); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'var(--accent-danger)',
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

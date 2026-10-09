import React, { useEffect, useState } from 'react';
import { Search, Bell, RefreshCw, Plus } from 'lucide-react';
import { ApiService } from '../services/api';
import type { ApiHealthStatus } from '../types';

interface HeaderProps {
  onNewTicketClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNewTicketClick }) => {
  const [health, setHealth] = useState<ApiHealthStatus | null>(null);
  const [checking, setChecking] = useState(false);

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
      </div>
    </header>
  );
};

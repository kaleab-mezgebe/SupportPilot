import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Ticket } from '../../types';

interface TicketSlaTimerProps {
  ticket: Ticket;
}

export const TicketSlaTimer: React.FC<TicketSlaTimerProps> = ({ ticket }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [status, setStatus] = useState<'ok' | 'warning' | 'breached' | 'met'>('ok');

  useEffect(() => {
    const updateCountdown = () => {
      if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
        setStatus('met');
        setTimeRemaining('SLA Met');
        return;
      }

      if (ticket.isSlaBreached) {
        setStatus('breached');
        setTimeRemaining('Breached');
        return;
      }

      const targetDateStr = ticket.firstResponseAtUtc 
        ? ticket.resolutionDueAtUtc 
        : ticket.firstResponseDueAtUtc;

      if (!targetDateStr) {
        setStatus('ok');
        setTimeRemaining('Active');
        return;
      }

      const diffMs = new Date(targetDateStr).getTime() - Date.now();
      if (diffMs <= 0) {
        setStatus('breached');
        const minsOver = Math.abs(Math.round(diffMs / 60000));
        setTimeRemaining(`-${minsOver > 60 ? `${Math.floor(minsOver / 60)}h ${minsOver % 60}m` : `${minsOver}m`}`);
        return;
      }

      const diffMins = Math.round(diffMs / 60000);
      if (diffMins <= 120) {
        setStatus('warning');
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        setTimeRemaining(hours > 0 ? `${hours}h ${mins}m` : `${mins}m`);
      } else {
        setStatus('ok');
        const hours = Math.round(diffMins / 60);
        setTimeRemaining(`${hours}h left`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 15000);
    return () => clearInterval(interval);
  }, [ticket]);

  const getBadgeStyle = () => {
    switch (status) {
      case 'met':
        return { bg: 'var(--color-highlight-green)', color: '#15803d', border: 'rgba(82, 154, 106, 0.3)', icon: CheckCircle2 };
      case 'breached':
        return { bg: 'var(--color-highlight-coral)', color: 'var(--color-brand-coral)', border: 'rgba(235, 91, 85, 0.3)', icon: AlertTriangle };
      case 'warning':
        return { bg: 'var(--color-highlight-orange)', color: 'var(--color-brand-orange)', border: 'rgba(240, 146, 54, 0.3)', icon: Clock };
      default:
        return { bg: 'var(--color-highlight-blue)', color: 'var(--color-brand-blue)', border: 'rgba(33, 115, 190, 0.3)', icon: Clock };
    }
  };

  const style = getBadgeStyle();
  const Icon = style.icon;

  return (
    <span
      className="font-mono"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '0.7rem',
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`
      }}
    >
      <Icon size={11} />
      <span>{timeRemaining}</span>
    </span>
  );
};

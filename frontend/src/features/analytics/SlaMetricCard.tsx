import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface SlaMetricCardProps {
  label: string;
  value: string | number;
  subtext: string;
  icon: LucideIcon;
  iconColor?: string;
  badgeText?: string;
  badgeColor?: string;
}

export const SlaMetricCard: React.FC<SlaMetricCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  iconColor = 'var(--color-brand-blue)',
  badgeText,
  badgeColor
}) => {
  return (
    <div className="editorial-card" style={{ padding: '24px 26px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-content-secondary)', marginBottom: '14px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{label}</span>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-surface-dim)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: iconColor
        }}>
          <Icon size={16} />
        </div>
      </div>

      <div style={{
        fontFamily: 'var(--font-serif)',
        fontSize: '2.5rem',
        fontWeight: 300,
        color: 'var(--color-content-primary)',
        lineHeight: 1
      }}>
        {value}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-content-secondary)' }}>
          {subtext}
        </span>
        {badgeText && (
          <span 
            className="badge font-mono" 
            style={{ 
              fontSize: '0.68rem', 
              color: badgeColor || 'inherit' 
            }}
          >
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};

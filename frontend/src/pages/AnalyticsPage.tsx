import React from 'react';
import { TrendingUp, Clock, ThumbsUp, Award } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>Support Analytics & SLA Targets</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Evaluate resolution times, customer satisfaction ratings, and agent workload distribution.
        </p>
      </div>

      {/* Highlights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>First Response Time</span>
            <Clock size={18} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>14m 20s</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-success)', marginTop: '8px' }}>
            ↓ 35% faster vs previous cycle
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>SLA Compliance Rate</span>
            <Award size={18} color="var(--accent-secondary)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>99.2%</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-secondary)', marginTop: '8px' }}>
            Target: &gt; 95.0%
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>CSAT Satisfaction</span>
            <ThumbsUp size={18} color="var(--accent-success)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>4.9 / 5.0</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-success)', marginTop: '8px' }}>
            Based on 86 customer ratings
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>AI Deflection Rate</span>
            <TrendingUp size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>42.4%</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-purple)', marginTop: '8px' }}>
            60 questions solved autonomously
          </div>
        </div>
      </div>

      {/* Category Breakdown & Audit Log Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
            Ticket Category Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'DNS & Infrastructure', count: 48, pct: '38%', color: '#6366f1' },
              { label: 'Billing & Subscriptions', count: 32, pct: '25%', color: '#06b6d4' },
              { label: 'AI & Knowledge Retrieval', count: 26, pct: '21%', color: '#8b5cf6' },
              { label: 'Account & RBAC', count: 20, pct: '16%', color: '#10b981' }
            ].map(cat => (
              <div key={cat.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{cat.label}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{cat.count} ({cat.pct})</span>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: cat.pct, background: cat.color, borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
            Security & Audit Activity Trail
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { action: 'Ticket SP-1042 status updated to InProgress', user: 'Alex Rivera', time: '12m ago' },
              { action: 'User David Chen requested AI Knowledge vector sync', user: 'System (AI Service)', time: '1h ago' },
              { action: 'Role updated to SupportAgent for Emma Watson', user: 'Admin', time: '3h ago' },
              { action: 'New KB article published: Custom Domain Setup', user: 'Alex Rivera', time: '1d ago' }
            ].map((log, idx) => (
              <div key={idx} style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>{log.action}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '4px' }}>
                  <span>Actor: {log.user}</span>
                  <span>{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

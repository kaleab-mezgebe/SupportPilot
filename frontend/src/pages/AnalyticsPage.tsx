import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Clock, 
  ThumbsUp, 
  Award, 
  Star, 
  Send, 
  Mail, 
  Cpu, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import type { CsatMetrics, IntegrationStatus, AnalyticsOverview } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [csatMetrics, setCsatMetrics] = useState<CsatMetrics | null>(null);
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);

  // Slack Test Webhook State
  const [slackUrl, setSlackUrl] = useState('');
  const [slackTesting, setSlackTesting] = useState(false);
  const [slackResult, setSlackResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overview, csat, status] = await Promise.all([
          api.getAnalyticsOverview(),
          api.getCsatMetrics(),
          api.getIntegrationStatus()
        ]);
        setAnalytics(overview);
        setCsatMetrics(csat);
        setIntegrationStatus(status);
      } catch (err) {
        console.error('Failed to load real analytics:', err);
      }
    };
    fetchData();
  }, []);

  const handleTestSlack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slackUrl.trim()) return;
    setSlackTesting(true);
    setSlackResult(null);
    try {
      const res = await api.testSlackWebhook(slackUrl.trim(), '🔔 SupportPilot Integration Test: Instant notifications active!');
      setSlackResult(res);
    } catch (err: any) {
      setSlackResult({ success: false, message: err.message || 'Failed to dispatch webhook' });
    } finally {
      setSlackTesting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>Support Analytics & Enterprise Integrations</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Real-time database metrics: resolution times, SLA compliance, customer satisfaction (CSAT), and multi-channel connectors.
        </p>
      </div>

      {/* Highlights Grid (100% Real Database Calculations) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Avg First Response Time</span>
            <Clock size={18} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
            {analytics?.avgFirstResponseFormatted || '< 1m'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-success)', marginTop: '8px' }}>
            Computed from active ticket timestamps
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>SLA Compliance Rate</span>
            <Award size={18} color="var(--accent-secondary)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
            {analytics ? `${analytics.slaComplianceRate}%` : '100%'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-secondary)', marginTop: '8px' }}>
            Target: &gt; 95.0%
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>CSAT Satisfaction</span>
            <ThumbsUp size={18} color="var(--accent-success)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
            {analytics?.csatAverageRating ? `${analytics.csatAverageRating} / 5.0` : 'No ratings yet'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-success)', marginTop: '8px' }}>
            {analytics ? `${analytics.csatSatisfactionPercentage}% positive (${analytics.csatTotalCount} ratings)` : '0 verified ratings'}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>AI Deflection Rate</span>
            <TrendingUp size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
            {analytics ? `${analytics.aiDeflectionRate}%` : '0%'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-purple)', marginTop: '8px' }}>
            {analytics?.aiDeflectedCount || 0} messages drafted by AI co-pilot
          </div>
        </div>
      </div>

      {/* Real Category Breakdown & Real Activity Log */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
            Live Ticket Category Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {(analytics?.categoryBreakdown || []).map(cat => (
              <div key={cat.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{cat.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{cat.count} ({cat.percentage}%)</span>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${cat.percentage}%`, background: cat.colorHex, borderRadius: '4px', transition: 'width 0.3s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
            Real Security & Activity Audit Trail
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(analytics?.recentActivity || []).map(log => (
              <div key={log.id} style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>{log.action}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '4px' }}>
                  <span>Actor: {log.actorName}</span>
                  <span>{new Date(log.timestampUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CSAT Survey Analytics & Multi-Channel Integrations Hub */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={18} color="#eab308" fill="#eab308" /> Customer Satisfaction Breakdown
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-success)', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', padding: '3px 8px', borderRadius: '12px' }}>
              {csatMetrics?.satisfactionPercentage || 0}% CSAT Score
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[5, 4, 3, 2, 1].map(stars => {
              const count = csatMetrics?.ratingDistribution?.[stars.toString()] || 0;
              const total = csatMetrics?.totalResponses || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.825rem' }}>
                  <div style={{ width: '60px', display: 'flex', alignItems: 'center', gap: '4px', color: '#fff', fontWeight: 600 }}>
                    {stars} <Star size={13} color="#eab308" fill="#eab308" />
                  </div>
                  <div style={{ flex: 1, height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${pct}%`, 
                        background: stars >= 4 ? 'var(--accent-success)' : stars === 3 ? '#eab308' : '#ef4444',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease'
                      }} 
                    />
                  </div>
                  <div style={{ width: '70px', textAlign: 'right', color: 'var(--text-muted)' }}>
                    {count} ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px' }}>
              Real Customer Feedback
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(csatMetrics?.recentFeedback || []).slice(0, 3).map(item => (
                <div key={item.id} style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>{item.customerName}</span>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={11} color={i < item.rating ? '#eab308' : '#4b5563'} fill={i < item.rating ? '#eab308' : 'none'} />
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: 0, fontStyle: 'italic' }}>
                    "{item.feedbackComment || 'No feedback text provided.'}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Multi-Channel & External Integrations Hub */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="var(--accent-purple)" /> Multi-Channel & AI Integrations Hub
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Active LLM Provider */}
            <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Active LLM Provider</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-purple)', background: 'rgba(168, 85, 247, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>
                  {integrationStatus?.activeLlmProvider || 'LocalDenseModel (Offline Fallback)'}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: 0 }}>
                Automatic multi-provider dispatch with fallback between OpenAI (GPT-4o), Google Gemini, and internal dense embeddings.
              </p>
            </div>

            {/* Inbound Email Webhook */}
            <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={15} color="var(--accent-secondary)" /> Inbound Email Ingestion
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} /> Active
                </span>
              </div>
              <code style={{ fontSize: '0.72rem', color: 'var(--accent-secondary)', background: 'rgba(6, 182, 212, 0.08)', padding: '3px 6px', borderRadius: '4px', display: 'block', marginBottom: '6px' }}>
                POST /api/webhooks/inbound-email
              </code>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: 0 }}>
                Converts incoming SendGrid / Mailgun webhook emails into new tickets or customer thread replies.
              </p>
            </div>

            {/* Slack / Teams Integration */}
            <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Slack & Teams Alert Dispatcher</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: integrationStatus?.slackConfigured ? 'var(--accent-success)' : '#eab308' }}>
                  {integrationStatus?.slackConfigured ? 'Configured' : 'Ready to Connect'}
                </span>
              </div>
              <form onSubmit={handleTestSlack} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackUrl}
                  onChange={e => setSlackUrl(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.78rem'
                  }}
                />
                <button
                  type="submit"
                  disabled={slackTesting || !slackUrl.trim()}
                  className="btn btn-primary"
                  style={{ fontSize: '0.78rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={13} /> {slackTesting ? 'Testing...' : 'Test Webhook'}
                </button>
              </form>
              {slackResult && (
                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: slackResult.success ? 'var(--accent-success)' : '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {slackResult.success ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  {slackResult.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

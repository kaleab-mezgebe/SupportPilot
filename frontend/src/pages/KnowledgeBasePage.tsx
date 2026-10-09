import React, { useState } from 'react';
import { Sparkles, Plus, ExternalLink, ShieldCheck } from 'lucide-react';

export const KnowledgeBasePage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleAskAi = () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      setAiAnswer(`Based on SupportPilot approved documentation:
To configure custom domains, create a CNAME record with your DNS provider pointing to 'proxy.supportpilot.io'. Ensure TTL is set under 300s during propagation. Automated SSL certificates (Let's Encrypt) are provisioned within 15 minutes of validation.`);
      setIsSearching(false);
    }, 600);
  };

  const articles = [
    {
      id: '1',
      title: 'Configuring Custom Domains & SSL Termination',
      category: 'DNS & Infrastructure',
      views: 1420,
      updated: '2 days ago',
      tags: ['DNS', 'SSL', 'Custom Domain']
    },
    {
      id: '2',
      title: 'How Grounded AI Retrieval Works in SupportPilot',
      category: 'AI & Automations',
      views: 980,
      updated: '5 days ago',
      tags: ['Grounded AI', 'Embeddings', 'Confidence Score']
    },
    {
      id: '3',
      title: 'Role-Based Access Control: Customer vs Agent vs Manager',
      category: 'Identity & Security',
      views: 730,
      updated: '1 week ago',
      tags: ['RBAC', 'Multi-tenant', 'Security']
    },
    {
      id: '4',
      title: 'Webhook Subscriptions for Ticket Events & SLA Alerts',
      category: 'Integrations & API',
      views: 510,
      updated: '2 weeks ago',
      tags: ['Webhooks', 'REST API', 'SLA']
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>Knowledge Base & AI Retrieval</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Verified company documentation used to ground AI responses and power agent suggestions.
          </p>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          <span>New Article</span>
        </button>
      </div>

      {/* AI Semantic Search / Ask Copilot Card */}
      <div className="glass-panel glow-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.08) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Sparkles size={18} color="var(--accent-primary)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Test Grounded AI Query</span>
          <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>Confidence Aware</span>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="e.g. How do I configure custom domains and SSL certs?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
            className="input-field"
            style={{ fontSize: '0.9rem' }}
          />
          <button onClick={handleAskAi} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
            {isSearching ? 'Retrieving...' : 'Ask AI'}
          </button>
        </div>

        {aiAnswer && (
          <div style={{ marginTop: '16px', padding: '16px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700, color: '#818cf8', marginBottom: '8px' }}>
              <ShieldCheck size={16} />
              <span>Grounded Response (Source: Configuring Custom Domains & SSL Termination)</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
              {aiAnswer}
            </p>
          </div>
        )}
      </div>

      {/* Articles Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {articles.map((art) => (
          <div 
            key={art.id}
            className="glass-panel"
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                  {art.category}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {art.views} reads
                </span>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '12px', lineHeight: 1.4 }}>
                {art.title}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                {art.tags.map(tag => (
                  <span key={tag} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              <span>Updated {art.updated}</span>
              <ExternalLink size={14} color="var(--text-muted)" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

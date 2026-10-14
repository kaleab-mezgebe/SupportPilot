import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  BookOpen, 
  ExternalLink,
  X
} from 'lucide-react';
import { ApiService } from '../services/api';
import type { KnowledgeArticle, RagAnswerResponse } from '../types';

export const KnowledgeBasePage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.55);
  const [ragResult, setRagResult] = useState<RagAnswerResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Articles directory states
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [articleSearch, setArticleSearch] = useState('');
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);

  // New Article Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Configuration & DNS');
  const [newContent, setNewContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const categories = [
    'All',
    'Configuration & DNS',
    'AI & Knowledge Retrieval',
    'Security & RBAC',
    'Billing & Subscriptions',
    'Developer & API'
  ];

  const loadArticles = async () => {
    setIsLoadingArticles(true);
    try {
      const list = await ApiService.getKnowledgeArticles(articleSearch, selectedCategory);
      setArticles(list);
    } finally {
      setIsLoadingArticles(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [selectedCategory, articleSearch]);

  const handleAskAi = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await ApiService.askRagQuestion(query.trim(), confidenceThreshold);
      setRagResult(res);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsCreating(true);
    try {
      await ApiService.createKnowledgeArticle({
        title: newTitle.trim(),
        category: newCategory,
        content: newContent.trim()
      });
      setIsModalOpen(false);
      setNewTitle('');
      setNewContent('');
      await loadArticles();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Editorial Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-serif)', color: 'var(--color-content-primary)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <BookOpen size={22} color="var(--color-content-primary)" />
            Knowledge Base &amp; Grounded <em>AI</em>
          </h2>
          <p style={{ color: 'var(--color-content-secondary)', fontSize: '0.9rem' }}>
            Vector embeddings stored with cosine similarity search to deliver verified, citation-backed answers.
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ borderRadius: '9999px', padding: '9px 18px' }}>
          <Plus size={16} />
          <span>New Article</span>
        </button>
      </div>

      {/* AI Semantic RAG Query Engine Card */}
      <div className="editorial-card" style={{ padding: '28px 32px', backgroundColor: 'var(--color-surface-intro)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--color-brand-purple)" />
            <span style={{ fontSize: '1.05rem', fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--color-content-primary)' }}>
              Semantic Search &amp; Grounded RAG
            </span>
            <span className="badge" style={{ backgroundColor: 'var(--color-highlight-purple)', borderColor: 'rgba(196, 85, 235, 0.3)', color: 'var(--color-brand-purple)', fontSize: '0.68rem' }}>
              Cosine Similarity
            </span>
          </div>

          {/* Confidence Threshold Pill Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--color-content-secondary)' }}>
            <span>Relevance Threshold:</span>
            <select
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
              style={{
                backgroundColor: 'var(--color-surface-neutral)',
                border: '1px solid var(--color-border-tertiary)',
                borderRadius: '6px',
                color: 'var(--color-content-primary)',
                padding: '3px 8px',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              <option value="0.40">Low (40%)</option>
              <option value="0.55">Standard (55%)</option>
              <option value="0.70">Strict (70%)</option>
              <option value="0.85">High Precision (85%)</option>
            </select>
          </div>
        </div>

        {/* Query Input Bar */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Ask anything, e.g. How do I configure custom domains and SSL certs? Or test an unrelated question..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
            className="input-field"
            style={{ fontSize: '0.9rem', flex: 1, borderRadius: '9999px', padding: '11px 18px', backgroundColor: 'var(--color-surface-neutral)' }}
          />
          <button 
            disabled={isSearching || !query.trim()} 
            onClick={handleAskAi} 
            className="btn-primary" 
            style={{ whiteSpace: 'nowrap', padding: '0 24px', borderRadius: '9999px' }}
          >
            {isSearching ? 'Retrieving Embeddings...' : 'Ask Grounded AI'}
          </button>
        </div>

        {/* RAG Answer Display */}
        {ragResult && (
          <div style={{ 
            marginTop: '20px', 
            padding: '22px 24px', 
            borderRadius: 'var(--radius-s)', 
            backgroundColor: 'var(--color-surface-neutral)',
            border: ragResult.isGrounded ? '1px solid var(--color-border-primary)' : '1px solid var(--color-brand-coral)',
            boxShadow: 'var(--shadow-md)'
          }}>
            {/* Answer Header Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {ragResult.isGrounded ? (
                  <>
                    <ShieldCheck size={18} color="#15803d" />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#15803d' }}>
                      Grounded Answer (Supported by Verified Knowledge Base)
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={18} color="#b91c1c" />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#b91c1c' }}>
                      Unsupported Query — Fallback Escalated to Human Agent
                    </span>
                  </>
                )}
              </div>

              {/* Confidence Score Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-content-secondary)' }}>Confidence:</span>
                <span className={`badge ${ragResult.isGrounded ? 'badge-sla-ok' : 'badge-sla-breached'}`} style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {Math.round(ragResult.confidenceScore * 100)}%
                </span>
              </div>
            </div>

            {/* Answer Body */}
            <div style={{ fontSize: '0.92rem', color: 'var(--color-content-primary)', lineHeight: 1.65, whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
              {ragResult.answer}
            </div>

            {/* Source Citations Strip */}
            {ragResult.citations && ragResult.citations.length > 0 && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border-tertiary)' }}>
                <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-content-tertiary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Document Citations &amp; Relevance Scores:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                  {ragResult.citations.map((c) => (
                    <div 
                      key={c.articleId}
                      style={{
                        padding: '12px 14px',
                        backgroundColor: 'var(--color-surface-light)',
                        border: '1px solid var(--color-border-tertiary)',
                        borderRadius: 'var(--radius-s)',
                        fontSize: '0.78rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--color-content-primary)', marginBottom: '4px' }}>
                        <span>{c.title}</span>
                        <span className="font-mono" style={{ color: 'var(--color-brand-blue)' }}>{Math.round(c.relevanceScore * 100)}%</span>
                      </div>
                      <div style={{ color: 'var(--color-content-secondary)', fontSize: '0.75rem', lineHeight: 1.4 }}>
                        {c.excerpt}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Knowledge Base Articles Directory */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: 'var(--color-content-primary)' }}>
            Verified Articles Directory ({articles.length})
          </h3>

          <div style={{ width: '280px', position: 'relative' }}>
            <Search size={14} color="var(--color-content-tertiary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Filter documentation..."
              value={articleSearch}
              onChange={(e) => setArticleSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '34px', height: '36px', fontSize: '0.8rem', borderRadius: '9999px' }}
            />
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '5px 14px',
                  borderRadius: '9999px',
                  border: '1px solid',
                  borderColor: active ? 'var(--color-border-primary)' : 'var(--color-border-tertiary)',
                  backgroundColor: active ? 'var(--color-surface-inverted)' : 'var(--color-surface-neutral)',
                  color: active ? '#ffffff' : 'var(--color-content-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Articles Grid */}
        {isLoadingArticles ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-content-tertiary)' }}>
            Loading articles...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
            {articles.map((art) => (
              <div 
                key={art.id} 
                className="editorial-card" 
                style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span className="badge badge-medium" style={{ fontSize: '0.68rem' }}>
                      {art.category}
                    </span>
                    <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--color-content-tertiary)' }}>
                      {art.viewCount} views
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-serif)', color: 'var(--color-content-primary)', marginBottom: '8px' }}>
                    {art.title}
                  </h4>

                  <p style={{ fontSize: '0.82rem', color: 'var(--color-content-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {art.content}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', paddingTop: '12px', borderTop: '1px solid var(--color-border-tertiary)', fontSize: '0.75rem' }}>
                  <span className="font-mono" style={{ color: '#15803d', fontWeight: 600 }}>Vector Indexed ✓</span>
                  <button 
                    onClick={() => {
                      setQuery(`How do I handle ${art.title}?`);
                      handleAskAi();
                    }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-brand-blue)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                  >
                    <span>Test Query</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Article Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(40, 40, 37, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="editorial-card" style={{ width: '560px', maxWidth: '95%', padding: '30px', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', color: 'var(--color-content-primary)' }}>Publish Knowledge Article</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-content-tertiary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateArticleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-content-secondary)', marginBottom: '6px', fontWeight: 600 }}>Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SSL Certificate Renewal & Automation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-content-secondary)', marginBottom: '6px', fontWeight: 600 }}>Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="input-field"
                >
                  <option value="Configuration & DNS">Configuration & DNS</option>
                  <option value="AI & Knowledge Retrieval">AI & Knowledge Retrieval</option>
                  <option value="Security & RBAC">Security & RBAC</option>
                  <option value="Billing & Subscriptions">Billing & Subscriptions</option>
                  <option value="Developer & API">Developer & API</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-content-secondary)', marginBottom: '6px', fontWeight: 600 }}>Markdown Documentation Content</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Enter detailed documentation. This content will be chunked and indexed into vector embeddings..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isCreating} className="btn-primary">
                  {isCreating ? 'Indexing Vectors...' : 'Publish & Vectorize'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

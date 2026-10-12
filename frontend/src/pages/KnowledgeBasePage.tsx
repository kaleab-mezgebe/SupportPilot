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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={24} color="var(--accent-primary)" />
            Knowledge Base & Grounded AI
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Vector embeddings stored with cosine similarity search to deliver verified, citation-backed answers.
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus size={16} />
          <span>New Article</span>
        </button>
      </div>

      {/* AI Semantic RAG Query Engine Card */}
      <div className="glass-panel glow-card" style={{ padding: '28px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>Grounded AI Semantic Search (RAG)</span>
            <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', fontSize: '0.68rem' }}>
              Cosine Similarity Vector Search
            </span>
          </div>

          {/* Confidence Threshold Pill Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>Relevance Threshold:</span>
            <select
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                color: '#fff',
                padding: '2px 8px',
                fontSize: '0.72rem',
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
            style={{ fontSize: '0.9rem', flex: 1 }}
          />
          <button 
            disabled={isSearching || !query.trim()} 
            onClick={handleAskAi} 
            className="btn-primary" 
            style={{ whiteSpace: 'nowrap', padding: '0 24px' }}
          >
            {isSearching ? 'Retrieving Embeddings...' : 'Ask Grounded AI'}
          </button>
        </div>

        {/* RAG Answer Display */}
        {ragResult && (
          <div style={{ 
            marginTop: '20px', 
            padding: '20px', 
            borderRadius: '14px', 
            background: ragResult.isGrounded ? 'rgba(15, 23, 42, 0.85)' : 'rgba(239, 68, 68, 0.08)', 
            border: ragResult.isGrounded ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(239, 68, 68, 0.3)' 
          }}>
            {/* Answer Header Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {ragResult.isGrounded ? (
                  <>
                    <ShieldCheck size={18} color="var(--accent-success)" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>
                      Grounded Answer (Supported by Verified Knowledge Base)
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={18} color="var(--accent-danger)" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f87171' }}>
                      Unsupported Query — Fallback Escalated
                    </span>
                  </>
                )}
              </div>

              {/* Confidence Score Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence Score:</span>
                <span className={`badge ${ragResult.isGrounded ? 'badge-sla-ok' : 'badge-sla-breached'}`} style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                  {Math.round(ragResult.confidenceScore * 100)}%
                </span>
              </div>
            </div>

            {/* Answer Body */}
            <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
              {ragResult.answer}
            </div>

            {/* Source Citations Strip */}
            {ragResult.citations && ragResult.citations.length > 0 && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Document Citations & Relevance Scores:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                  {ragResult.citations.map((c) => (
                    <div 
                      key={c.articleId}
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        fontSize: '0.78rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: '4px' }}>
                        <span>{c.title}</span>
                        <span style={{ color: 'var(--accent-primary)' }}>{Math.round(c.relevanceScore * 100)}%</span>
                      </div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>
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
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
            Verified Articles Directory ({articles.length})
          </h3>

          <div style={{ width: '280px', position: 'relative' }}>
            <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search documentation..."
              value={articleSearch}
              onChange={(e) => setArticleSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '32px', height: '34px', fontSize: '0.78rem' }}
            />
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '5px 12px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: selectedCategory === cat ? 'var(--accent-primary)' : 'var(--border-subtle)',
                background: selectedCategory === cat ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: selectedCategory === cat ? '#a5b4fc' : 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        {isLoadingArticles ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading articles...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {articles.map((art) => (
              <div 
                key={art.id} 
                className="glass-panel" 
                style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="badge badge-medium" style={{ fontSize: '0.65rem' }}>
                      {art.category}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      {art.viewCount} views
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                    {art.title}
                  </h4>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {art.content}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Vector Indexed ✓</span>
                  <button 
                    onClick={() => {
                      setQuery(`How do I handle ${art.title}?`);
                      handleAskAi();
                    }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
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
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '560px', maxWidth: '95%', padding: '28px', border: '1px solid var(--border-focus)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Publish Knowledge Article</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateArticleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Title</label>
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
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '8px 12px',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="Configuration & DNS">Configuration & DNS</option>
                  <option value="AI & Knowledge Retrieval">AI & Knowledge Retrieval</option>
                  <option value="Security & RBAC">Security & RBAC</option>
                  <option value="Billing & Subscriptions">Billing & Subscriptions</option>
                  <option value="Developer & API">Developer & API</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Markdown Documentation Content</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Enter detailed documentation. This content will be chunked and indexed into vector embeddings..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', resize: 'none' }}
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

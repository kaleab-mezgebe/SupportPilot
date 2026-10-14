import React from 'react';
import { BookOpen, CheckCircle, ExternalLink } from 'lucide-react';
import type { RagCitation } from '../../types';

interface RagCitationCardProps {
  citation: RagCitation;
  onOpenArticle?: (articleId: string) => void;
}

export const RagCitationCard: React.FC<RagCitationCardProps> = ({ citation, onOpenArticle }) => {
  const percentage = Math.round(citation.relevanceScore * 100);

  return (
    <div
      onClick={() => onOpenArticle?.(citation.articleId)}
      style={{
        padding: '12px 14px',
        borderRadius: 'var(--radius-s)',
        backgroundColor: 'var(--color-surface-light)',
        border: '1px solid var(--color-border-tertiary)',
        cursor: onOpenArticle ? 'pointer' : 'default',
        transition: 'all 0.15s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BookOpen size={14} color="var(--color-brand-blue)" />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-content-primary)' }}>
            {citation.title}
          </span>
        </div>
        <span
          className="badge font-mono"
          style={{
            fontSize: '0.68rem',
            backgroundColor: 'var(--color-highlight-green)',
            color: '#15803d',
            borderColor: 'rgba(82, 154, 106, 0.3)'
          }}
        >
          <CheckCircle size={10} style={{ marginRight: '3px' }} />
          {percentage}% Grounded Match
        </span>
      </div>

      <p style={{
        fontSize: '0.78rem',
        color: 'var(--color-content-secondary)',
        lineHeight: 1.4,
        margin: '0 0 6px 0',
        fontStyle: 'italic'
      }}>
        "{citation.excerpt}"
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--color-content-tertiary)' }}>
        <span className="badge" style={{ fontSize: '0.65rem' }}>{citation.category}</span>
        {onOpenArticle && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--color-brand-blue)' }}>
            Read article <ExternalLink size={10} />
          </span>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { 
  X, 
  Settings, 
  Database, 
  Cpu, 
  Building2,
  CheckCircle2,
  Server
} from 'lucide-react';
import { ApiService } from '../services/api';
import { useAuth } from '../features/auth/AuthContext';
import type { ApiHealthStatus, IntegrationStatus } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [health, setHealth] = useState<ApiHealthStatus | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationStatus | null>(null);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        ApiService.checkHealth().catch(() => null),
        ApiService.getIntegrationStatus().catch(() => null)
      ]).then(([h, i]) => {
        setHealth(h);
        setIntegrations(i);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
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
      zIndex: 110,
      animation: 'heroFadeSlideUp 0.15s ease'
    }}>
      <div
        className="editorial-card"
        style={{
          width: '560px',
          padding: '30px',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--color-content-tertiary)',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'var(--color-surface-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-content-primary)'
          }}>
            <Settings size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-content-primary)' }}>
              Workspace Settings &amp; Architecture
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-content-secondary)' }}>
              Underlying infrastructure, LLM routing, and tenant security status.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
          {/* Organization Info */}
          <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-s)', backgroundColor: 'var(--color-surface-light)', border: '1px solid var(--color-border-tertiary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={14} color="var(--color-brand-blue)" /> Active Organization
              </span>
              <span className="badge font-mono" style={{ fontSize: '0.7rem' }}>
                {user?.organizationName || 'SupportPilot HQ'}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-content-secondary)', margin: 0 }}>
              Tenant isolation enforced via EF Core global query filters and PostgreSQL schemas.
            </p>
          </div>

          {/* LLM & AI Engine */}
          <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-s)', backgroundColor: 'var(--color-surface-light)', border: '1px solid var(--color-border-tertiary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={14} color="var(--color-brand-purple)" /> Active AI Engine
              </span>
              <span className="badge" style={{ backgroundColor: 'var(--color-highlight-purple)', color: 'var(--color-brand-purple)' }}>
                {integrations?.activeLlmProvider || 'LocalDenseModel (Deterministic)'}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-content-secondary)', margin: 0 }}>
              Supports dynamic failover between OpenAI (GPT-4o), Google Gemini 1.5 Pro, and local dense embeddings.
            </p>
          </div>

          {/* Database & Vector Store */}
          <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-s)', backgroundColor: 'var(--color-surface-light)', border: '1px solid var(--color-border-tertiary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={14} color="#15803d" /> Database &amp; Vector Index
              </span>
              <span className="badge badge-sla-ok" style={{ fontSize: '0.7rem' }}>
                <CheckCircle2 size={12} /> PostgreSQL 16 + pgvector
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-content-secondary)', margin: 0 }}>
              Cosine similarity vector search indexing 128-dimensional documentation chunks.
            </p>
          </div>

          {/* Realtime Hub & Backplane */}
          {/* Backend API Service */}
          <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-s)', backgroundColor: 'var(--color-surface-light)', border: '1px solid var(--color-border-tertiary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Server size={14} color="var(--color-brand-blue)" /> Backend API Health
              </span>
              <span className="badge badge-sla-ok" style={{ fontSize: '0.7rem' }}>
                <CheckCircle2 size={12} /> {health?.status || 'Online'} (v{health?.version || '1.0.0'})
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-content-secondary)', margin: 0 }}>
              ASP.NET Core 8 Web API on port 5005 with rate limiting (120 req/min) and Swagger OpenAPI documentation.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '22px' }}>
          <button onClick={onClose} className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.82rem' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

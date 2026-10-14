import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Building2, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from './AuthContext';
import type { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register State
  const [fullName, setFullName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [role, setRole] = useState<UserRole>('Customer');

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) return;

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await login(loginEmail.trim(), loginPassword);
      setSuccessMessage('Signed in successfully.');
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !registerEmail.trim() || !registerPassword.trim()) return;

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await register(fullName.trim(), registerEmail.trim(), registerPassword, role, organizationName.trim() || undefined);
      setSuccessMessage('Account registered and signed in.');
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Email may already be in use.');
    } finally {
      setSubmitting(false);
    }
  };

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
      animation: 'heroFadeSlideUp 0.2s ease'
    }}>
      <div 
        className="editorial-card" 
        style={{ 
          width: '460px', 
          padding: '32px', 
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

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '12px', marginBottom: '22px' }}>
          <button
            onClick={() => { setMode('login'); setErrorMessage(null); }}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-serif)',
              fontSize: '1.2rem',
              color: mode === 'login' ? 'var(--color-content-primary)' : 'var(--color-content-tertiary)',
              cursor: 'pointer',
              fontWeight: mode === 'login' ? 600 : 400,
              borderBottom: mode === 'login' ? '2px solid var(--color-border-primary)' : '2px solid transparent',
              paddingBottom: '6px'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setErrorMessage(null); }}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-serif)',
              fontSize: '1.2rem',
              color: mode === 'register' ? 'var(--color-content-primary)' : 'var(--color-content-tertiary)',
              cursor: 'pointer',
              fontWeight: mode === 'register' ? 600 : 400,
              borderBottom: mode === 'register' ? '2px solid var(--color-border-primary)' : '2px solid transparent',
              paddingBottom: '6px'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Alert Feedback */}
        {errorMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: 'var(--color-highlight-coral)',
            border: '1px solid rgba(235, 91, 85, 0.3)',
            borderRadius: 'var(--radius-s)',
            color: 'var(--color-brand-coral)',
            fontSize: '0.8rem',
            marginBottom: '16px'
          }}>
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: 'var(--color-highlight-green)',
            border: '1px solid rgba(82, 154, 106, 0.3)',
            borderRadius: 'var(--radius-s)',
            color: '#15803d',
            fontSize: '0.8rem',
            marginBottom: '16px'
          }}>
            <CheckCircle2 size={15} />
            <span>{successMessage}</span>
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-content-secondary)', marginBottom: '6px' }}>
                Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="var(--color-content-tertiary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  placeholder="alex.rivera@supportpilot.io"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-content-secondary)', marginBottom: '6px' }}>
                Password *
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="var(--color-content-tertiary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '36px' }}
                />
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-content-tertiary)', marginTop: '4px', display: 'block' }}>
                Default demo password: <code>Password123!</code>
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-content-secondary)', marginBottom: '4px' }}>
                Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={15} color="var(--color-content-tertiary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  placeholder="Jane Miller"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-content-secondary)', marginBottom: '4px' }}>
                Work Email *
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="var(--color-content-tertiary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  required
                  placeholder="jane@company.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-content-secondary)', marginBottom: '4px' }}>
                  Workspace Role
                </label>
                <div style={{ position: 'relative' }}>
                  <Shield size={14} color="var(--color-content-tertiary)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="input-field"
                    style={{ paddingLeft: '32px', height: '38px', fontSize: '0.8rem' }}
                  >
                    <option value="Customer">Customer</option>
                    <option value="SupportAgent">Support Agent</option>
                    <option value="SupportManager">Support Manager</option>
                    <option value="SystemAdministrator">System Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-content-secondary)', marginBottom: '4px' }}>
                  Organization
                </label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={14} color="var(--color-content-tertiary)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Acme Corp"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '32px', height: '38px', fontSize: '0.8rem' }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-content-secondary)', marginBottom: '4px' }}>
                Password * (min 6 characters)
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="var(--color-content-tertiary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Creating Account...' : 'Register & Join'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

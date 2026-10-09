import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState([
    { id: '1', sender: 'Customer (David Chen)', text: 'Hello, our team is getting a 504 gateway timeout when vectorizing docs over 500kb.', time: '14:22', isCustomer: true, isAi: false },
    { id: '2', sender: 'SupportPilot AI Assistant', text: 'Hi David! For documents exceeding 500kb, we recommend enabling chunked streaming in your project settings. Would you like me to guide you through it?', time: '14:23', isCustomer: false, isAi: true },
    { id: '3', sender: 'Customer (David Chen)', text: 'Yes, that would be great. Does chunked streaming maintain semantic section boundaries?', time: '14:25', isCustomer: true, isAi: false }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [
      ...prev,
      { id: crypto.randomUUID(), sender: 'Alex Rivera (Agent)', text: input, time: 'Now', isCustomer: false, isAi: false }
    ]);
    setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>Live Customer-Agent Hub</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            SignalR-backed real-time messaging with live AI deflection & instant agent takeover.
          </p>
        </div>
        <div className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
          <span className="pulse-dot" /> SignalR Connected
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Active Session Info Bar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.01)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>
              DC
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#fff' }}>David Chen • NeuroFlow AI</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ticket: SP-1040 (AI Knowledge Base sync)</div>
            </div>
          </div>
          <span className="badge badge-urgent">Urgent Priority</span>
        </div>

        {/* Message Stream */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.map((m) => (
            <div 
              key={m.id}
              style={{
                alignSelf: m.isCustomer ? 'flex-start' : 'flex-end',
                maxWidth: '75%',
                padding: '14px 18px',
                borderRadius: '12px',
                background: m.isAi 
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)'
                  : m.isCustomer ? 'rgba(255, 255, 255, 0.05)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                border: m.isAi ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-subtle)',
                color: '#fff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '6px', fontSize: '0.725rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {m.isAi && <Sparkles size={12} />}
                  {m.sender}
                </span>
                <span>{m.time}</span>
              </div>
              <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(15, 23, 42, 0.6)', display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Type a response to the customer..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="input-field"
          />
          <button onClick={handleSend} className="btn-primary">
            <Send size={16} />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

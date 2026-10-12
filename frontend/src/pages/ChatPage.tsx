import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  WifiOff, 
  MessageCircle
} from 'lucide-react';
import { RealtimeService, type SignalRConnectionStatus, type TypingEvent, type PresenceEvent } from '../services/signalr';
import { ApiService } from '../services/api';
import type { Ticket, TicketMessage } from '../types';

export const ChatPage: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<SignalRConnectionStatus>('Connecting');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTypingUser, setRemoteTypingUser] = useState<string | null>(null);
  const [onlinePresence, setOnlinePresence] = useState<Record<string, boolean>>({
    'sarah@cyberdyne.io': true,
    'david@neuroflow.ai': true,
    'claire@umbrella-corp.com': true
  });

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize SignalR and load active conversation sessions
  useEffect(() => {
    RealtimeService.start();

    const unsubStatus = RealtimeService.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    const unsubMessage = RealtimeService.onMessage((newMsg) => {
      if (!activeTicket || newMsg.ticketId === activeTicket.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    });

    const unsubTyping = RealtimeService.onTyping((data: TypingEvent) => {
      if (activeTicket && data.ticketId === activeTicket.id) {
        if (data.isTyping) {
          setRemoteTypingUser(data.senderName);
        } else {
          setRemoteTypingUser(null);
        }
      }
    });

    const unsubPresence = RealtimeService.onPresence((data: PresenceEvent) => {
      setOnlinePresence(prev => ({
        ...prev,
        [data.userId]: data.status === 'online'
      }));
    });

    // Load available ticket chats
    ApiService.getTickets({ status: 'Open' }).then(list => {
      setTickets(list);
      if (list.length > 0) {
        setActiveTicket(list[0]);
      }
    });

    return () => {
      unsubStatus();
      unsubMessage();
      unsubTyping();
      unsubPresence();
    };
  }, []);

  // When active ticket changes, join its SignalR conversation group
  useEffect(() => {
    if (activeTicket) {
      RealtimeService.joinTicket(activeTicket.id);

      // Load thread messages
      ApiService.getTicketDetail(activeTicket.id).then(detail => {
        setMessages(detail.messages || []);
      });
    }

    return () => {
      if (activeTicket) {
        RealtimeService.leaveTicket(activeTicket.id);
      }
    };
  }, [activeTicket]);

  // Auto-scroll to bottom of message thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, remoteTypingUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    if (activeTicket) {
      if (!isTyping) {
        setIsTyping(true);
        RealtimeService.sendTyping(activeTicket.id, true);
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        RealtimeService.sendTyping(activeTicket.id, false);
      }, 1400);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeTicket) return;

    const content = input.trim();
    setInput('');
    setIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    RealtimeService.sendTyping(activeTicket.id, false);

    await RealtimeService.sendMessage(activeTicket.id, content, false);
  };

  const handleAiDeflectionTakeover = async () => {
    if (!activeTicket) return;
    try {
      const suggestion = await ApiService.getCopilotSuggestion(activeTicket.id);
      setInput(suggestion.suggestedResponse);
    } catch {
      setInput('Hi, I am taking over this conversation to assist you directly.');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', height: 'calc(100vh - 140px)' }}>
      {/* Left Column: Real-Time Channels & Active Sessions */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>Live Channels</h2>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>WebSocket Real-time Sessions</div>
          </div>

          {/* Connection Status Pill */}
          <div className="badge" style={{
            fontSize: '0.65rem',
            background: connectionStatus === 'Connected' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: connectionStatus === 'Connected' ? '#34d399' : '#f87171'
          }}>
            {connectionStatus === 'Connected' ? (
              <>
                <span className="pulse-dot" /> Live
              </>
            ) : (
              <>
                <WifiOff size={10} /> {connectionStatus}
              </>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {tickets.map((t) => {
            const isSelected = activeTicket?.id === t.id;
            const isOnline = onlinePresence[t.customerEmail] ?? true;

            return (
              <div
                key={t.id}
                onClick={() => setActiveTicket(t)}
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  borderLeft: isSelected ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span 
                      style={{ 
                        width: '7px', 
                        height: '7px', 
                        borderRadius: '50%', 
                        background: isOnline ? 'var(--accent-success)' : 'var(--text-dim)',
                        boxShadow: isOnline ? '0 0 6px var(--accent-success)' : 'none'
                      }} 
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                      {t.customerName}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'JetBrains Mono', color: 'var(--accent-primary)' }}>
                    {t.ticketReference}
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Live Chat Canvas */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeTicket ? (
          <>
            {/* Header info strip */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.01)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>
                  {activeTicket.customerName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {activeTicket.customerName}
                    <span className="badge badge-sla-ok" style={{ fontSize: '0.6rem' }}>Online Presence Active</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Session {activeTicket.ticketReference} • {activeTicket.title}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={handleAiDeflectionTakeover}
                  style={{
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: 'var(--accent-secondary)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={13} />
                  <span>AI Co-Pilot Takeover</span>
                </button>

                <span className={`badge badge-${activeTicket.priority.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                  {activeTicket.priority} Priority
                </span>
              </div>
            </div>

            {/* Live Message Feed */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {messages.map((m) => {
                const isCustomer = m.senderRole === 'Customer';
                const isAi = m.isAiGenerated;
                const isInternal = m.isInternalNote;

                return (
                  <div 
                    key={m.id}
                    style={{
                      alignSelf: isCustomer ? 'flex-start' : 'flex-end',
                      maxWidth: '78%',
                      padding: '14px 18px',
                      borderRadius: '12px',
                      background: isInternal
                        ? 'rgba(234, 179, 8, 0.12)'
                        : isAi 
                          ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)'
                          : isCustomer 
                            ? 'rgba(255, 255, 255, 0.04)' 
                            : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      border: isInternal
                        ? '1px dashed rgba(234, 179, 8, 0.4)'
                        : isAi 
                          ? '1px solid rgba(99, 102, 241, 0.4)' 
                          : '1px solid var(--border-subtle)',
                      color: '#fff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '6px', fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                      <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isAi && <Sparkles size={12} />}
                        {m.senderName}
                      </span>
                      <span>{new Date(m.createdAtUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div style={{ fontSize: '0.88rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {m.content}
                    </div>
                  </div>
                );
              })}

              {/* Live Remote Typing Indicator */}
              {remoteTypingUser && (
                <div style={{ alignSelf: 'flex-start', padding: '8px 14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="pulse-dot" style={{ width: '6px', height: '6px' }} />
                  <span>{remoteTypingUser} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Real-Time Composer Bar */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(15, 23, 42, 0.7)', display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                placeholder="Type a real-time message (broadcasts live via SignalR)..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="input-field"
                style={{ flex: 1 }}
              />
              <button 
                disabled={!input.trim()} 
                onClick={handleSend} 
                className="btn-primary" 
                style={{ padding: '0 20px' }}
              >
                <Send size={15} />
                <span>Send</span>
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '10px' }}>
            <MessageCircle size={36} color="var(--border-subtle)" />
            <div>Select a live channel session to start communicating</div>
          </div>
        )}
      </div>
    </div>
  );
};

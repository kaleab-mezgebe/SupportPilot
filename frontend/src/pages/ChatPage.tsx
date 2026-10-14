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
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', height: 'calc(100vh - 130px)' }}>
      {/* Left Column: Real-Time Channels & Active Sessions */}
      <div className="editorial-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--color-border-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-surface-light)' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: 'var(--color-content-primary)' }}>Live Channels</h2>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-content-secondary)' }}>SignalR Real-time Hub</div>
          </div>

          {/* Connection Status Pill */}
          <div className="badge" style={{
            fontSize: '0.68rem',
            backgroundColor: connectionStatus === 'Connected' ? 'var(--color-highlight-green)' : 'var(--color-highlight-coral)',
            borderColor: connectionStatus === 'Connected' ? 'rgba(82, 154, 106, 0.3)' : 'rgba(235, 91, 85, 0.4)',
            color: connectionStatus === 'Connected' ? '#15803d' : '#b91c1c'
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
                  borderBottom: '1px solid var(--color-border-tertiary)',
                  backgroundColor: isSelected ? 'var(--color-surface-dim)' : 'var(--color-surface-neutral)',
                  borderLeft: isSelected ? '3px solid var(--color-border-primary)' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span 
                      style={{ 
                        width: '7px', 
                        height: '7px', 
                        borderRadius: '50%', 
                        backgroundColor: isOnline ? '#15803d' : 'var(--color-content-tertiary)'
                      }} 
                    />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-content-primary)' }}>
                      {t.customerName}
                    </span>
                  </div>
                  <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--color-content-secondary)' }}>
                    {t.ticketReference}
                  </span>
                </div>

                <div style={{ fontSize: '0.76rem', color: 'var(--color-content-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Live Chat Canvas */}
      <div className="editorial-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeTicket ? (
          <>
            {/* Header info strip */}
            <div style={{ padding: '18px 26px', borderBottom: '1px solid var(--color-border-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-surface-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-surface-intro)', border: '1px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--color-content-primary)', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                  {activeTicket.customerName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-content-primary)', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {activeTicket.customerName}
                    <span className="badge badge-sla-ok" style={{ fontSize: '0.62rem' }}>Presence Active</span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--color-content-secondary)' }}>
                    <span className="font-mono">{activeTicket.ticketReference}</span> • {activeTicket.title}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={handleAiDeflectionTakeover}
                  className="btn-secondary"
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.75rem',
                    borderRadius: '9999px'
                  }}
                >
                  <Sparkles size={13} color="var(--color-brand-purple)" />
                  <span>AI Co-Pilot Takeover</span>
                </button>

                <span className={`badge badge-${activeTicket.priority.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                  {activeTicket.priority}
                </span>
              </div>
            </div>

            {/* Live Message Feed */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: 'var(--color-surface-primary)' }}>
              {messages.map((m) => {
                const isCustomer = m.senderRole === 'Customer';
                const isAi = m.isAiGenerated;
                const isInternal = m.isInternalNote;

                return (
                  <div 
                    key={m.id}
                    style={{
                      alignSelf: isCustomer ? 'flex-start' : 'flex-end',
                      maxWidth: '75%',
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-s)',
                      backgroundColor: isInternal
                        ? 'var(--color-highlight-yellow)'
                        : isAi 
                          ? 'var(--color-highlight-purple)'
                          : isCustomer 
                            ? 'var(--color-surface-neutral)' 
                            : 'var(--color-surface-inverted)',
                      border: isInternal
                        ? '1px dashed #d97706'
                        : isAi 
                          ? '1px solid rgba(196, 85, 235, 0.35)' 
                          : isCustomer
                            ? '1px solid var(--color-border-tertiary)'
                            : '1px solid var(--color-surface-inverted-2)',
                      color: !isCustomer && !isInternal && !isAi ? '#ffffff' : 'var(--color-content-primary)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '6px', fontSize: '0.72rem', opacity: 0.8 }}>
                      <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isAi && <Sparkles size={12} />}
                        {m.senderName}
                      </span>
                      <span className="font-mono">{new Date(m.createdAtUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div style={{ fontSize: '0.88rem', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                      {m.content}
                    </div>
                  </div>
                );
              })}

              {/* Live Remote Typing Indicator */}
              {remoteTypingUser && (
                <div style={{ alignSelf: 'flex-start', padding: '6px 14px', borderRadius: '9999px', backgroundColor: 'var(--color-surface-neutral)', border: '1px solid var(--color-border-tertiary)', fontSize: '0.75rem', color: 'var(--color-content-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="pulse-dot" style={{ width: '6px', height: '6px' }} />
                  <span>{remoteTypingUser} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Real-Time Composer Bar */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border-tertiary)', backgroundColor: 'var(--color-surface-light)', display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                placeholder="Type a real-time message (broadcasts live via SignalR)..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="input-field"
                style={{ flex: 1, borderRadius: '9999px' }}
              />
              <button 
                disabled={!input.trim()} 
                onClick={handleSend} 
                className="btn-primary" 
                style={{ padding: '0 22px', borderRadius: '9999px' }}
              >
                <Send size={14} />
                <span>Send</span>
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-content-tertiary)', gap: '10px' }}>
            <MessageCircle size={36} color="var(--color-border-tertiary)" />
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem' }}>Select a live channel session to start communicating</div>
          </div>
        )}
      </div>
    </div>
  );
};

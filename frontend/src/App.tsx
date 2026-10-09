import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { TicketsPage } from './pages/TicketsPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { ChatPage } from './pages/ChatPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import type { Ticket, TicketPriority } from './types';
import { ApiService } from './services/api';
import { X } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);

  // New ticket form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('Medium');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [categoryName, setCategoryName] = useState('General Support');
  const [creating, setCreating] = useState(false);

  const handleSelectTicketFromDashboard = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setActiveTab('tickets');
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setCreating(true);
    try {
      const created = await ApiService.createTicket({
        title,
        description,
        priority,
        customerName: customerName || 'New Customer',
        customerEmail: customerEmail || 'customer@example.com',
        categoryName
      });
      setSelectedTicket(created);
      setIsNewTicketModalOpen(false);
      setTitle('');
      setDescription('');
      setActiveTab('tickets');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Workspace */}
      <div className="main-content">
        <Header onNewTicketClick={() => setIsNewTicketModalOpen(true)} />

        <main className="page-body">
          {activeTab === 'dashboard' && (
            <DashboardPage 
              onSelectTicket={handleSelectTicketFromDashboard} 
              onNavigateTickets={() => setActiveTab('tickets')} 
            />
          )}

          {activeTab === 'tickets' && (
            <TicketsPage initialSelectedTicket={selectedTicket} />
          )}

          {activeTab === 'knowledge' && (
            <KnowledgeBasePage />
          )}

          {activeTab === 'chat' && (
            <ChatPage />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPage />
          )}
        </main>
      </div>

      {/* New Ticket Modal */}
      {isNewTicketModalOpen && (
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
          zIndex: 100
        }}>
          <div className="glass-panel" style={{ width: '560px', padding: '28px', background: 'var(--bg-secondary)', border: '1px solid var(--border-focus)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Create Support Ticket</h3>
              <button onClick={() => setIsNewTicketModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Ticket Subject / Title *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Cannot complete OAuth SSO verification"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field" 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Customer Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="Jane Doe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="input-field" 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Customer Email
                  </label>
                  <input 
                    type="email" 
                    placeholder="jane@company.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="input-field" 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Priority
                  </label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    className="input-field"
                    style={{ background: 'var(--bg-tertiary)', color: '#fff' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select 
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="input-field"
                    style={{ background: 'var(--bg-tertiary)', color: '#fff' }}
                  >
                    <option value="General Support">General Support</option>
                    <option value="Configuration & DNS">Configuration & DNS</option>
                    <option value="Billing & Subscriptions">Billing & Subscriptions</option>
                    <option value="AI & Integrations">AI & Integrations</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Detailed Description *
                </label>
                <textarea 
                  rows={4}
                  required
                  placeholder="Describe the issue, reproduction steps, or context..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsNewTicketModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="btn-primary">
                  {creating ? 'Submitting...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

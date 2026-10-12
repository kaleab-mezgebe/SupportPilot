import * as signalR from '@microsoft/signalr';
import type { TicketMessage } from '../types';

export type SignalRConnectionStatus = 'Connected' | 'Connecting' | 'Reconnecting' | 'Disconnected';

export interface TypingEvent {
  ticketId: string;
  senderId?: string;
  senderName: string;
  isTyping: boolean;
}

export interface PresenceEvent {
  userId: string;
  userName: string;
  status: 'online' | 'offline' | 'away';
  timestampUtc: string;
}

export interface TicketActivityEvent {
  ticketId: string;
  ticketReference: string;
  senderName: string;
  contentSnippet: string;
  status: string;
  updatedAtUtc: string;
}

class SignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  private status: SignalRConnectionStatus = 'Disconnected';
  private statusListeners: Array<(status: SignalRConnectionStatus) => void> = [];
  private messageListeners: Array<(message: TicketMessage) => void> = [];
  private typingListeners: Array<(data: TypingEvent) => void> = [];
  private presenceListeners: Array<(data: PresenceEvent) => void> = [];
  private activityListeners: Array<(data: TicketActivityEvent) => void> = [];

  constructor() {
    this.initConnection();
  }

  private initConnection() {
    try {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl('http://localhost:5000/hubs/chat', {
          accessTokenFactory: () => localStorage.getItem('supportpilot_token') || '',
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
        })
        .withAutomaticReconnect([0, 1500, 4000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      this.hubConnection.onreconnecting(() => this.updateStatus('Reconnecting'));
      this.hubConnection.onreconnected(() => this.updateStatus('Connected'));
      this.hubConnection.onclose(() => this.updateStatus('Disconnected'));

      // Event handlers
      this.hubConnection.on('ReceiveMessage', (message: TicketMessage) => {
        this.messageListeners.forEach(listener => listener(message));
      });

      this.hubConnection.on('UserTyping', (data: TypingEvent) => {
        this.typingListeners.forEach(listener => listener(data));
      });

      this.hubConnection.on('UserPresenceChanged', (data: PresenceEvent) => {
        this.presenceListeners.forEach(listener => listener(data));
      });

      this.hubConnection.on('TicketActivity', (data: TicketActivityEvent) => {
        this.activityListeners.forEach(listener => listener(data));
      });
    } catch {
      this.updateStatus('Disconnected');
    }
  }

  async start(): Promise<void> {
    if (!this.hubConnection) {
      this.initConnection();
    }

    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
      this.updateStatus('Connecting');
      try {
        await this.hubConnection.start();
        this.updateStatus('Connected');
      } catch {
        this.updateStatus('Disconnected');
      }
    }
  }

  async stop(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
      } finally {
        this.updateStatus('Disconnected');
      }
    }
  }

  private updateStatus(newStatus: SignalRConnectionStatus) {
    this.status = newStatus;
    this.statusListeners.forEach(cb => cb(newStatus));
  }

  getStatus(): SignalRConnectionStatus {
    return this.status;
  }

  onStatusChange(callback: (status: SignalRConnectionStatus) => void): () => void {
    this.statusListeners.push(callback);
    callback(this.status);
    return () => {
      this.statusListeners = this.statusListeners.filter(cb => cb !== callback);
    };
  }

  onMessage(callback: (message: TicketMessage) => void): () => void {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(cb => cb !== callback);
    };
  }

  onTyping(callback: (data: TypingEvent) => void): () => void {
    this.typingListeners.push(callback);
    return () => {
      this.typingListeners = this.typingListeners.filter(cb => cb !== callback);
    };
  }

  onPresence(callback: (data: PresenceEvent) => void): () => void {
    this.presenceListeners.push(callback);
    return () => {
      this.presenceListeners = this.presenceListeners.filter(cb => cb !== callback);
    };
  }

  onActivity(callback: (data: TicketActivityEvent) => void): () => void {
    this.activityListeners.push(callback);
    return () => {
      this.activityListeners = this.activityListeners.filter(cb => cb !== callback);
    };
  }

  async joinTicket(ticketId: string): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke('JoinTicketConversation', ticketId);
      } catch {
        // Ignored in offline fallback
      }
    }
  }

  async leaveTicket(ticketId: string): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke('LeaveTicketConversation', ticketId);
      } catch {
        // Ignored in offline fallback
      }
    }
  }

  async sendTyping(ticketId: string, isTyping: boolean): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke('SendTyping', ticketId, isTyping);
      } catch {
        // Ignored in offline fallback
      }
    }
  }

  async sendMessage(ticketId: string, content: string, isInternalNote: boolean = false): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('SendMessage', ticketId, content, isInternalNote);
    } else {
      // Local demo fallback event
      const fallbackMsg: TicketMessage = {
        id: crypto.randomUUID(),
        ticketId,
        senderName: 'Alex Rivera (Agent)',
        senderRole: 'SupportAgent',
        content,
        isInternalNote,
        isAiGenerated: false,
        createdAtUtc: new Date().toISOString()
      };
      this.messageListeners.forEach(listener => listener(fallbackMsg));
    }
  }
}

export const RealtimeService = new SignalRService();

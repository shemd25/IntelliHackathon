import { Client, IMessage, StompHeaders } from '@stomp/stompjs';
import { WS_URL, WS_RECONNECT_BASE_MS, WS_RECONNECT_MAX_MS } from '../constants/config';
import { SensorPayload, ConnectionStatus } from '../types';

type StatusCallback = (status: ConnectionStatus) => void;

class WebSocketService {
  private client: Client | null = null;
  private token: string | null = null;
  private onStatusChange: StatusCallback | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  setStatusCallback(cb: StatusCallback) {
    this.onStatusChange = cb;
  }

  private notifyStatus(status: ConnectionStatus) {
    this.onStatusChange?.(status);
  }

  connect(token: string): void {
    this.token = token;
    this.reconnectAttempts = 0;
    this._connect();
  }

  private _connect(): void {
    if (this.client?.active) {
      return;
    }

    this.notifyStatus('connecting');

    this.client = new Client({
      brokerURL: WS_URL,
      connectHeaders: {
        Authorization: `Bearer ${this.token}`,
      } as StompHeaders,
      // Use native WebSocket (required for React Native)
      webSocketFactory: () => new WebSocket(WS_URL),
      // Disable @stomp/stompjs built-in reconnect — we manage it manually
      reconnectDelay: 0,
      onConnect: () => {
        this.reconnectAttempts = 0;
        this.notifyStatus('connected');
      },
      onDisconnect: () => {
        this.notifyStatus('disconnected');
        this._scheduleReconnect();
      },
      onStompError: (frame) => {
        console.error('[WS] STOMP error:', frame.headers?.message);
        this.notifyStatus('error');
        this._scheduleReconnect();
      },
      onWebSocketError: (event) => {
        console.error('[WS] WebSocket error:', event);
        this.notifyStatus('error');
        this._scheduleReconnect();
      },
      onWebSocketClose: () => {
        this.notifyStatus('disconnected');
        this._scheduleReconnect();
      },
    });

    this.client.activate();
  }

  private _scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (capped)
    const delay = Math.min(
      WS_RECONNECT_BASE_MS * Math.pow(2, this.reconnectAttempts),
      WS_RECONNECT_MAX_MS,
    );
    this.reconnectAttempts += 1;

    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      if (this.token) {
        this._connect();
      }
    }, delay);
  }

  sendPayload(payload: SensorPayload): boolean {
    if (!this.client?.active || !this.client?.connected) {
      return false;
    }

    try {
      this.client.publish({
        destination: '/app/sensor.stream',
        body: JSON.stringify(payload),
        headers: { 'content-type': 'application/json' },
      });
      return true;
    } catch (err) {
      console.error('[WS] Failed to publish payload:', err);
      return false;
    }
  }

  isConnected(): boolean {
    return this.client?.connected === true;
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.token = null;
    this.client?.deactivate();
    this.client = null;
    this.notifyStatus('disconnected');
  }
}

// Module-level singleton — accessible from background tasks
const wsService = new WebSocketService();
export default wsService;

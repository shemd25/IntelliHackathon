import { create } from 'zustand';
import { ConnectionStatus } from '../types';

interface AuthState {
  token: string | null;
  childId: string | null;
  childName: string | null;
  isAuthenticated: boolean;
  connectionStatus: ConnectionStatus;
  payloadsSent: number;
  lastPayloadAt: number | null;

  setAuth: (token: string, childId: string, childName: string) => void;
  clearAuth: () => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  incrementPayloadsSent: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  childId: null,
  childName: null,
  isAuthenticated: false,
  connectionStatus: 'disconnected',
  payloadsSent: 0,
  lastPayloadAt: null,

  setAuth: (token, childId, childName) =>
    set({ token, childId, childName, isAuthenticated: true }),

  clearAuth: () =>
    set({
      token: null,
      childId: null,
      childName: null,
      isAuthenticated: false,
      connectionStatus: 'disconnected',
      payloadsSent: 0,
      lastPayloadAt: null,
    }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  incrementPayloadsSent: () =>
    set((state) => ({
      payloadsSent: state.payloadsSent + 1,
      lastPayloadAt: Date.now(),
    })),
}));

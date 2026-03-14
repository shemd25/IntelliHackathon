import { create } from 'zustand'
import type { SensorPayload, ConnectionStatus } from '@/types/sensor'

const MAX_HISTORY = 50

interface LocationState {
  currentPayload: SensorPayload | null
  locationHistory: SensorPayload[]
  connectionStatus: ConnectionStatus
  lastUpdateMs: number
  setPayload: (payload: SensorPayload) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  clearHistory: () => void
}

export const useLocationStore = create<LocationState>((set) => ({
  currentPayload: null,
  locationHistory: [],
  connectionStatus: 'disconnected',
  lastUpdateMs: Infinity,

  setPayload: (payload) =>
    set((state) => {
      const history = [...state.locationHistory, payload]
      if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY)
      return {
        currentPayload: payload,
        locationHistory: history,
        lastUpdateMs: 0,
      }
    }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  clearHistory: () =>
    set({ currentPayload: null, locationHistory: [], lastUpdateMs: Infinity }),
}))

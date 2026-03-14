import { useEffect, useRef, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useLocationStore } from '@/store/locationStore'
import type { SensorPayload } from '@/types/sensor'

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080'
const MAX_BACKOFF_MS = 8000

export function useChildLocation(childId: string | null) {
  const { setPayload, setConnectionStatus, locationHistory, currentPayload, lastUpdateMs, connectionStatus } =
    useLocationStore()
  const clientRef = useRef<Client | null>(null)
  const backoffRef = useRef(1000)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Track ms since last update
  useEffect(() => {
    elapsedTimerRef.current = setInterval(() => {
      useLocationStore.setState((s) => ({
        lastUpdateMs: s.lastUpdateMs === Infinity ? Infinity : s.lastUpdateMs + 100,
      }))
    }, 100)
    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current)
    }
  }, [])

  const connect = useCallback(() => {
    if (!childId) return
    const token = localStorage.getItem('sentinel_token')

    setConnectionStatus('connecting')

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 0, // We handle reconnect manually for backoff
      onConnect: () => {
        backoffRef.current = 1000
        setConnectionStatus('connected')
        client.subscribe(`/topic/location/${childId}`, (message) => {
          try {
            const payload = JSON.parse(message.body) as SensorPayload
            setPayload(payload)
          } catch {
            // malformed frame — ignore
          }
        })
      },
      onDisconnect: () => {
        setConnectionStatus('disconnected')
        scheduleReconnect()
      },
      onStompError: () => {
        setConnectionStatus('error')
        scheduleReconnect()
      },
      onWebSocketError: () => {
        setConnectionStatus('error')
        scheduleReconnect()
      },
    })

    clientRef.current = client
    client.activate()
  }, [childId, setConnectionStatus, setPayload]) // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
    reconnectTimerRef.current = setTimeout(() => {
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS)
      connect()
    }, backoffRef.current)
  }, [connect])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      clientRef.current?.deactivate()
    }
  }, [connect])

  const isStreaming = lastUpdateMs < 2000

  return { currentPayload, locationHistory, isStreaming, lastUpdateMs, connectionStatus }
}

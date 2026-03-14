import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useChildLocation } from '@/hooks/useChildLocation'
import { SentinelMap } from '@/components/SentinelMap'
import { ChildStatusCard } from '@/components/ChildStatusCard'
import { AlertFeed } from '@/components/AlertFeed'
import { colors } from '@/lib/theme'
import { Shield, LogOut, Wifi, WifiOff, Loader2, AlertTriangle } from 'lucide-react'
import type { AlertItem } from '@/types/sensor'

// Demo child — in production this comes from GET /api/children
const DEMO_CHILD = { id: '00000000-0000-0000-0000-000000000001', name: 'Demo Child' }

const STATUS_COLORS = {
  connected: colors.safe,
  connecting: '#f59e0b',
  disconnected: colors.textDim,
  error: colors.alert,
}

const STATUS_LABELS = {
  connected: 'Live',
  connecting: 'Connecting…',
  disconnected: 'Offline',
  error: 'Error',
}

export function DashboardPage() {
  const { logout } = useAuth()
  const [selectedChildId, setSelectedChildId] = useState<string>(DEMO_CHILD.id)
  const { currentPayload, locationHistory, isStreaming, connectionStatus } = useChildLocation(selectedChildId)
  const [alerts, setAlerts] = useState<AlertItem[]>([])

  function resolveAlert(id: string) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)))
  }

  const StatusIcon = connectionStatus === 'connecting' ? Loader2 : connectionStatus === 'connected' ? Wifi : WifiOff

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: colors.bg, fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Top bar */}
      <header
        className="flex items-center gap-4 px-4 py-3 flex-shrink-0"
        style={{ background: colors.bgPanel, borderBottom: `1px solid ${colors.border}` }}
      >
        <Shield size={24} color={colors.accent} />
        <h1 className="text-lg font-bold flex-1" style={{ color: colors.textPrimary }}>
          Sentinel
        </h1>

        {/* Streaming status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs" style={{ background: colors.bg }}>
          <StatusIcon
            size={14}
            color={STATUS_COLORS[connectionStatus]}
            className={connectionStatus === 'connecting' ? 'animate-spin' : ''}
          />
          <span style={{ color: STATUS_COLORS[connectionStatus], fontFamily: "'DM Mono', monospace" }}>
            {STATUS_LABELS[connectionStatus]}
          </span>
        </div>

        {/* Anomaly score badge (placeholder) */}
        <div
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs"
          style={{ background: colors.bg, color: colors.safe }}
        >
          <AlertTriangle size={12} />
          <span style={{ fontFamily: "'DM Mono', monospace" }}>OK</span>
        </div>

        <button
          onClick={logout}
          className="p-1.5 rounded-lg"
          style={{ color: colors.textDim, background: 'none', border: 'none', cursor: 'pointer' }}
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside
          className="w-72 flex-shrink-0 flex flex-col border-r overflow-y-auto"
          style={{ background: colors.bgAlt, borderColor: colors.border }}
        >
          <div className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: colors.textDim }}>
              Children
            </p>
            <ChildStatusCard
              name={DEMO_CHILD.name}
              childId={DEMO_CHILD.id}
              currentPayload={currentPayload}
              isStreaming={isStreaming}
              isSelected={selectedChildId === DEMO_CHILD.id}
              onClick={() => setSelectedChildId(DEMO_CHILD.id)}
            />
          </div>

          <div className="border-t p-4 flex-1" style={{ borderColor: colors.border }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: colors.textDim }}>
              Alerts
            </p>
            <AlertFeed alerts={alerts} onResolve={resolveAlert} />
          </div>
        </aside>

        {/* Main map */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <SentinelMap currentPayload={currentPayload} locationHistory={locationHistory} />
        </main>
      </div>
    </div>
  )
}

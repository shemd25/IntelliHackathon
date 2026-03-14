import { colors } from '@/lib/theme'
import type { AlertItem } from '@/types/sensor'
import { formatDistanceToNow } from 'date-fns'
import { ShieldAlert, MapPin, Wifi, Activity } from 'lucide-react'

const ALERT_ICONS = {
  GEOFENCE_BREACH: ShieldAlert,
  SOS: ShieldAlert,
  ANOMALY: Activity,
  OFFLINE: Wifi,
}

const ALERT_COLORS = {
  GEOFENCE_BREACH: colors.alert,
  SOS: colors.alert,
  ANOMALY: '#f59e0b',
  OFFLINE: colors.textMuted,
}

interface AlertFeedProps {
  alerts: AlertItem[]
  onResolve: (id: string) => void
}

export function AlertFeed({ alerts, onResolve }: AlertFeedProps) {
  const activeAlerts = alerts.filter((a) => !a.resolved)

  if (activeAlerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8" style={{ color: colors.textDim }}>
        <div className="mb-2 opacity-40">
          <ShieldAlert size={32} color={colors.safe} />
        </div>
        <p className="text-sm" style={{ color: colors.safe }}>All clear</p>
        <p className="text-xs mt-1" style={{ color: colors.textDim }}>No active alerts</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto max-h-64">
      {activeAlerts.map((alert) => {
        const Icon = ALERT_ICONS[alert.type]
        const iconColor = ALERT_COLORS[alert.type]
        return (
          <div
            key={alert.id}
            className="p-3 rounded-lg border"
            style={{ background: colors.bgAlt, borderColor: `${iconColor}55` }}
          >
            <div className="flex items-start gap-2">
              <Icon size={16} color={iconColor} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: iconColor, fontFamily: "'DM Sans', sans-serif" }}>
                  {alert.type.replace('_', ' ')}
                </p>
                <p className="text-xs mt-0.5 truncate" style={{ color: colors.textMuted }}>
                  {alert.message}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono" style={{ color: colors.textDim }}>
                    {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                  </span>
                  {alert.lat && alert.lng && (
                    <span className="flex items-center gap-0.5 text-xs" style={{ color: colors.accentDim }}>
                      <MapPin size={10} />
                      {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => onResolve(alert.id)}
              className="mt-2 w-full text-xs py-1 rounded"
              style={{
                background: `${iconColor}22`,
                color: iconColor,
                border: `1px solid ${iconColor}44`,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Resolve
            </button>
          </div>
        )
      })}
    </div>
  )
}

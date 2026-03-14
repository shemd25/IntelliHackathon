import { colors } from '@/lib/theme'
import type { SensorPayload } from '@/types/sensor'
import { formatDistanceToNow } from 'date-fns'

interface ChildStatusCardProps {
  name: string
  childId: string
  currentPayload: SensorPayload | null
  isStreaming: boolean
  isSelected: boolean
  onClick: () => void
}

export function ChildStatusCard({ name, currentPayload, isStreaming, isSelected, onClick }: ChildStatusCardProps) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const lastSeen = currentPayload
    ? formatDistanceToNow(new Date(currentPayload.timestamp), { addSuffix: true })
    : 'Never'

  const speed = currentPayload?.location.speed ?? 0
  const battery = currentPayload?.deviceMeta.battery ?? null

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-xl transition-all"
      style={{
        background: isSelected ? colors.bgPanel : 'transparent',
        border: `1px solid ${isSelected ? colors.accent : colors.border}`,
        cursor: 'pointer',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
            style={{ background: colors.bgPanel, color: colors.accent, fontFamily: "'DM Sans', sans-serif" }}
          >
            {initials}
          </div>
          {/* Status ring */}
          {isStreaming && (
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: `${colors.safe}33`, border: `1px solid ${colors.safe}` }}
            />
          )}
          <div
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
            style={{
              background: isStreaming ? colors.safe : colors.textDim,
              borderColor: colors.bg,
            }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate" style={{ color: colors.textPrimary, fontFamily: "'DM Sans', sans-serif" }}>
            {name}
          </p>
          <p className="text-xs truncate" style={{ color: colors.textMuted }}>
            {isStreaming ? 'Streaming live' : `Last seen ${lastSeen}`}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      {currentPayload && (
        <div className="flex gap-3 mt-2 text-xs font-mono" style={{ color: colors.textDim }}>
          <span style={{ color: speed > 5 ? colors.accent : colors.textDim }}>
            {speed.toFixed(1)} m/s
          </span>
          {battery !== null && (
            <span style={{ color: battery < 20 ? colors.alert : colors.textDim }}>
              🔋 {battery}%
            </span>
          )}
          <span style={{ color: colors.textDim }}>
            {currentPayload.deviceMeta.network}
          </span>
        </div>
      )}
    </button>
  )
}

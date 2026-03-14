import { useRef, useEffect, useState, useCallback } from 'react'
import Map, { Layer, Source, Marker, type MapRef } from 'react-map-gl'
import type { LocationData, SensorPayload } from '@/types/sensor'
import { colors } from '@/lib/theme'
import { formatDistanceToNow } from 'date-fns'

interface SentinelMapProps {
  currentPayload: SensorPayload | null
  locationHistory: SensorPayload[]
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

// Kingston, Jamaica — demo fallback
const DEMO_LOCATION: LocationData = { lat: 18.0179, lng: -76.8099, accuracy: 4.2, speed: 0, heading: 0 }

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function SentinelMap({ currentPayload, locationHistory }: SentinelMapProps) {
  const mapRef = useRef<MapRef>(null)
  const displayRef = useRef<LocationData>(DEMO_LOCATION)
  const [displayPos, setDisplayPos] = useState<LocationData>(DEMO_LOCATION)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const [elapsed, setElapsed] = useState('–')
  const animRef = useRef<number | null>(null)

  // Smooth interpolation when new location arrives
  useEffect(() => {
    if (!currentPayload) return
    const from = { ...displayRef.current }
    const to = currentPayload.location
    setLastUpdateTime(new Date())

    const start = performance.now()
    const DURATION = 500

    if (animRef.current) cancelAnimationFrame(animRef.current)

    const animate = (now: number) => {
      const t = Math.min((now - start) / DURATION, 1)
      const interpolated: LocationData = {
        lat: lerp(from.lat, to.lat, t),
        lng: lerp(from.lng, to.lng, t),
        accuracy: to.accuracy,
        speed: to.speed,
        heading: to.heading,
      }
      displayRef.current = interpolated
      setDisplayPos({ ...interpolated })
      if (t < 1) animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [currentPayload])

  // Elapsed timer updating every 100ms
  useEffect(() => {
    const id = setInterval(() => {
      if (!lastUpdateTime) return setElapsed('–')
      const ms = Date.now() - lastUpdateTime.getTime()
      setElapsed(ms < 2000 ? `${(ms / 1000).toFixed(1)}s ago` : formatDistanceToNow(lastUpdateTime, { addSuffix: true }))
    }, 100)
    return () => clearInterval(id)
  }, [lastUpdateTime])

  // GeoJSON trail
  const trailGeoJson = useCallback((): GeoJSON.Feature<GeoJSON.LineString> => ({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: locationHistory.map((p) => [p.location.lng, p.location.lat]),
    },
    properties: {},
  }), [locationHistory])

  const hasToken = MAPBOX_TOKEN && !MAPBOX_TOKEN.startsWith('pk.placeholder')

  if (!hasToken) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center"
        style={{ background: colors.bg, minHeight: 400 }}
      >
        <div
          className="text-center p-8 rounded-xl border"
          style={{ borderColor: colors.border, background: colors.bgPanel, maxWidth: 480 }}
        >
          <div className="text-5xl mb-4">🗺️</div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: colors.accent, fontFamily: "'DM Sans', sans-serif" }}>
            Mapbox Token Required
          </h2>
          <p className="mb-4" style={{ color: colors.textMuted }}>
            Set <code className="px-1 py-0.5 rounded" style={{ background: colors.bg, color: colors.accent }}>VITE_MAPBOX_TOKEN</code> in your <code>.env</code> to enable the live map.
          </p>
          <p className="text-sm" style={{ color: colors.textDim }}>
            Get a free token at <strong>mapbox.com</strong> → Account → Access Tokens
          </p>
          {/* Mock marker position info */}
          <div className="mt-4 p-3 rounded-lg" style={{ background: colors.bg }}>
            <p className="text-xs font-mono" style={{ color: colors.safe }}>
              Demo location: {DEMO_LOCATION.lat.toFixed(4)}, {DEMO_LOCATION.lng.toFixed(4)}
            </p>
            <p className="text-xs mt-1" style={{ color: colors.textDim }}>Kingston, Jamaica</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex-1" style={{ minHeight: 400 }}>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        initialViewState={{
          longitude: displayPos.lng,
          latitude: displayPos.lat,
          zoom: 14,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Location trail */}
        {locationHistory.length > 1 && (
          <Source id="trail" type="geojson" data={trailGeoJson()}>
            <Layer
              id="trail-line"
              type="line"
              paint={{
                'line-color': colors.accent,
                'line-width': 2,
                'line-opacity': 0.6,
              }}
            />
          </Source>
        )}

        {/* Child marker */}
        <Marker longitude={displayPos.lng} latitude={displayPos.lat} anchor="center">
          <div className="sentinel-marker">
            <svg width="32" height="38" viewBox="0 0 32 38" fill="none">
              <path
                d="M16 1L2 7v10c0 9.5 5.9 18.4 14 21 8.1-2.6 14-11.5 14-21V7L16 1z"
                fill={colors.accent}
                fillOpacity={0.9}
                stroke={colors.accent}
                strokeWidth="1.5"
              />
              <circle cx="16" cy="16" r="5" fill={colors.bg} />
            </svg>
          </div>
        </Marker>
      </Map>

      {/* Timestamp overlay */}
      <div
        className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg text-xs font-mono"
        style={{ background: 'rgba(10,22,40,0.85)', color: colors.textMuted, backdropFilter: 'blur(4px)' }}
      >
        Last update: <span style={{ color: colors.accent }}>{elapsed}</span>
      </div>
    </div>
  )
}

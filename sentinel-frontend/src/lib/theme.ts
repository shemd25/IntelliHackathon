export const colors = {
  bg: '#0a1628',
  bgAlt: '#0d1f3a',
  bgPanel: '#0f2347',
  accent: '#00d4ff',
  accentDim: '#0099bb',
  alert: '#ff3d3d',
  safe: '#00ff87',
  safeDim: '#00cc6a',
  border: '#1a3a5c',
  textPrimary: '#e8f4f8',
  textMuted: '#7a9bb5',
  textDim: '#4a6a85',
} as const

export const fonts = {
  mono: "'DM Mono', monospace",
  sans: "'DM Sans', sans-serif",
} as const

export type Color = keyof typeof colors

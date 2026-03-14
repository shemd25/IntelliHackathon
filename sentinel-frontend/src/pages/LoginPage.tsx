import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { colors } from '@/lib/theme'
import { Shield, Eye, EyeOff } from 'lucide-react'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: colors.bg }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: colors.bgPanel, border: `1px solid ${colors.border}` }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <Shield size={32} color={colors.accent} />
          <div>
            <h1 className="text-xl font-bold" style={{ color: colors.textPrimary, fontFamily: "'DM Sans', sans-serif" }}>
              Sentinel
            </h1>
            <p className="text-xs" style={{ color: colors.textMuted }}>
              Parent Dashboard
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="parent@sentinel.dev"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
                fontFamily: "'DM Mono', monospace",
              }}
              onFocus={(e) => (e.target.style.borderColor = colors.accent)}
              onBlur={(e) => (e.target.style.borderColor = colors.border)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: colors.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all pr-10"
                style={{
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary,
                  fontFamily: "'DM Mono', monospace",
                }}
                onFocus={(e) => (e.target.style.borderColor = colors.accent)}
                onBlur={(e) => (e.target.style.borderColor = colors.border)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: colors.textDim, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ color: colors.alert, background: `${colors.alert}15`, border: `1px solid ${colors.alert}33` }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: loading ? colors.accentDim : colors.accent,
              color: colors.bg,
              fontFamily: "'DM Sans', sans-serif",
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-center mt-6" style={{ color: colors.textDim }}>
          Demo: <span style={{ color: colors.accent, fontFamily: "'DM Mono', monospace" }}>parent@sentinel.dev</span> / sentinel123
        </p>
      </div>
    </div>
  )
}

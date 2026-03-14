import { useCallback } from 'react'
import api from '@/lib/axios'

export function useAuth() {
  const token = localStorage.getItem('sentinel_token')
  const isAuthenticated = !!token

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const response = await api.post<{ token: string }>('/api/auth/login', { email, password })
    localStorage.setItem('sentinel_token', response.data.token)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('sentinel_token')
    window.location.href = '/login'
  }, [])

  return { isAuthenticated, login, logout, token }
}

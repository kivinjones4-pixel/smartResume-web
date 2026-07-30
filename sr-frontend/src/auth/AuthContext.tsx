import { useEffect, useMemo, useState } from 'react'
import {
  authRequest,
  refreshSession,
  setAccessToken,
  type AuthResponse,
  type AuthUser,
} from './api'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    refreshSession()
      .then((session) => {
        if (active) setUser(session?.user ?? null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (values) => {
        const response = await authRequest<AuthResponse>(
          '/api/v1/auth/login',
          { method: 'POST', body: JSON.stringify(values) },
          false,
        )
        setAccessToken(response.access_token)
        setUser(response.user)
      },
      register: async (values) => {
        const response = await authRequest<AuthResponse>(
          '/api/v1/auth/register',
          { method: 'POST', body: JSON.stringify(values) },
          false,
        )
        setAccessToken(response.access_token)
        setUser(response.user)
      },
      logout: async () => {
        try {
          await authRequest<void>('/api/v1/auth/logout', { method: 'POST' }, false)
        } finally {
          setAccessToken(null)
          setUser(null)
        }
      },
    }),
    [loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

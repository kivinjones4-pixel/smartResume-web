import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react'
import * as authService from '../services/Auth'
import { setRequestRefreshHandler } from '../services/request'
import type { AuthStoreValue, AuthUser } from '../types/Auth'

const AuthContext = createContext<AuthStoreValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const refreshAndSyncUser = async () => {
      const session = await authService.refresh()
      if (active) setUser(session?.user ?? null)
      return Boolean(session)
    }
    setRequestRefreshHandler(refreshAndSyncUser)
    refreshAndSyncUser().finally(() => {
      if (active) setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const value = useMemo<AuthStoreValue>(
    () => ({
      user,
      loading,
      login: async (params) => {
        const session = await authService.login(params)
        setUser(session.user)
      },
      register: async (params) => {
        const session = await authService.register(params)
        setUser(session.user)
      },
      logout: async () => {
        await authService.logout()
        setUser(null)
      },
    }),
    [loading, user],
  )

  return createElement(AuthContext.Provider, { value }, children)
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

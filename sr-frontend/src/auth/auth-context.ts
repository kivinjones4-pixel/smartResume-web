import { createContext } from 'react'
import type { AuthUser } from './api'

export type LoginValues = {
  identifier: string
  password: string
}

export type RegisterValues = {
  email: string
  password: string
  username: string
}

export type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  login: (values: LoginValues) => Promise<void>
  register: (values: RegisterValues) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

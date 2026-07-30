import type { AuthResponse, LoginParams, RegisterParams } from '../types/Auth'
import { http, setRequestAccessToken } from './request'

const basePath = '/api/v1/auth'

export async function login(params: LoginParams) {
  const session = await http.post<AuthResponse>(`${basePath}/login`, params, {
    skipAuth: true,
    skipRefresh: true,
  })
  setRequestAccessToken(session.access_token)
  return session
}

export async function register(params: RegisterParams) {
  const session = await http.post<AuthResponse>(`${basePath}/register`, params, {
    skipAuth: true,
    skipRefresh: true,
  })
  setRequestAccessToken(session.access_token)
  return session
}

export async function refresh() {
  try {
    const session = await http.post<AuthResponse>(`${basePath}/refresh`, undefined, {
      skipAuth: true,
      skipRefresh: true,
    })
    setRequestAccessToken(session.access_token)
    return session
  } catch {
    setRequestAccessToken(null)
    return null
  }
}

export async function logout() {
  try {
    await http.post<void>(`${basePath}/logout`, undefined, { skipRefresh: true })
  } finally {
    setRequestAccessToken(null)
  }
}

export function me() {
  return http.get<{ user: AuthResponse['user'] }>(`${basePath}/me`)
}

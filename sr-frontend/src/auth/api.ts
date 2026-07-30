export type AuthUser = {
  id: string
  email: string
  username: string
  phone?: string | null
}

export type AuthResponse = {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  user: AuthUser
}

type ErrorResponse = {
  message?: string
}

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export async function authRequest<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  })

  if (response.status === 401 && retry && path !== '/api/v1/auth/refresh') {
    const refreshed = await refreshSession()
    if (refreshed) return authRequest<T>(path, init, false)
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ErrorResponse
    throw new Error(body.message || '请求失败，请稍后重试')
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function refreshSession(): Promise<AuthResponse | null> {
  try {
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
    if (!response.ok) {
      setAccessToken(null)
      return null
    }
    const data = (await response.json()) as AuthResponse
    setAccessToken(data.access_token)
    return data
  } catch {
    setAccessToken(null)
    return null
  }
}

type ErrorResponse = {
  message?: string
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type RequestOptions = RequestInit & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

let accessToken: string | null = null
let refreshHandler: (() => Promise<boolean>) | null = null
let refreshPromise: Promise<boolean> | null = null

export function setRequestAccessToken(token: string | null) {
  accessToken = token
}

export function setRequestRefreshHandler(handler: () => Promise<boolean>) {
  refreshHandler = handler
}

async function refreshOnce() {
  if (!refreshHandler) return false
  if (!refreshPromise) {
    refreshPromise = refreshHandler().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

/**
 * 发起鉴权请求，自动处理Token刷新与错误
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth = false, skipRefresh = false, ...init } = options
  const headers = new Headers(init.headers)
  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (!skipAuth && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  })

  if (response.status === 401 && !skipRefresh && (await refreshOnce())) {
    return request<T>(path, { ...options, skipRefresh: true })
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ErrorResponse
    throw new ApiError(body.message || '请求失败，请稍后重试', response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}

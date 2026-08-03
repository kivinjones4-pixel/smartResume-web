type ApiEnvelope<T> = {
  code: number
  msg: string
  data: T
}

type ErrorData = {
  error_code?: string
}

export class ApiError extends Error {
  status: number
  code: string

  constructor(message: string, status: number, code = 'UNKNOWN_ERROR') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
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

  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      headers,
      credentials: 'include',
    })
  } catch {
    throw new ApiError('网络连接失败，请检查网络后重试', 0, 'NETWORK_ERROR')
  }

  if (response.status === 401 && !skipRefresh && (await refreshOnce())) {
    return request<T>(path, { ...options, skipRefresh: true })
  }

  if (response.status === 204) return undefined as T
  const body = (await response.json().catch(() => null)) as ApiEnvelope<T | ErrorData> | null
  if (!response.ok || !body || body.code !== 0) {
    const errorData = body?.data as ErrorData | undefined
    throw new ApiError(
      body?.msg || '请求失败，请稍后重试',
      response.status,
      errorData?.error_code,
    )
  }
  return body.data as T
}

export async function authenticatedFetch(
	path: string,
	options: RequestInit = {},
	skipRefresh = false,
): Promise<Response> {
	const headers = new Headers(options.headers)
	if (options.body && !(options.body instanceof FormData)) {
		headers.set('Content-Type', 'application/json')
	}
	if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
	let response: Response
	try {
		response = await fetch(path, { ...options, headers, credentials: 'include' })
	} catch {
		throw new ApiError('网络连接失败，请检查网络后重试', 0, 'NETWORK_ERROR')
	}
	if (response.status === 401 && !skipRefresh && (await refreshOnce())) {
		return authenticatedFetch(path, options, true)
	}
	return response
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

import { ApiError, authenticatedFetch, request } from './request'
import type { PublicResumeData, ResumeAgentHistoryMessage } from '../types/PublicResume'

const tokenKey = (id: string) => `resume-visitor-token:${id}`
const deviceIDKey = 'smart-resume-device-id'

function getVisitorToken(id: string) {
  return sessionStorage.getItem(tokenKey(id)) ?? ''
}

export async function unlockResume(id: string, code: string): Promise<void> {
  const result = await request<{ visitor_token: string }>(
    `/api/v1/public/resumes/${encodeURIComponent(id)}/access`,
    { method: 'POST', body: JSON.stringify({ code }) },
  )
  sessionStorage.setItem(tokenKey(id), result.visitor_token)
}

export function getPublicResume(id: string) {
  return request<PublicResumeData>(`/api/v1/public/resumes/${encodeURIComponent(id)}`, {
    headers: { 'X-Visitor-Token': getVisitorToken(id) },
  })
}

function getDeviceID() {
  let value = localStorage.getItem(deviceIDKey)
  if (!value) {
    value = crypto.randomUUID()
    localStorage.setItem(deviceIDKey, value)
  }
  return value
}

type StreamPayload = {
  content?: string
  message?: string
}

function consumeEventBlock(block: string, onDelta: (text: string) => void) {
  let event = ''
  const dataLines: string[] = []
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
  }
  if (!dataLines.length) return

  const payload = JSON.parse(dataLines.join('\n')) as StreamPayload
  if (event === 'delta') onDelta(payload.content ?? '')
  if (event === 'error') {
    throw new ApiError(payload.message || 'AI 代理暂时无法回答', 200)
  }
}

export async function streamPublicResumeChat(
  id: string,
  message: string,
  history: ResumeAgentHistoryMessage[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
) {
  const response = await authenticatedFetch(
    `/api/v1/public/resumes/${encodeURIComponent(id)}/chat/stream`,
    {
      method: 'POST',
      body: JSON.stringify({ message, history }),
      signal,
      headers: {
        Accept: 'text/event-stream',
        'X-Visitor-Token': getVisitorToken(id),
        'X-Device-ID': getDeviceID(),
      },
    },
  )
  if (!response.ok || !response.body) {
    const body = await response.json().catch(() => null) as { msg?: string } | null
    throw new ApiError(body?.msg || 'AI 代理暂时无法回答', response.status)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value, { stream: !done }).replaceAll('\r\n', '\n')
    const blocks = buffer.split('\n\n')
    buffer = blocks.pop() ?? ''
    blocks.forEach((block) => consumeEventBlock(block, onDelta))
    if (done) break
  }
}

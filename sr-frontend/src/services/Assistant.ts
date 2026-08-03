import { ApiError, authenticatedFetch } from './request'

export type AssistantSource = {
  title: string
  source_path: string
  source_url?: string
  similarity?: number
}

type StreamHandlers = {
  onSources: (sources: AssistantSource[]) => void
  onDelta: (content: string) => void
  onDone: () => void
}

export async function streamAssistantMessage(
  message: string,
  handlers: StreamHandlers,
  signal?: AbortSignal,
) {
  const response = await authenticatedFetch('/api/v1/assistant/chat/stream', {
    method: 'POST',
    body: JSON.stringify({ message }),
    signal,
    headers: { Accept: 'text/event-stream' },
  })
  if (!response.ok || !response.body) {
    throw new ApiError('KK 暂时无法回答，请稍后再试', response.status, 'ASSISTANT_UNAVAILABLE')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value, { stream: !done }).replaceAll('\r\n', '\n')
    const blocks = buffer.split('\n\n')
    buffer = blocks.pop() ?? ''
    for (const block of blocks) {
      let event = 'message'
      const dataLines: string[] = []
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
      }
      if (!dataLines.length) continue
      const payload = JSON.parse(dataLines.join('\n')) as unknown
      if (event === 'sources') handlers.onSources(payload as AssistantSource[])
      if (event === 'delta') handlers.onDelta((payload as { content: string }).content)
      if (event === 'done') handlers.onDone()
      if (event === 'error') {
        throw new ApiError(
          (payload as { message?: string }).message || 'KK 暂时无法回答，请稍后再试',
          response.status,
          'ASSISTANT_UNAVAILABLE',
        )
      }
    }
    if (done) break
  }
}

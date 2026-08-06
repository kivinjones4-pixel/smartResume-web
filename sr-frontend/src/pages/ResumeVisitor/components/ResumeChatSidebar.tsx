import { useEffect, useRef, useState } from 'react'
import { DeleteOutlined, RobotOutlined, SendOutlined } from '@ant-design/icons'
import { Avatar, Button, Input, Spin, Typography } from 'antd'
import { streamPublicResumeChat } from '../../../services/PublicResume'
import type { ResumeAgentHistoryMessage } from '../../../types/PublicResume'
import { getErrorMessage } from '../../../utils/error'

const { Text } = Typography

type ChatItem = ResumeAgentHistoryMessage & {
  id: string
  error?: boolean
}

type ResumeChatSidebarProps = {
  resumeID: string
  enabled: boolean
  welcomeMessage: string
}

const createID = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`

export default function ResumeChatSidebar({
  resumeID,
  enabled,
  welcomeMessage,
}: ResumeChatSidebarProps) {
  const [input, setInput] = useState('')
  const [items, setItems] = useState<ChatItem[]>([])
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [items, streaming])

  const send = async () => {
    const content = input.trim()
    if (!content || !enabled || streaming) return

    const assistantID = createID()
    const history = items
      .filter((item) => item.content && !item.error)
      .map(({ role, content: text }) => ({ role, content: text }))
    setInput('')
    setItems((current) => [
      ...current,
      { id: createID(), role: 'user', content },
      { id: assistantID, role: 'assistant', content: '' },
    ])
    setStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller
    try {
      await streamPublicResumeChat(
        resumeID,
        content,
        history,
        (delta) => setItems((current) => current.map((item) => (
          item.id === assistantID ? { ...item, content: item.content + delta } : item
        ))),
        controller.signal,
      )
    } catch (error) {
      if (!controller.signal.aborted) {
        setItems((current) => current.map((item) => (
          item.id === assistantID
            ? {
                ...item,
                error: true,
                content: item.content || getErrorMessage(error, 'AI 代理暂时无法回答'),
              }
            : item
        )))
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      setStreaming(false)
    }
  }

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-4">
        <Text strong>
          <RobotOutlined className="mr-2 text-indigo-500" />
          简历 AI 代理
        </Text>
        <Text className="mt-1 block! text-xs! text-slate-400!">
          仅依据当前简历公开内容回答
        </Text>
      </div>
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
        <Text className="text-[11px]! text-slate-400!">当前页面会话</Text>
        <Button
          type="text"
          size="small"
          icon={<DeleteOutlined />}
          disabled={!items.length || streaming}
          onClick={() => setItems([])}
        >
          清空
        </Button>
      </div>
      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <div className="flex gap-2">
          <Avatar size={28} icon={<RobotOutlined />} className="bg-indigo-500!" />
          <div className="rounded-xl bg-slate-100 px-3 py-2 text-xs leading-5">
            {welcomeMessage || '你好，可以向我了解这份简历中的经历与能力。'}
          </div>
        </div>
        {items.map((item, index) => (
          <div
            className={`flex gap-2 ${item.role === 'user' ? 'justify-end' : ''}`}
            key={item.id}
          >
            {item.role === 'assistant' && (
              <Avatar size={28} icon={<RobotOutlined />} className="bg-indigo-500!" />
            )}
            <div className={`max-w-[82%] whitespace-pre-wrap rounded-xl px-3 py-2 text-xs leading-5 ${
              item.role === 'user'
                ? 'bg-indigo-500 text-white'
                : item.error
                  ? 'bg-red-50 text-red-600'
                  : 'bg-slate-100'
            }`}>
              {item.content || (streaming && index === items.length - 1 ? <Spin size="small" /> : '')}
            </div>
          </div>
        ))}
      </div>
      <div className="shrink-0 border-t border-slate-100 p-3">
        <div className="flex items-end gap-2">
          <Input.TextArea
            autoSize={{ minRows: 1, maxRows: 4 }}
            value={input}
            disabled={!enabled || streaming}
            placeholder={enabled ? '询问这份简历…' : '简历所有者未启用 AI 问答'}
            onChange={(event) => setInput(event.target.value)}
            onPressEnter={(event) => {
              if (!event.shiftKey) {
                event.preventDefault()
                void send()
              }
            }}
          />
          <Button
            type="primary"
            shape="circle"
            icon={<SendOutlined />}
            loading={streaming}
            disabled={!input.trim() || !enabled}
            onClick={() => void send()}
          />
        </div>
      </div>
    </aside>
  )
}

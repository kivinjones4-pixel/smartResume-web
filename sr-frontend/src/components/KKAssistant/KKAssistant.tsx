import { useEffect, useRef, useState } from 'react'
import {
  CloseOutlined,
  LinkOutlined,
  MessageOutlined,
  RobotOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Input, Spin, Tag, Tooltip } from 'antd'
import { streamAssistantMessage, type AssistantSource } from '../../services/Assistant'
import { useAuth } from '../../store/Auth'
import './KKAssistant.css'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: AssistantSource[]
  error?: boolean
}

const suggestions = [
  'SmartResume 是做什么的？',
  '介绍一下 Kivin',
  '如何创建一份简历？',
  '我的简历数据安全吗？',
]

const createID = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`

export default function KKAssistant() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const previousUserRef = useRef<string | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const userID = user?.id ?? null
    if (previousUserRef.current !== userID) {
      abortRef.current?.abort()
      setMessages([])
      setInput('')
      setStreaming(false)
      if (!userID) setOpen(false)
      previousUserRef.current = userID
    }
  }, [user])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streaming])

  useEffect(() => () => abortRef.current?.abort(), [])

  const send = async (rawMessage?: string) => {
    const content = (rawMessage ?? input).trim()
    if (!content || streaming) return
    const assistantID = createID()
    setInput('')
    setMessages((current) => [
      ...current,
      { id: createID(), role: 'user', content },
      { id: assistantID, role: 'assistant', content: '' },
    ])
    setStreaming(true)
    const controller = new AbortController()
    abortRef.current = controller
    try {
      await streamAssistantMessage(
        content,
        {
          onSources: (sources) =>
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantID ? { ...message, sources } : message,
              ),
            ),
          onDelta: (delta) =>
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantID
                  ? { ...message, content: message.content + delta }
                  : message,
              ),
            ),
          onDone: () => undefined,
        },
        controller.signal,
      )
    } catch (error) {
      if (controller.signal.aborted) return
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantID
            ? {
                ...message,
                error: true,
                content:
                  message.content ||
                  (error instanceof Error ? error.message : 'KK 暂时无法回答，请稍后再试'),
              }
            : message,
        ),
      )
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      setStreaming(false)
    }
  }

  if (!user) return null

  return (
    <>
      <Tooltip title={open ? undefined : '问问 KK'} placement="left">
        <button
          className={`kk-float-button ${open ? 'is-open' : ''}`}
          type="button"
          aria-label={open ? '关闭 KK 助手' : '打开 KK 助手'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <CloseOutlined /> : <RobotOutlined />}
          {!open && <span className="kk-float-dot" />}
        </button>
      </Tooltip>

      {open && (
        <section className="kk-dialog" aria-label="KK 平台助手" aria-live="polite">
          <header className="kk-dialog-header">
            <Avatar className="kk-avatar" icon={<RobotOutlined />} />
            <div>
              <strong>KK 平台助手</strong>
              <span><i /> 在线为你解答</span>
            </div>
            <Button type="text" icon={<CloseOutlined />} onClick={() => setOpen(false)} />
          </header>

          <div className="kk-message-list" ref={listRef}>
            <div className="kk-welcome">
              <Avatar icon={<MessageOutlined />} />
              <div>
                <strong>你好，我是 KK</strong>
                <p>可以问我平台功能、简历使用方法，或者了解开发者 Kivin。</p>
              </div>
            </div>

            {messages.length === 0 && (
              <div className="kk-suggestions">
                <span>你可以这样问</span>
                {suggestions.map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => void send(suggestion)}>
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {messages.map((message, index) => (
              <div className={`kk-message ${message.role}`} key={message.id}>
                {message.role === 'assistant' && <Avatar size={28} icon={<RobotOutlined />} />}
                <div className="kk-message-body">
                  <div className={`kk-bubble ${message.error ? 'is-error' : ''}`}>
                    {message.content || (streaming && index === messages.length - 1 ? <Spin size="small" /> : '')}
                  </div>
                  {!!message.sources?.length && (
                    <div className="kk-sources">
                      <span>参考资料</span>
                      {message.sources.map((source) =>
                        source.source_url ? (
                          <a href={source.source_url} key={source.source_path}>
                            <LinkOutlined /> {source.title}
                          </a>
                        ) : (
                          <Tag key={source.source_path}>{source.title}</Tag>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <footer className="kk-composer">
            <Input.TextArea
              value={input}
              autoSize={{ minRows: 1, maxRows: 4 }}
              maxLength={2000}
              placeholder="问问 KK…"
              disabled={streaming}
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
              disabled={!input.trim()}
              aria-label="发送消息"
              onClick={() => void send()}
            />
            <small>内容由 AI 生成，重要信息请以平台正式说明为准</small>
          </footer>
        </section>
      )}
    </>
  )
}

import { useState } from 'react'
import {
  ArrowLeftOutlined,
  LockOutlined,
  MailOutlined,
  MobileOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Alert, Button, Checkbox, Form, Input, Typography } from 'antd'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

const { Title, Paragraph, Text } = Typography

type LoginForm = {
  identifier: string
  password: string
  remember: boolean
}

type RegisterForm = {
  email: string
  password: string
  confirmPassword: string
  username: string
  agreement: boolean
}

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { user, loading, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const isLogin = mode === 'login'

  if (!loading && user) {
    return <Navigate to="/resume" replace />
  }

  const destination =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/resume'

  const submitLogin = async (values: LoginForm) => {
    setSubmitting(true)
    setError('')
    try {
      await login({ identifier: values.identifier, password: values.password })
      navigate(destination, { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  const submitRegister = async (values: RegisterForm) => {
    setSubmitting(true)
    setError('')
    try {
      await register({
        email: values.email,
        password: values.password,
        username: values.username,
      })
      navigate('/resume', { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '注册失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-[1.05fr_0.95fr] bg-white max-[900px]:grid-cols-1">
      <section className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-[#29264f] via-[#343066] to-[#5b5ce2] px-[8vw] py-10 text-white max-[900px]:hidden">
        <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="absolute right-[-80px] bottom-10 h-96 w-96 rounded-full bg-cyan-300/10 blur-3xl" />
        <Link to="/" className="relative z-10 flex w-fit items-center gap-3 text-xl font-bold text-white">
          <span className="brand-mark">
            <ThunderboltOutlined />
          </span>
          智简 AI
        </Link>
        <div className="relative z-10 my-auto max-w-[520px]">
          <span className="mb-6 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs tracking-wider text-indigo-100">
            AI RESUME BUILDER
          </span>
          <h1 className="m-0 text-[48px] leading-[1.18] font-bold tracking-[-2px]">
            让好经历被看见，
            <br />
            让好机会找到你。
          </h1>
          <p className="mt-6 max-w-[460px] text-base leading-8 text-indigo-100/75">
            智能润色、专业模板与专属数字人，帮你更高效地完成求职展示。
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/15 pt-8">
            {[
              ['AI', '智能内容优化'],
              ['RAG', '专属知识库'],
              ['24h', '数字人在线'],
            ].map(([value, label]) => (
              <div key={value}>
                <b className="block text-2xl">{value}</b>
                <span className="mt-1 block text-xs text-indigo-100/60">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <Text className="relative z-10 text-xs! text-indigo-100/45!">
          © 2026 智简 AI · 你的智能求职伙伴
        </Text>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px]">
          <Link
            to="/"
            className="mb-12 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 min-[901px]:hidden"
          >
            <ArrowLeftOutlined /> 返回首页
          </Link>
          <div className="mb-9">
            <Title level={2} className="mb-2! text-[32px]!">
              {isLogin ? '欢迎回来' : '创建你的账号'}
            </Title>
            <Paragraph className="text-slate-500!">
              {isLogin ? '登录后继续编辑你的智能简历' : '免费注册，开始创建第一份智能简历'}
            </Paragraph>
          </div>

          {error && <Alert className="mb-5" type="error" showIcon message={error} />}

          {isLogin ? (
            <Form<LoginForm>
              layout="vertical"
              size="large"
              requiredMark={false}
              initialValues={{ remember: true }}
              onFinish={submitLogin}
            >
              <Form.Item
                label="邮箱或手机号"
                name="identifier"
                rules={[{ required: true, message: '请输入邮箱或手机号' }]}
              >
                <Input
                  prefix={<MobileOutlined className="text-slate-400" />}
                  placeholder="请输入邮箱或手机号"
                  autoComplete="username"
                />
              </Form.Item>
              <Form.Item
                label="密码"
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-slate-400" />}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
              </Form.Item>
              <div className="mb-6 flex items-center justify-between">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>保持登录</Checkbox>
                </Form.Item>
                <Button type="link" className="px-0!">
                  忘记密码？
                </Button>
              </div>
              <Button block type="primary" htmlType="submit" loading={submitting}>
                登录
              </Button>
              <p className="mt-7 text-center text-sm text-slate-500">
                还没有账号？{' '}
                <Link className="font-semibold text-indigo-600" to="/register">
                  免费注册
                </Link>
              </p>
            </Form>
          ) : (
            <Form<RegisterForm>
              layout="vertical"
              size="large"
              requiredMark={false}
              onFinish={submitRegister}
            >
              <Form.Item
                label="邮箱"
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '邮箱格式不正确' },
                ]}
              >
                <Input
                  prefix={<MailOutlined className="text-slate-400" />}
                  placeholder="name@example.com"
                  autoComplete="email"
                />
              </Form.Item>
              <Form.Item
                label="用户名"
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 2, max: 50, message: '用户名长度为 2–50 个字符' },
                ]}
              >
                <Input
                  prefix={<UserOutlined className="text-slate-400" />}
                  placeholder="你的昵称"
                  autoComplete="username"
                />
              </Form.Item>
              <Form.Item
                label="密码"
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 8, message: '密码至少需要 8 位' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-slate-400" />}
                  placeholder="至少 8 位密码"
                  autoComplete="new-password"
                />
              </Form.Item>
              <Form.Item
                label="确认密码"
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请再次输入密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      return !value || getFieldValue('password') === value
                        ? Promise.resolve()
                        : Promise.reject(new Error('两次输入的密码不一致'))
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-slate-400" />}
                  placeholder="再次输入密码"
                  autoComplete="new-password"
                />
              </Form.Item>
              <Form.Item
                name="agreement"
                valuePropName="checked"
                rules={[
                  {
                    validator: (_, value) =>
                      value
                        ? Promise.resolve()
                        : Promise.reject(new Error('请阅读并同意服务协议')),
                  },
                ]}
              >
                <Checkbox>
                  我已阅读并同意 <Button type="link" className="h-auto! p-0!">服务协议</Button>
                  和 <Button type="link" className="h-auto! p-0!">隐私政策</Button>
                </Checkbox>
              </Form.Item>
              <Button block type="primary" htmlType="submit" loading={submitting}>
                创建账号
              </Button>
              <p className="mt-7 text-center text-sm text-slate-500">
                已有账号？{' '}
                <Link className="font-semibold text-indigo-600" to="/login">
                  直接登录
                </Link>
              </p>
            </Form>
          )}
        </div>
      </section>
    </main>
  )
}

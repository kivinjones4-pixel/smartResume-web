import { useEffect, useState } from 'react'
import {
  CopyOutlined,
  LeftOutlined,
  MessageOutlined,
  QuestionCircleOutlined,
  RightOutlined,
  RobotOutlined,
  SendOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Avatar,
  Button,
  Checkbox,
  Dropdown,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
  type MenuProps,
  type TableColumnsType,
} from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/Auth'
import { getAccessSettings, saveAgentSetting, updateResumeAccess } from '../../services/AccessSetting'
import type { AgentSetting, ResumeAccessRow, Visibility } from '../../types/AccessSetting'
import { getErrorMessage } from '../../utils/error'

const { Text, Title } = Typography
const fieldOptions = [
  ['full_name', '真实姓名'], ['birth_date', '生日'], ['contact_phone', '联系电话'],
  ['contact_email', '联系邮箱'], ['location', '所在城市'], ['github_url', 'GitHub URL'],
  ['website_url', '个人网站 URL'],
] as const
const templateNames: Record<string, string> = { default: '经典简约', professional: '专业商务', creative: '创意设计', traditional: '传统正式' }
const navItems = [
  ['首页', '/'], ['AI 简历', '/resume'], ['访问设置', '/access-settings'], ['平台助手', '/#agents'], ['使用流程', '/#workflow'],
] as const

export default function AccessSettings() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [form] = Form.useForm<AgentSetting>()
  const [rows, setRows] = useState<ResumeAccessRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingAgent, setSavingAgent] = useState(false)
  const [agentCollapsed, setAgentCollapsed] = useState(false)
  const [fieldTarget, setFieldTarget] = useState<ResumeAccessRow | null>(null)
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [fieldSaving, setFieldSaving] = useState(false)
  const [testResumeId, setTestResumeId] = useState<string>()

  useEffect(() => {
    let active = true
    void getAccessSettings().then((data) => {
      if (!active) return
      setRows(data.resumes)
      setTestResumeId((current) => current && data.resumes.some((item) => item.resume_id === current)
        ? current
        : data.resumes[0]?.resume_id)
      form.setFieldsValue(data.agent_setting)
    }).catch((error) => {
      if (active) message.error(getErrorMessage(error, '加载访问设置失败'))
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [form])

  const patchRow = async (resumeId: string, values: Parameters<typeof updateResumeAccess>[1]) => {
    const previous = rows
    setRows((current) => current.map((row) => row.resume_id === resumeId ? { ...row, ...values } : row))
    try {
      const updated = await updateResumeAccess(resumeId, values)
      setRows((current) => current.map((row) => row.resume_id === resumeId ? { ...row, ...updated } : row))
    } catch (error) {
      setRows(previous)
      message.error(getErrorMessage(error, '保存访问设置失败'))
    }
  }

  const saveAgent = async () => {
    const values = await form.validateFields()
    setSavingAgent(true)
    try { form.setFieldsValue(await saveAgentSetting(values)); message.success('AI 代理设置已保存') }
    catch (error) { message.error(getErrorMessage(error, '保存 AI 代理设置失败')) }
    finally { setSavingAgent(false) }
  }

  const columns: TableColumnsType<ResumeAccessRow> = [
    { title: '简历名称', dataIndex: 'title', width: 170, ellipsis: true },
    { title: '求职方向', dataIndex: 'target_position', width: 140, render: (value) => value || <Text type="secondary">未设置</Text> },
    { title: '简历风格', dataIndex: 'template_key', width: 110, render: (value) => <Tag>{templateNames[value] ?? value}</Tag> },
    { title: '访问权限', dataIndex: 'visibility', width: 160, render: (value: Visibility, row) => <Select className="w-34" value={value} options={[{ value: 'private', label: '私密' }, { value: 'public', label: '公开' }, { value: 'restricted', label: '部分用户可访问' }]} onChange={(visibility) => void patchRow(row.resume_id, { visibility })} /> },
    { title: <Space size={5}>专属访客码<Tooltip title="仅“部分用户可访问”时生成。每次从其他权限切换回来都会生成新码，旧码立即失效。"><QuestionCircleOutlined className="text-slate-400" /></Tooltip></Space>, dataIndex: 'visitor_code', width: 135, render: (code: string | null) => code ? <Button type="text" className="font-mono! font-semibold! text-indigo-600!" icon={<CopyOutlined />} onClick={() => void navigator.clipboard.writeText(code).then(() => message.success('访客码已复制'))}>{code}</Button> : <Text type="secondary">—</Text> },
    { title: <Space size={5}>启用 AI 问答<Tooltip title="开启后，访客可针对该简历允许展示的内容提问；未展示字段不会提供给 AI。"><QuestionCircleOutlined className="text-slate-400" /></Tooltip></Space>, dataIndex: 'ai_enabled', width: 125, align: 'center', render: (enabled: boolean, row) => <Switch checked={enabled} disabled={row.visibility === 'private'} onChange={(ai_enabled) => void patchRow(row.resume_id, { ai_enabled })} /> },
    { title: '操作', key: 'action', fixed: 'right', width: 130, render: (_, row) => <Button type="link" className="font-semibold!" onClick={() => { setFieldTarget(row); setSelectedFields(row.visible_fields) }}>展示字段设置</Button> },
  ]

  const userMenu: MenuProps = { items: [{ key: 'profile', label: '个人中心', icon: <UserOutlined /> }, { type: 'divider' }, { key: 'logout', label: '退出登录', danger: true }], onClick: async ({ key }) => { if (key === 'logout') { await logout(); navigate('/login', { replace: true }) } } }

  return <div className="h-screen min-w-300 overflow-hidden bg-[#f5f6fa]">
    <header className="fixed inset-x-0 top-0 z-50 h-18 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-full w-[min(1440px,calc(100%-48px))] items-center">
        <button className="brand" type="button" onClick={() => navigate('/')}><span className="brand-mark"><ThunderboltOutlined /></span><span>智简 AI</span></button>
        <nav className="desktop-nav mx-auto" aria-label="主导航">{navItems.map(([label, path]) => <button className={path === '/access-settings' ? 'nav-active' : ''} type="button" key={label} onClick={() => path.startsWith('/#') ? window.location.href = path : navigate(path)}>{label}</button>)}</nav>
        <Dropdown menu={userMenu}><button className="user-trigger" type="button"><Avatar className="user-avatar">{user?.username.slice(0, 1).toUpperCase()}</Avatar><span>{user?.username}</span></button></Dropdown>
      </div>
    </header>

    <main className={`mt-18 grid h-[calc(100vh-72px)] transition-[grid-template-columns] duration-300 ${agentCollapsed ? 'grid-cols-[300px_0_minmax(760px,1fr)]' : 'grid-cols-[300px_330px_minmax(760px,1fr)]'}`}>
      <aside className="flex min-w-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-5"><Text className="text-xs! text-slate-400!">AI 代理自体验</Text><Title level={5} className="mt-1! mb-0!"><MessageOutlined className="mr-2 text-indigo-500" />测试对话</Title></div>
        <div className="border-b border-slate-100 p-4">
          <Text className="mb-2 block! text-xs! font-medium! text-slate-500!">测试目标简历</Text>
          <Select
            className="w-full"
            value={testResumeId}
            placeholder="请选择简历"
            options={rows.map((row) => ({ value: row.resume_id, label: row.title }))}
            onChange={setTestResumeId}
          />
          <Text className="mt-2 block! text-[11px]! leading-5! text-slate-400!">
            测试时仅使用所选简历允许展示的字段及用户补充信息。
          </Text>
        </div>
        <div className="flex flex-1 flex-col justify-center px-6 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-2xl text-indigo-500"><RobotOutlined /></div><Text strong className="mt-4 block!">对话测试即将开放</Text><Text className="mt-2 text-xs! leading-5! text-slate-400!">后续可在这里以访客视角验证欢迎语、回答风格与信息边界。</Text></div>
        <div className="border-t border-slate-100 p-4"><Input disabled placeholder="输入问题测试 AI 代理" suffix={<SendOutlined />} /></div>
      </aside>

      <aside className={`relative min-w-0 overflow-hidden border-r border-slate-200 bg-white transition-opacity ${agentCollapsed ? 'pointer-events-none opacity-0' : ''}`}>
        <div className="flex h-full w-82.5 flex-col"><div className="flex h-18.5 items-center justify-between border-b border-slate-100 px-5"><div><Text className="text-xs! text-slate-400!">统一配置</Text><Title level={5} className="mt-1! mb-0!"><SettingOutlined className="mr-2 text-indigo-500" />AI 代理设置</Title></div><Tooltip title="收起设置"><Button type="text" icon={<LeftOutlined />} onClick={() => setAgentCollapsed(true)} /></Tooltip></div>
        <Form form={form} layout="vertical" className="agent-settings-form flex-1 overflow-y-auto" initialValues={{ language_style: 'professional', welcome_message: '', additional_info: '' }}>
          <Form.Item label="AI 代理语言风格" name="language_style" rules={[{ required: true }]}><Select options={[{ value: 'professional', label: '专业正式' }, { value: 'friendly', label: '亲切自然' }, { value: 'concise', label: '简洁直接' }, { value: 'enthusiastic', label: '积极热情' }]} /></Form.Item>
          <Form.Item label="AI 欢迎语" name="welcome_message"><Input.TextArea rows={4} maxLength={500} showCount placeholder="你好，可以向我了解这份简历中的经历与能力。" /></Form.Item>
          <Form.Item label="其他补充信息" name="additional_info" extra="仅用于补充回答方式，不应填写不希望对访客公开的隐私信息。"><Input.TextArea rows={7} maxLength={5000} showCount placeholder="例如：回答时重点强调工程实践和协作能力。" /></Form.Item>
        </Form><div className="flex justify-end gap-2 border-t border-slate-100 p-4"><Button onClick={() => form.resetFields()}>取消</Button><Button type="primary" loading={savingAgent} onClick={() => void saveAgent()}>保存</Button></div></div>
      </aside>

      <section className="relative min-w-0 overflow-auto p-6">{agentCollapsed && <Tooltip title="展开 AI 代理设置"><Button className="absolute top-6 left-2 z-10 shadow-sm" icon={<RightOutlined />} onClick={() => setAgentCollapsed(false)} /></Tooltip>}<div className="min-h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-5"><Title level={4} className="mb-1!">简历访问设置</Title><Text className="text-sm! text-slate-500!">分别控制每份简历的访客权限、AI 问答与敏感字段展示范围。</Text></div><Table rowKey="resume_id" loading={loading} columns={columns} dataSource={rows} scroll={{ x: 1070 }} pagination={false} locale={{ emptyText: <Empty description="暂无简历" /> }} /></div></section>
    </main>

    <Modal title="展示字段设置" open={Boolean(fieldTarget)} okText="保存" cancelText="取消" confirmLoading={fieldSaving} onCancel={() => setFieldTarget(null)} onOk={async () => { if (!fieldTarget) return; setFieldSaving(true); await patchRow(fieldTarget.resume_id, { visible_fields: selectedFields }); setFieldSaving(false); setFieldTarget(null) }}><div className="mt-4 rounded-lg bg-indigo-50 p-3 text-sm leading-6 text-indigo-700">这些字段仅在该简历为“公开”或“部分用户可访问”时展示。未勾选字段不会提供给访客，也不应进入 AI 问答上下文；其他经历字段和模块默认展示。</div><Checkbox.Group className="mt-5 grid! grid-cols-2 gap-y-4" value={selectedFields} onChange={(values) => setSelectedFields(values as string[])}>{fieldOptions.map(([value, label]) => <Checkbox key={value} value={value}>{label}</Checkbox>)}</Checkbox.Group></Modal>
  </div>
}

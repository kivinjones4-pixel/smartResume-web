import { useEffect, useState } from 'react'
import { CopyOutlined, QuestionCircleOutlined, SettingOutlined, ThunderboltOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Checkbox, Dropdown, Empty, Form, Input, Modal, Select, Space, Switch, Table, Tag, Tooltip, Typography, message, type MenuProps, type TableColumnsType } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/Auth'
import { getAccessSettings, saveAgentSetting, updateResumeAccess } from '../../services/AccessSetting'
import type { AgentSetting, ResumeAccessRow, Visibility } from '../../types/AccessSetting'
import { getErrorMessage } from '../../utils/error'

const { Text, Title } = Typography
const fields = [['full_name', '真实姓名'], ['birth_date', '生日'], ['contact_phone', '联系电话'], ['contact_email', '联系邮箱'], ['location', '所在城市'], ['github_url', 'GitHub URL'], ['website_url', '个人网站 URL']] as const
const templateNames: Record<string, string> = { default: '经典简约', professional: '专业商务', creative: '创意设计', traditional: '传统正式' }
const navItems = [['首页', '/'], ['AI 简历', '/resume'], ['访问设置', '/access-settings'], ['平台助手', '/#agents'], ['使用流程', '/#workflow']] as const

export default function AccessSettings() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [form] = Form.useForm<AgentSetting>()
  const [rows, setRows] = useState<ResumeAccessRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [target, setTarget] = useState<ResumeAccessRow | null>(null)
  const [selectedFields, setSelectedFields] = useState<string[]>([])

  useEffect(() => {
    let active = true
    void getAccessSettings()
      .then((data) => {
        if (!active) return
        setRows(data.resumes)
        form.setFieldsValue(data.agent_setting)
      })
      .catch((error) => message.error(getErrorMessage(error, '加载访问设置失败')))
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [form])

  const patchRow = async (id: string, values: Parameters<typeof updateResumeAccess>[1]) => {
    try {
      const updated = await updateResumeAccess(id, values)
      setRows((current) => current.map((row) => row.resume_id === id ? { ...row, ...updated } : row))
      return true
    } catch (error) {
      message.error(getErrorMessage(error, '保存访问设置失败'))
      return false
    }
  }

  const saveAgent = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      form.setFieldsValue(await saveAgentSetting(values))
      message.success('AI 代理设置已保存')
    } catch (error) {
      message.error(getErrorMessage(error, '保存 AI 代理设置失败'))
    } finally {
      setSaving(false)
    }
  }

  const saveVisibleFields = async () => {
    if (!target) return
    const saved = await patchRow(target.resume_id, { visible_fields: selectedFields })
    if (saved) setTarget(null)
  }
  const columns: TableColumnsType<ResumeAccessRow> = [
    { title: <Space size={5}>简历名称<Tooltip title="点击简历名称跳转到对应的访客访问页面"><QuestionCircleOutlined className="text-slate-400" /></Tooltip></Space>, dataIndex: 'title', width: 170, ellipsis: true, render: (title, row) => <a className="font-medium text-indigo-600" href={`/resume-visitor/${row.resume_id}`} target="_blank" rel="noreferrer">{title}</a> },
    { title: '求职方向', dataIndex: 'target_position', width: 140, render: (value) => value || <Text type="secondary">未设置</Text> },
    { title: '简历风格', dataIndex: 'template_key', width: 110, render: (value) => <Tag>{templateNames[value] ?? value}</Tag> },
    { title: '访问权限', dataIndex: 'visibility', width: 160, render: (value: Visibility, row) => <Select className="w-34" value={value} options={[{ value: 'private', label: '私密' }, { value: 'public', label: '公开' }, { value: 'restricted', label: '部分用户可访问' }]} onChange={(visibility) => void patchRow(row.resume_id, { visibility })} /> },
    { title: <Space size={5}>专属访客码<Tooltip title="仅部分用户可访问时生成；再次切换回来会生成新码。"><QuestionCircleOutlined /></Tooltip></Space>, dataIndex: 'visitor_code', width: 135, render: (code: string | null) => code ? <Button type="text" icon={<CopyOutlined />} onClick={() => void navigator.clipboard.writeText(code).then(() => message.success('访客码已复制'))}>{code}</Button> : '—' },
    { title: <Space size={5}>启用 AI 问答<Tooltip title="AI 只能读取该简历允许展示的内容。"><QuestionCircleOutlined /></Tooltip></Space>, dataIndex: 'ai_enabled', width: 125, align: 'center', render: (checked: boolean, row) => <Switch checked={checked} onChange={(ai_enabled) => void patchRow(row.resume_id, { ai_enabled })} /> },
    { title: '操作', fixed: 'right', width: 130, render: (_, row) => <Button type="link" className="font-semibold!" onClick={() => { setTarget(row); setSelectedFields(row.visible_fields) }}>展示字段设置</Button> },
  ]
  const userMenu: MenuProps = { items: [{ key: 'profile', label: '个人中心', icon: <UserOutlined /> }, { type: 'divider' }, { key: 'logout', label: '退出登录', danger: true }], onClick: async ({ key }) => { if (key === 'logout') { await logout(); navigate('/login', { replace: true }) } } }

  return <div className="h-screen min-w-280 overflow-hidden bg-[#f5f6fa]">
    <header className="fixed inset-x-0 top-0 z-50 h-18 border-b border-slate-200 bg-white/95"><div className="mx-auto flex h-full w-[min(1440px,calc(100%-48px))] items-center"><button className="brand" type="button" onClick={() => navigate('/')}><span className="brand-mark"><ThunderboltOutlined /></span>智简 AI</button><nav className="desktop-nav mx-auto">{navItems.map(([label, path]) => <button className={path === '/access-settings' ? 'nav-active' : ''} key={label} onClick={() => path.startsWith('/#') ? window.location.href = path : navigate(path)}>{label}</button>)}</nav><Dropdown menu={userMenu}><button className="user-trigger"><Avatar className="user-avatar">{user?.username[0]?.toUpperCase()}</Avatar>{user?.username}</button></Dropdown></div></header>
    <main className="mt-18 grid h-[calc(100vh-72px)] grid-cols-[330px_minmax(760px,1fr)]">
      <aside className="flex min-w-0 flex-col border-r border-slate-200 bg-white"><div className="flex h-18.5 items-center border-b border-slate-100 px-5"><div><Text className="text-xs! text-slate-400!">统一配置</Text><Title level={5} className="mt-1! mb-0!"><SettingOutlined className="mr-2 text-indigo-500" />AI 代理设置</Title></div></div><Form form={form} layout="vertical" className="agent-settings-form flex-1 overflow-y-auto" initialValues={{ language_style: 'professional', welcome_message: '', additional_info: '' }}><Form.Item label="AI 代理语言风格" name="language_style"><Select options={[{ value: 'professional', label: '专业正式' }, { value: 'friendly', label: '亲切自然' }, { value: 'concise', label: '简洁直接' }, { value: 'enthusiastic', label: '积极热情' }]} /></Form.Item><Form.Item label="AI 欢迎语" name="welcome_message"><Input.TextArea rows={4} maxLength={500} showCount /></Form.Item><Form.Item label="其他补充信息" name="additional_info"><Input.TextArea rows={8} maxLength={5000} showCount /></Form.Item></Form><div className="flex justify-end gap-2 border-t border-slate-100 p-4"><Button onClick={() => form.resetFields()}>取消</Button><Button type="primary" loading={saving} onClick={() => void saveAgent()}>保存</Button></div></aside>
      <section className="min-w-0 overflow-auto p-6"><div className="min-h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><Title level={4} className="mb-1!">简历访问设置</Title><Text className="mb-5 block! text-slate-500!">控制访客权限、AI 问答与敏感字段。</Text><Table rowKey="resume_id" loading={loading} columns={columns} dataSource={rows} scroll={{ x: 1070 }} pagination={false} locale={{ emptyText: <Empty description="暂无简历" /> }} /></div></section>
    </main>
    <Modal title="展示字段设置" open={Boolean(target)} onCancel={() => setTarget(null)} onOk={() => void saveVisibleFields()}><div className="mt-4 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700">仅在公开或部分用户可访问时展示；未勾选字段不会提供给 AI。</div><Checkbox.Group className="mt-5 grid! grid-cols-2 gap-y-4" value={selectedFields} onChange={(values) => setSelectedFields(values as string[])}>{fields.map(([value, label]) => <Checkbox value={value} key={value}>{label}</Checkbox>)}</Checkbox.Group></Modal>
  </div>
}

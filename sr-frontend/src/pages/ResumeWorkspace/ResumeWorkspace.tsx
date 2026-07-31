import { useEffect, useMemo, useState } from 'react'
import {
  BankOutlined,
  BookOutlined,
  CloudDownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  FileAddOutlined,
  FileTextOutlined,
  LeftOutlined,
  MenuOutlined,
  MoreOutlined,
  PlusOutlined,
  ProjectOutlined,
  RightOutlined,
  SaveOutlined,
  SettingOutlined,
  SolutionOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Avatar,
  Button,
  Dropdown,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
  type MenuProps,
} from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/Auth'
import { useResumeStore } from '../../store/Resume'
import type { BasicProfileValues, Resume } from '../../types/Resume'
import type { ResumeModuleKey } from '../../types/ResumeWorkspace'
import { getErrorMessage, isFormValidationError } from '../../utils/error'
import EditorForm from './components/EditorForm'
import ResumePaper from './components/ResumePaper'

const { Text, Title } = Typography

const modules: {
  key: ResumeModuleKey
  label: string
  icon: React.ReactNode
  multiple: boolean
}[] = [
  { key: 'profile', label: '基本信息', icon: <UserOutlined />, multiple: false },
  { key: 'education', label: '教育经历', icon: <BookOutlined />, multiple: true },
  { key: 'internship', label: '实习经历', icon: <SolutionOutlined />, multiple: true },
  { key: 'work', label: '工作经历', icon: <BankOutlined />, multiple: true },
  { key: 'project', label: '项目经历', icon: <ProjectOutlined />, multiple: true },
  { key: 'award', label: '获奖记录', icon: <TrophyOutlined />, multiple: true },
]

const records: Record<ResumeModuleKey, string[]> = {
  profile: ['个人基本信息'],
  education: ['华南理工大学 · 本科', '中山大学 · 硕士'],
  internship: ['字节跳动 · 产品实习生', '腾讯 · 产品策划实习生'],
  work: ['智云科技 · 高级产品经理', '星海科技 · 产品经理'],
  project: ['AI 智能简历平台', '企业知识库 Copilot'],
  award: ['全国大学生创新创业大赛金奖', '优秀毕业生'],
}

const navItems = [
  { label: '首页', path: '/' },
  { label: 'AI 简历', path: '/resume' },
  { label: '个人数字人', path: '/#agents' },
  { label: '平台助手', path: '/#agents' },
  { label: '使用流程', path: '/#workflow' },
]

function ResumeWorkspace() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const {
    resumes,
    profile,
    selectedResumeId,
    selectedResume: selectedResumeData,
    loading,
    load,
    selectResume,
    createResume,
    renameResume,
    deleteResume,
    saveBasicProfile,
  } = useResumeStore()
  const [profileForm] = Form.useForm<BasicProfileValues>()
  const [activeModule, setActiveModule] = useState<ResumeModuleKey>('profile')
  const [recordIndex, setRecordIndex] = useState(0)
  const [editorCollapsed, setEditorCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Resume | null>(null)
  const [renameTitle, setRenameTitle] = useState('')
  const [renameSaving, setRenameSaving] = useState(false)

  const currentModule = modules.find((item) => item.key === activeModule) ?? modules[0]
  useEffect(() => {
    void load().catch((error) => message.error(getErrorMessage(error, '加载基本信息失败')))
  }, [load])

  useEffect(() => {
    if (!profile) return
    profileForm.setFieldsValue({
      ...profile,
      birth_date: profile.birth_date?.slice(0, 10) ?? null,
      resume_id: selectedResumeId,
      target_position: selectedResumeData?.target_position ?? '',
    })
  }, [profile, profileForm, selectedResumeData, selectedResumeId])

  const gridTemplate = useMemo(() => {
    const editorWidth = editorCollapsed ? '0px' : '360px'
    const rightWidth = rightCollapsed ? '0px' : '286px'
    return `196px ${editorWidth} minmax(620px, 1fr) ${rightWidth}`
  }, [editorCollapsed, rightCollapsed])

  const userMenu: MenuProps = {
    items: [
      { key: 'resume', label: '我的简历', icon: <FileTextOutlined /> },
      { key: 'profile', label: '个人中心', icon: <UserOutlined /> },
      { type: 'divider' },
      { key: 'logout', label: '退出登录', danger: true },
    ],
    onClick: async ({ key }) => {
      if (key === 'logout') {
        await logout()
        navigate('/login', { replace: true })
      }
    },
  }

  const selectModule = (key: ResumeModuleKey) => {
    setActiveModule(key)
    setRecordIndex(0)
    if (editorCollapsed) setEditorCollapsed(false)
  }

  const handleCreateResume = async () => {
    try {
      await createResume()
      message.success('已新建简历')
    } catch (error) {
      message.error(getErrorMessage(error, '新建简历失败'))
    }
  }

  const handleSave = async () => {
    if (activeModule !== 'profile') {
      message.info('当前模块保存接口将在对应模块开发时接入')
      return
    }
    if (!selectedResumeId) {
      message.warning('请先新建或选择一份简历')
      return
    }
    try {
      const values = await profileForm.validateFields()
      await saveBasicProfile({
        ...values,
        resume_id: selectedResumeId,
        target_position: values.target_position.trim(),
      })
      message.success('基本信息与求职方向已保存')
    } catch (error) {
      if (!isFormValidationError(error)) {
        message.error(getErrorMessage(error, '保存基本信息失败'))
      }
    }
  }

  const openRenameModal = (resume: Resume) => {
    setRenameTarget(resume)
    setRenameTitle(resume.title)
  }

  const handleRenameResume = async () => {
    const title = renameTitle.trim()
    if (!renameTarget || !title) {
      message.warning('请输入简历标题')
      return
    }
    setRenameSaving(true)
    try {
      await renameResume(renameTarget.id, title)
      setRenameTarget(null)
      message.success('简历标题已修改')
    } catch (error) {
      message.error(getErrorMessage(error, '修改简历标题失败'))
    } finally {
      setRenameSaving(false)
    }
  }

  const confirmDeleteResume = (resume: Resume) => {
    Modal.confirm({
      title: '删除这份简历？',
      content: `“${resume.title}”删除后无法恢复，相关版本与导出记录也会一并清理。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteResume(resume.id)
          message.success('简历已删除，列表已刷新')
        } catch (error) {
          message.error(getErrorMessage(error, '删除简历失败'))
          throw error
        }
      },
    })
  }

  return (
    <div className="h-screen min-w-295 overflow-hidden bg-[#f5f6fa]">
      <header className="fixed inset-x-0 top-0 z-50 h-18 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-full w-[min(1440px,calc(100%-48px))] items-center">
          <button
            className="brand"
            type="button"
            onClick={() => navigate('/')}
            aria-label="返回首页"
          >
            <span className="brand-mark">
              <ThunderboltOutlined />
            </span>
            <span>智简 AI</span>
          </button>
          <nav className="desktop-nav mx-auto flex items-center gap-7" aria-label="主导航">
            {navItems.map((item) => (
              <button
                className={item.path === '/resume' ? 'nav-active' : ''}
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.path.startsWith('/#')) {
                    window.location.href = item.path
                  } else {
                    navigate(item.path)
                  }
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <Dropdown menu={userMenu} placement="bottomRight">
            <button className="user-trigger" type="button" aria-label="打开用户菜单">
              <Avatar className="user-avatar">
                {user?.username.slice(0, 1).toUpperCase()}
              </Avatar>
              <span>{user?.username}</span>
            </button>
          </Dropdown>
          <Button
            className="mobile-menu"
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setMobileOpen(!mobileOpen)}
          />
        </div>
      </header>

      <main
        className="relative mt-18 grid h-[calc(100vh-72px)] overflow-hidden transition-[grid-template-columns] duration-300"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        <aside className="z-10 flex min-w-0 flex-col border-r border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-5">
            <Text className="text-xs! font-semibold! tracking-[0.12em]! text-slate-400!">
              简历内容
            </Text>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto p-3">
            {modules.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => selectModule(item.key)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                  activeModule === item.key
                    ? 'bg-indigo-50 font-semibold text-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-lg ${
                    activeModule === item.key ? 'bg-indigo-100' : 'bg-slate-100'
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100 p-3">
            <Button block icon={<SettingOutlined />}>
              简历设置
            </Button>
          </div>
        </aside>

        <section
          className={`relative min-w-0 overflow-hidden border-r border-slate-200 bg-white transition-opacity duration-200 ${
            editorCollapsed ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        >
          <div className="flex h-full w-90 flex-col">
            <div className="flex min-h-18.5 items-center justify-between border-b border-slate-100 px-5">
              <div>
                <Text className="block! text-xs! text-slate-400!">正在编辑</Text>
                <Title level={5} className="mt-1! mb-0!">
                  {currentModule.label}
                </Title>
              </div>
              <Tooltip title="收起编辑区">
                <Button
                  type="text"
                  icon={<LeftOutlined />}
                  onClick={() => setEditorCollapsed(true)}
                />
              </Tooltip>
            </div>

            {currentModule.multiple && (
              <div className="border-b border-slate-100 bg-slate-50/70 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <Text className="text-xs! font-medium! text-slate-500!">选择一条经历</Text>
                  <Button type="link" size="small" icon={<PlusOutlined />}>
                    新增
                  </Button>
                </div>
                <Select
                  className="w-full"
                  value={recordIndex}
                  onChange={setRecordIndex}
                  options={records[activeModule].map((label, index) => ({
                    value: index,
                    label,
                  }))}
                />
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <EditorForm
                moduleKey={activeModule}
                form={profileForm}
                hasSelectedResume={Boolean(selectedResumeData)}
              />
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-white p-4">
              {currentModule.multiple ? (
                <Button danger type="text" icon={<DeleteOutlined />}>
                  删除
                </Button>
              ) : (
                <span />
              )}
              <Space>
                <Button>取消</Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={loading}
                  disabled={activeModule === 'profile' && !selectedResumeData}
                  onClick={handleSave}
                >
                  保存
                </Button>
              </Space>
            </div>
          </div>
        </section>

        <section className="relative min-w-155 overflow-auto bg-[#eef0f5]">
          <div className="sticky top-0 z-10 flex h-13.5 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur">
            <div className="flex items-center gap-2">
              <FileTextOutlined className="text-indigo-500" />
              <Text strong>{selectedResumeData?.title ?? '未选择简历'}</Text>
              <Tag color="green">自动保存</Tag>
            </div>
            <Space>
              <Select
                size="small"
                defaultValue="100"
                options={[
                  { value: '80', label: '80%' },
                  { value: '100', label: '100%' },
                  { value: '120', label: '120%' },
                ]}
              />
              <Button size="small" icon={<SettingOutlined />}>
                页面设置
              </Button>
            </Space>
          </div>

          {rightCollapsed && (
            <div className="pointer-events-none sticky top-16 z-20 flex h-0 justify-end pr-3">
              <Tooltip title="展开简历侧栏">
                <Button
                  className="pointer-events-auto shadow-sm"
                  icon={<LeftOutlined />}
                  onClick={() => setRightCollapsed(false)}
                />
              </Tooltip>
            </div>
          )}

          <div className="flex min-h-[calc(100%-54px)] justify-center p-9">
            {selectedResumeData ? (
              <ResumePaper title={selectedResumeData.title} />
            ) : (
              <div className="grid min-h-150 w-full place-items-center">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="暂无简历，请从右侧新建一份简历"
                >
                  <Button type="primary" icon={<FileAddOutlined />} onClick={handleCreateResume}>
                    新建简历
                  </Button>
                </Empty>
              </div>
            )}
          </div>
        </section>

        <aside
          className={`min-w-0 overflow-hidden border-l border-slate-200 bg-white transition-opacity duration-200 ${
            rightCollapsed ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        >
          <div className="flex h-full w-71.5 flex-col">
            <div className="flex min-h-18.5 items-center justify-between border-b border-slate-100 px-5">
              <div>
                <Text className="block! text-xs! text-slate-400!">简历管理</Text>
                <Title level={5} className="mt-1! mb-0!">
                  我的简历
                </Title>
              </div>
              <Tooltip title="收起简历侧栏">
                <Button
                  type="text"
                  icon={<RightOutlined />}
                  onClick={() => setRightCollapsed(true)}
                />
              </Tooltip>
            </div>

            <div className="border-b border-slate-100 p-4">
              <Button block type="primary" icon={<PlusOutlined />} onClick={handleCreateResume}>
                新建简历
              </Button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectResume(resume.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') selectResume(resume.id)
                  }}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    resume.id === selectedResumeId
                      ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-indigo-200'
                  }`}
                >
                  <div className="mb-3 flex gap-3">
                    <div className="grid h-15.5 w-11.5 shrink-0 place-items-center rounded border border-slate-200 bg-white shadow-sm">
                      <FileTextOutlined className="text-lg text-indigo-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Text strong className="block! truncate! text-sm!">
                        {resume.title}
                      </Text>
                      <Tag className="mt-2! text-[10px]!" color="blue">
                        {resume.template_key}
                      </Tag>
                      <Text className="mt-1 block! text-[10px]! text-slate-400!">
                        {new Date(resume.updated_at).toLocaleDateString('zh-CN')}
                      </Text>
                    </div>
                    <Dropdown
                      trigger={['click']}
                      menu={{
                        items: [
                          { key: 'rename', label: '修改简历标题', icon: <EditOutlined /> },
                          { type: 'divider' },
                          {
                            key: 'delete',
                            label: '删除简历',
                            icon: <DeleteOutlined />,
                            danger: true,
                          },
                        ],
                        onClick: ({ key, domEvent }) => {
                          domEvent.stopPropagation()
                          if (key === 'rename') openRenameModal(resume)
                          if (key === 'delete') confirmDeleteResume(resume)
                        },
                      }}
                    >
                      <Button
                        type="text"
                        size="small"
                        aria-label={`管理简历：${resume.title}`}
                        icon={<MoreOutlined />}
                        onClick={(event) => event.stopPropagation()}
                      />
                    </Dropdown>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-slate-100 p-4">
              <Button block type="primary" icon={<CloudDownloadOutlined />}>
                导出当前简历
              </Button>
              <Button block icon={<TeamOutlined />}>
                发布数字人
              </Button>
            </div>
          </div>
        </aside>
      </main>
      <Modal
        title="修改简历标题"
        open={Boolean(renameTarget)}
        okText="保存"
        cancelText="取消"
        confirmLoading={renameSaving}
        onOk={handleRenameResume}
        onCancel={() => {
          if (!renameSaving) setRenameTarget(null)
        }}
      >
        <Input
          className="mt-4"
          value={renameTitle}
          maxLength={150}
          showCount
          autoFocus
          placeholder="请输入简历标题"
          onChange={(event) => setRenameTitle(event.target.value)}
          onPressEnter={handleRenameResume}
        />
      </Modal>
    </div>
  )
}

export default ResumeWorkspace

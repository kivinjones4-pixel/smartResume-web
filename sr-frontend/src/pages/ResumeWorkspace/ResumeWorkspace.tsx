import { useMemo, useState } from 'react'
import {
  BankOutlined,
  BookOutlined,
  CloudDownloadOutlined,
  DeleteOutlined,
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
  DatePicker,
  Dropdown,
  Empty,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
  type MenuProps,
} from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

const { Text, Title } = Typography
const { TextArea } = Input

type ModuleKey = 'profile' | 'education' | 'internship' | 'work' | 'project' | 'award'

const modules: { key: ModuleKey; label: string; icon: React.ReactNode; multiple: boolean }[] = [
  { key: 'profile', label: '基本信息', icon: <UserOutlined />, multiple: false },
  { key: 'education', label: '教育经历', icon: <BookOutlined />, multiple: true },
  { key: 'internship', label: '实习经历', icon: <SolutionOutlined />, multiple: true },
  { key: 'work', label: '工作经历', icon: <BankOutlined />, multiple: true },
  { key: 'project', label: '项目经历', icon: <ProjectOutlined />, multiple: true },
  { key: 'award', label: '获奖记录', icon: <TrophyOutlined />, multiple: true },
]

const records: Record<ModuleKey, string[]> = {
  profile: ['个人基本信息'],
  education: ['华南理工大学 · 本科', '中山大学 · 硕士'],
  internship: ['字节跳动 · 产品实习生', '腾讯 · 产品策划实习生'],
  work: ['智云科技 · 高级产品经理', '星海科技 · 产品经理'],
  project: ['AI 智能简历平台', '企业知识库 Copilot'],
  award: ['全国大学生创新创业大赛金奖', '优秀毕业生'],
}

const resumes = [
  { id: 'product', name: '高级产品经理求职简历', template: '简约商务', updated: '刚刚更新' },
  { id: 'ai', name: 'AI 产品经理求职简历', template: '现代极简', updated: '昨天更新' },
  { id: 'general', name: '通用中文简历', template: '经典专业', updated: '3 天前更新' },
]

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
  const [activeModule, setActiveModule] = useState<ModuleKey>('profile')
  const [recordIndex, setRecordIndex] = useState(0)
  const [editorCollapsed, setEditorCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const [selectedResume, setSelectedResume] = useState(resumes[0]?.id ?? '')
  const [mobileOpen, setMobileOpen] = useState(false)

  const currentModule = modules.find((item) => item.key === activeModule) ?? modules[0]
  const selectedResumeData = resumes.find((item) => item.id === selectedResume)

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

  const selectModule = (key: ModuleKey) => {
    setActiveModule(key)
    setRecordIndex(0)
    if (editorCollapsed) setEditorCollapsed(false)
  }

  return (
    <div className="h-screen min-w-[1180px] overflow-hidden bg-[#f5f6fa]">
      <header className="fixed inset-x-0 top-0 z-50 h-[72px] border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
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
        className="relative mt-[72px] grid h-[calc(100vh-72px)] overflow-hidden transition-[grid-template-columns] duration-300"
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
          <div className="flex h-full w-[360px] flex-col">
            <div className="flex min-h-[74px] items-center justify-between border-b border-slate-100 px-5">
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
              <EditorForm moduleKey={activeModule} />
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
                <Button type="primary" icon={<SaveOutlined />}>
                  保存
                </Button>
              </Space>
            </div>
          </div>
        </section>

        <section className="relative min-w-[620px] overflow-auto bg-[#eef0f5]">
          {rightCollapsed && (
            <Tooltip title="展开简历侧栏">
              <Button
                className="absolute top-4 right-4 z-20 shadow-sm"
                icon={<LeftOutlined />}
                onClick={() => setRightCollapsed(false)}
              />
            </Tooltip>
          )}

          <div className="sticky top-0 z-10 flex h-[54px] items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur">
            <div className="flex items-center gap-2">
              <FileTextOutlined className="text-indigo-500" />
              <Text strong>{selectedResumeData?.name ?? '未选择简历'}</Text>
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

          <div className="flex min-h-[calc(100%-54px)] justify-center p-9">
            {selectedResumeData ? (
              <ResumePaper title={selectedResumeData.name} />
            ) : (
              <div className="grid min-h-[600px] w-full place-items-center">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="暂无简历，请从右侧新建一份简历"
                >
                  <Button type="primary" icon={<FileAddOutlined />}>
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
          <div className="flex h-full w-[286px] flex-col">
            <div className="flex min-h-[74px] items-center justify-between border-b border-slate-100 px-5">
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
              <Button block type="primary" icon={<PlusOutlined />}>
                新建简历
              </Button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {resumes.map((resume) => (
                <button
                  key={resume.id}
                  type="button"
                  onClick={() => setSelectedResume(resume.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    resume.id === selectedResume
                      ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-indigo-200'
                  }`}
                >
                  <div className="mb-3 flex gap-3">
                    <div className="grid h-[62px] w-[46px] shrink-0 place-items-center rounded border border-slate-200 bg-white shadow-sm">
                      <FileTextOutlined className="text-lg text-indigo-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Text strong className="block! truncate! text-sm!">
                        {resume.name}
                      </Text>
                      <Tag className="mt-2! text-[10px]!" color="blue">
                        {resume.template}
                      </Tag>
                      <Text className="mt-1 block! text-[10px]! text-slate-400!">
                        {resume.updated}
                      </Text>
                    </div>
                    <MoreOutlined className="text-slate-400" />
                  </div>
                </button>
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
    </div>
  )
}

function EditorForm({ moduleKey }: { moduleKey: ModuleKey }) {
  if (moduleKey === 'profile') {
    return (
      <Form layout="vertical" requiredMark={false}>
        <Form.Item label="姓名">
          <Input defaultValue="佳卓" />
        </Form.Item>
        <Form.Item label="求职方向">
          <Input defaultValue="高级产品经理" />
        </Form.Item>
        <div className="grid grid-cols-2 gap-3">
          <Form.Item label="手机号">
            <Input defaultValue="138 0000 0000" />
          </Form.Item>
          <Form.Item label="所在城市">
            <Input defaultValue="深圳" />
          </Form.Item>
        </div>
        <Form.Item label="联系邮箱">
          <Input defaultValue="jiazhuo@example.com" />
        </Form.Item>
        <Form.Item label="个人优势">
          <TextArea
            rows={7}
            defaultValue="6 年互联网产品经验，专注 AI 产品与企业效率工具，具备从用户研究、产品规划到商业化落地的完整经验。"
          />
        </Form.Item>
      </Form>
    )
  }

  const fieldMap: Record<Exclude<ModuleKey, 'profile'>, [string, string, string]> = {
    education: ['学校名称', '华南理工大学', '专业与学历'],
    internship: ['公司名称', '字节跳动', '实习岗位'],
    work: ['公司名称', '智云科技', '工作岗位'],
    project: ['项目名称', 'AI 智能简历平台', '担任角色'],
    award: ['奖项名称', '全国大学生创新创业大赛金奖', '颁发机构'],
  }
  const [nameLabel, nameValue, roleLabel] = fieldMap[moduleKey]

  return (
    <Form layout="vertical" requiredMark={false}>
      <Form.Item label={nameLabel}>
        <Input defaultValue={nameValue} />
      </Form.Item>
      <Form.Item label={roleLabel}>
        <Input defaultValue={moduleKey === 'education' ? '计算机科学 · 本科' : '产品负责人'} />
      </Form.Item>
      <div className="grid grid-cols-2 gap-3">
        <Form.Item label="开始时间">
          <DatePicker picker="month" className="w-full" placeholder="开始时间" />
        </Form.Item>
        <Form.Item label="结束时间">
          <DatePicker picker="month" className="w-full" placeholder="结束时间" />
        </Form.Item>
      </div>
      <Form.Item label="经历描述">
        <TextArea
          rows={8}
          defaultValue="负责核心产品规划与落地，通过用户研究和数据分析持续优化关键路径，推动业务目标高质量达成。"
        />
      </Form.Item>
      <Button block icon={<ThunderboltOutlined />}>
        AI 帮我润色
      </Button>
    </Form>
  )
}

function ResumePaper({ title }: { title: string }) {
  return (
    <article className="min-h-[960px] w-[720px] bg-white px-14 py-12 text-[#343a4a] shadow-[0_8px_30px_rgba(49,54,79,0.12)]">
      <header className="flex items-start justify-between border-b-2 border-indigo-500 pb-7">
        <div>
          <h1 className="m-0 text-[30px] font-bold tracking-wide text-slate-800">佳卓</h1>
          <p className="mt-2 mb-0 text-[14px] font-medium text-indigo-600">高级产品经理</p>
          <p className="mt-3 text-[11px] text-slate-500">
            深圳 · 138 0000 0000 · jiazhuo@example.com
          </p>
        </div>
        <div className="grid h-[72px] w-[72px] place-items-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-500">
          JZ
        </div>
      </header>

      <ResumeSection title="个人优势">
        <p>
          6 年互联网产品经验，专注 AI 产品与企业效率工具，擅长从复杂业务中提炼核心需求，
          具备从用户研究、产品规划到商业化落地的完整经验。
        </p>
      </ResumeSection>
      <ResumeSection title="工作经历">
        <ResumeEntry
          title="智云科技｜高级产品经理"
          time="2022.06 — 至今"
          text="主导智能化产品从 0 到 1 落地，重构核心使用流程，推动业务转化率提升 32%；协同算法、研发和市场团队完成三次关键版本迭代。"
        />
        <ResumeEntry
          title="星海科技｜产品经理"
          time="2019.07 — 2022.05"
          text="负责企业协作产品规划，通过用户分层和数据分析提升重点功能使用率，服务超过 200 家企业客户。"
        />
      </ResumeSection>
      <ResumeSection title="项目经历">
        <ResumeEntry
          title="AI 智能简历与个人数字人平台"
          time="产品负责人"
          text="设计 AI 简历 Copilot 与双 Agent 交互引擎，支持 ATS 优化、实时 Diff、多租户 RAG 检索及流式问答。"
        />
      </ResumeSection>
      <ResumeSection title="教育经历">
        <ResumeEntry
          title="华南理工大学｜计算机科学与技术"
          time="2015.09 — 2019.06"
          text="本科 · 校级优秀毕业生"
        />
      </ResumeSection>
      <footer className="mt-10 border-t border-slate-100 pt-3 text-right text-[9px] text-slate-300">
        {title} · 智简 AI 生成
      </footer>
    </article>
  )
}

function ResumeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-slate-800">
        <span className="h-4 w-1 rounded bg-indigo-500" />
        {title}
      </h2>
      <div className="text-[11px] leading-[1.9] text-slate-600">{children}</div>
    </section>
  )
}

function ResumeEntry({
  title,
  time,
  text,
}: {
  title: string
  time: string
  text: string
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <b className="text-[12px] text-slate-700">{title}</b>
        <span className="text-[10px] text-slate-400">{time}</span>
      </div>
      <p className="mt-1.5 mb-0">{text}</p>
    </div>
  )
}

export default ResumeWorkspace

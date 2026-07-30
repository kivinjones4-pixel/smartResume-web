import { useState } from 'react'
import {
  ArrowRightOutlined,
  BulbOutlined,
  CheckCircleFilled,
  CloudDownloadOutlined,
  FileTextOutlined,
  LoginOutlined,
  MenuOutlined,
  MessageOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Avatar,
  Button,
  Card,
  ConfigProvider,
  Drawer,
  Dropdown,
  Space,
  Tag,
  Typography,
  type MenuProps,
} from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/Auth'
import '../../App.css'

const { Title, Paragraph, Text } = Typography

const navItems = [
  { label: '首页', href: '#home' },
  { label: 'AI 简历', href: '/resume' },
  { label: '个人数字人', href: '#agents' },
  { label: '平台助手', href: '#agents' },
  { label: '使用流程', href: '#workflow' },
]

const features = [
  {
    icon: <FileTextOutlined />,
    title: '智能简历编辑',
    description: '模块化管理教育、工作与项目经历，一份素材灵活组合多套简历。',
    color: 'blue',
  },
  {
    icon: <ThunderboltOutlined />,
    title: 'AI 一键润色',
    description: '优化表达、语法与 ATS 关键词，实时 Diff 对比，每一处修改都由你决定。',
    color: 'purple',
  },
  {
    icon: <RobotOutlined />,
    title: '个人数字人',
    description: '基于你的真实履历构建 AI 分身，全天候回答访客对经历与能力的提问。',
    color: 'cyan',
  },
  {
    icon: <MessageOutlined />,
    title: '平台智能助手',
    description: '快速了解平台功能、获得使用指导，让创建专业简历不再有学习门槛。',
    color: 'orange',
  },
  {
    icon: <CloudDownloadOutlined />,
    title: '多格式导出',
    description: '精美模板一键生成 PDF、Word 与在线简历，适配投递和分享场景。',
    color: 'green',
  },
  {
    icon: <SafetyCertificateOutlined />,
    title: '隐私安全',
    description: '多租户数据隔离与独立知识库，确保你的个人信息安全、检索边界清晰。',
    color: 'geekblue',
  },
]

function App() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const scrollTo = (href: string) => {
    if (href.startsWith('/')) {
      navigate(href)
      setMobileOpen(false)
      return
    }
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
    setMobileOpen(false)
  }

  const userMenu: MenuProps = {
    items: [
      { key: 'resume', label: '我的简历', icon: <FileTextOutlined /> },
      { key: 'profile', label: '个人中心', icon: <UserOutlined /> },
      { type: 'divider' },
      { key: 'logout', label: '退出登录', danger: true, icon: <LoginOutlined /> },
    ],
    onClick: async ({ key }) => {
      if (key === 'logout') await logout()
      if (key === 'resume') navigate('/resume')
    },
  }

  const authArea = user ? (
    <Dropdown menu={userMenu} placement="bottomRight">
      <button className="user-trigger" type="button" aria-label="打开用户菜单">
        <Avatar className="user-avatar">{user.username.slice(0, 1).toUpperCase()}</Avatar>
        <span>{user.username}</span>
      </button>
    </Dropdown>
  ) : (
    <Space size={8}>
      <Button type="text" onClick={() => navigate('/login')}>
        登录
      </Button>
      <Button type="primary" onClick={() => navigate('/register')}>
        免费注册
      </Button>
    </Space>
  )

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#5b5ce2',
          borderRadius: 10,
          fontFamily:
            "'Inter', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif",
        },
      }}
    >
      <div className="site-shell min-h-screen overflow-hidden">
        <header className="topbar fixed inset-x-0 top-0 z-50 h-[72px] border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="topbar-inner mx-auto flex h-full w-[min(1180px,calc(100%-48px))] items-center">
            <button className="brand" type="button" onClick={() => scrollTo('#home')}>
              <span className="brand-mark">
                <ThunderboltOutlined />
              </span>
              <span>智简 AI</span>
            </button>

            <nav className="desktop-nav mx-auto flex items-center gap-7" aria-label="主导航">
              {navItems.map((item) => (
                <button
                  className={item.href === '#home' ? 'nav-active' : ''}
                  key={item.label}
                  type="button"
                  onClick={() => scrollTo(item.href)}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="desktop-auth">{authArea}</div>
            <Button
              className="mobile-menu"
              type="text"
              icon={<MenuOutlined />}
              aria-label="打开导航"
              onClick={() => setMobileOpen(true)}
            />
          </div>
        </header>

        <main>
          <section
            className="hero-section relative grid min-h-[820px] grid-cols-[0.88fr_1.12fr] items-center gap-[70px] px-[max(24px,calc((100vw-1180px)/2))] pt-[150px] pb-[100px] max-[1080px]:grid-cols-1 max-[1080px]:text-center max-sm:min-h-0 max-sm:px-4 max-sm:pt-[115px] max-sm:pb-20"
            id="home"
          >
            <div className="hero-glow hero-glow-one" />
            <div className="hero-glow hero-glow-two" />
            <div className="hero-content relative z-[2]">
              <Tag className="hero-tag" icon={<ThunderboltOutlined />}>
                AI 驱动的下一代求职体验
              </Tag>
              <Title className="hero-title">
                让每一段经历
                <br />
                <span>都成为你的竞争力</span>
              </Title>
              <Paragraph className="hero-copy">
                从智能润色到专属数字人，智简 AI 帮你高效打造专业简历，
                <br className="desktop-break" />
                更自信地展示能力，连接每一个理想机会。
              </Paragraph>
              <Space className="hero-actions" size={14} wrap>
                <Button
                  type="primary"
                  size="large"
                  icon={<ThunderboltOutlined />}
                  onClick={() => navigate(user ? '/resume' : '/register')}
                >
                  免费创建简历
                </Button>
                <Button size="large" onClick={() => scrollTo('#features')}>
                  了解产品 <ArrowRightOutlined />
                </Button>
              </Space>
              <div className="trust-row mt-[26px] flex flex-wrap gap-[22px] text-xs text-slate-500 max-[1080px]:justify-center">
                <span>
                  <CheckCircleFilled /> 免费开始
                </span>
                <span>
                  <CheckCircleFilled /> AI 实时辅助
                </span>
                <span>
                  <CheckCircleFilled /> 数据安全隔离
                </span>
              </div>
            </div>

            <div
              className="resume-preview relative z-[2] min-w-[650px] rounded-[18px] border border-slate-200 bg-white max-[1080px]:mx-auto max-[1080px]:w-full max-[1080px]:max-w-[700px] max-[1080px]:min-w-0"
              aria-label="AI 简历编辑器界面预览"
            >
              <div className="preview-toolbar">
                <div className="window-dots">
                  <i />
                  <i />
                  <i />
                </div>
                <span>产品经理求职简历</span>
                <Tag color="success">已保存</Tag>
              </div>
              <div className="preview-body">
                <aside className="preview-sidebar">
                  <div className="mini-logo">JZ</div>
                  <b>佳卓</b>
                  <span>高级产品经理</span>
                  <div className="side-line wide" />
                  <div className="side-line" />
                  <div className="side-line short" />
                </aside>
                <div className="preview-paper">
                  <div className="paper-heading">
                    <div>
                      <b>工作经历</b>
                      <span>WORK EXPERIENCE</span>
                    </div>
                    <Button size="small" type="primary" ghost icon={<ThunderboltOutlined />}>
                      AI 润色
                    </Button>
                  </div>
                  <div className="experience-row">
                    <div className="timeline-dot" />
                    <div>
                      <b>某科技公司 · 高级产品经理</b>
                      <span>2022.06 — 至今</span>
                      <p>
                        主导智能化产品从 0 到 1 落地，推动核心业务转化率提升
                        <em> 32%</em>。
                      </p>
                    </div>
                  </div>
                  <div className="ai-suggestion">
                    <span className="ai-icon">
                      <BulbOutlined />
                    </span>
                    <div>
                      <b>AI 表达建议</b>
                      <p>增加量化成果与业务影响，让经历更具说服力。</p>
                    </div>
                    <Button type="link" size="small">
                      一键采纳
                    </Button>
                  </div>
                  <div className="paper-heading second">
                    <div>
                      <b>项目经历</b>
                      <span>PROJECT EXPERIENCE</span>
                    </div>
                  </div>
                  <div className="skeleton-row">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              </div>
              <div className="floating-agent">
                <Avatar icon={<RobotOutlined />} />
                <div>
                  <b>个人数字人已上线</b>
                  <span>正在为你讲述项目亮点</span>
                </div>
                <span className="online-dot" />
              </div>
            </div>
          </section>

          <section
            className="section feature-section mx-auto w-[min(1180px,calc(100%-48px))] py-[105px] max-sm:w-[calc(100%-32px)] max-sm:py-[85px]"
            id="features"
          >
            <div className="section-heading mx-auto mb-[54px] max-w-[650px] text-center">
              <span className="eyebrow">核心能力</span>
              <Title level={2}>不止于写简历，更懂如何展示你</Title>
              <Paragraph>
                从内容创作到智能交互，一套工具覆盖求职展示全流程。
              </Paragraph>
            </div>
            <div className="feature-grid grid grid-cols-3 gap-5 max-[860px]:grid-cols-2 max-sm:grid-cols-1">
              {features.map((feature) => (
                <Card className="feature-card" key={feature.title} hoverable>
                  <span className={`feature-icon ${feature.color}`}>{feature.icon}</span>
                  <Title level={4}>{feature.title}</Title>
                  <Paragraph>{feature.description}</Paragraph>
                  <button type="button" onClick={() => scrollTo('#workflow')}>
                    了解更多 <ArrowRightOutlined />
                  </button>
                </Card>
              ))}
            </div>
          </section>

          <section
            className="agent-section grid grid-cols-[1fr_0.9fr] items-center gap-[110px] px-[max(24px,calc((100vw-1050px)/2))] py-[100px] max-[860px]:grid-cols-1 max-[860px]:gap-[55px] max-sm:px-5 max-sm:py-20"
            id="agents"
          >
            <div className="agent-copy">
              <span className="eyebrow light">双 Agent 交互引擎</span>
              <Title level={2}>你的经历，值得被更好地讲述</Title>
              <Paragraph>
                个人数字人理解你的每一段履历，平台助手随时解答产品问题。
                两个 Agent 各司其职，让展示和使用都更自然。
              </Paragraph>
              <div className="agent-points mt-[30px] grid grid-cols-2 gap-[25px] max-sm:grid-cols-1">
                <div>
                  <RobotOutlined />
                  <span>
                    <b>专属知识库</b>
                    基于你的简历内容精准回答
                  </span>
                </div>
                <div>
                  <SafetyCertificateOutlined />
                  <span>
                    <b>严格数据隔离</b>
                    每位用户拥有独立检索空间
                  </span>
                </div>
              </div>
            </div>
            <div className="chat-card">
              <div className="chat-head">
                <Avatar icon={<RobotOutlined />} />
                <div>
                  <b>佳卓的 AI 数字人</b>
                  <span>
                    <i /> 在线
                  </span>
                </div>
              </div>
              <div className="chat-bubble visitor">他最擅长解决什么样的产品问题？</div>
              <div className="chat-bubble agent">
                <ThunderboltOutlined />
                <p>
                  佳卓擅长从复杂业务中提炼核心需求，并推动 AI 产品从 0 到 1
                  落地。在最近的项目中，他通过重构关键流程，将转化率提升了
                  <b> 32%</b>。
                </p>
              </div>
              <div className="chat-input">
                继续了解他的项目经历
                <Button type="primary" shape="circle" icon={<ArrowRightOutlined />} />
              </div>
            </div>
          </section>

          <section
            className="section workflow-section mx-auto w-[min(1180px,calc(100%-48px))] py-[105px] pb-[115px] max-sm:w-[calc(100%-32px)] max-sm:py-[85px]"
            id="workflow"
          >
            <div className="section-heading mx-auto mb-[54px] max-w-[650px] text-center">
              <span className="eyebrow">简单三步</span>
              <Title level={2}>快速开启你的智能求职主页</Title>
            </div>
            <div className="steps grid grid-cols-3 gap-[50px] max-sm:grid-cols-1 max-sm:gap-[42px]">
              {[
                ['01', '填写个人经历', '按模块沉淀教育、工作与项目素材'],
                ['02', 'AI 优化内容', '润色表达并匹配目标岗位关键词'],
                ['03', '导出与分享', '生成专业简历，发布专属数字人'],
              ].map(([number, title, description], index) => (
                <div className="step-item" key={number}>
                  <span>{number}</span>
                  <Title level={4}>{title}</Title>
                  <Paragraph>{description}</Paragraph>
                  {index < 2 && <ArrowRightOutlined className="step-arrow" />}
                </div>
              ))}
            </div>
          </section>

          <section className="cta-section mx-auto mb-20 flex w-[min(1180px,calc(100%-48px))] items-center justify-between rounded-[22px] px-[65px] py-[58px] max-[860px]:gap-[30px] max-[860px]:p-[45px] max-sm:mb-[50px] max-sm:w-[calc(100%-32px)] max-sm:flex-col max-sm:items-start max-sm:p-[25px]">
            <div>
              <Title level={2}>准备好，让机会看见更好的你了吗？</Title>
              <Paragraph>现在注册，免费创建你的第一份 AI 智能简历。</Paragraph>
            </div>
            <Button size="large" onClick={() => navigate(user ? '/resume' : '/register')}>
              立即免费体验 <ArrowRightOutlined />
            </Button>
          </section>
        </main>

        <footer className="mx-auto flex min-h-[110px] w-[min(1180px,calc(100%-48px))] items-center justify-between border-t border-slate-200 py-7 max-[860px]:gap-[25px] max-sm:w-[calc(100%-32px)] max-sm:flex-col max-sm:items-start">
          <div className="footer-brand flex items-center gap-2.5">
            <span className="brand-mark">
              <ThunderboltOutlined />
            </span>
            <b>智简 AI</b>
            <Text>让每一段经历，都成为你的竞争力。</Text>
          </div>
          <Text>© 2026 智简 AI · AI Resume Builder & Agent Studio</Text>
        </footer>

        <Drawer
          title={
            <span className="drawer-brand">
              <span className="brand-mark">
                <ThunderboltOutlined />
              </span>
              智简 AI
            </span>
          }
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          width={300}
        >
          <div className="mobile-nav">
            {navItems.map((item) => (
              <Button key={item.label} type="text" onClick={() => scrollTo(item.href)}>
                {item.label}
              </Button>
            ))}
            <div className="mobile-auth">{authArea}</div>
          </div>
        </Drawer>
      </div>
    </ConfigProvider>
  )
}

export default App

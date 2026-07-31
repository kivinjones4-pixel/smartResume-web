import { useEffect, useMemo, useRef, useState } from 'react'
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
  Segmented,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
  type FormInstance,
  type MenuProps,
} from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/Auth'
import { useResumeStore } from '../../store/Resume'
import {
  attachEducation,
  attachInternship,
  createEducation,
  createInternship,
  deleteEducation,
  deleteInternship,
  detachEducation,
  detachInternship,
  listAllEducations,
  listAllInternships,
  listEducations,
  listInternships,
  updateEducation,
  updateInternship,
} from '../../services/Resume'
import type {
  BasicProfileValues,
  Education,
  EducationFormValues,
  Internship,
  InternshipFormValues,
  Resume,
} from '../../types/Resume'
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

const records: Record<Exclude<ResumeModuleKey, 'education'>, string[]> = {
  profile: ['个人基本信息'],
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
  const educationFormRef = useRef<FormInstance<EducationFormValues>>(null)
  const internshipFormRef = useRef<FormInstance<InternshipFormValues>>(null)
  const [educations, setEducations] = useState<Education[]>([])
  const [currentEducationIds, setCurrentEducationIds] = useState<string[]>([])
  const [educationScope, setEducationScope] = useState<'current' | 'all'>('current')
  const [selectedEducationId, setSelectedEducationId] = useState('')
  const [educationLoading, setEducationLoading] = useState(false)
  const [creatingEducation, setCreatingEducation] = useState(false)
  const [internships, setInternships] = useState<Internship[]>([])
  const [currentInternshipIds, setCurrentInternshipIds] = useState<string[]>([])
  const [internshipScope, setInternshipScope] = useState<'current' | 'all'>('current')
  const [selectedInternshipId, setSelectedInternshipId] = useState('')
  const [internshipLoading, setInternshipLoading] = useState(false)
  const [creatingInternship, setCreatingInternship] = useState(false)
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

  useEffect(() => {
    if (!selectedResumeId) {
      void Promise.resolve().then(() => {
        setEducations([])
        setCurrentEducationIds([])
        setSelectedEducationId('')
        setCreatingEducation(false)
      })
      return
    }
    let cancelled = false
    void Promise.resolve().then(() => {
      if (cancelled) return
      setEducationLoading(true)
      void Promise.all([listAllEducations(), listEducations(selectedResumeId)])
        .then(([allItems, currentItems]) => {
          if (cancelled) return
          const linkedIds = currentItems.map((item) => item.id)
          setEducations(allItems)
          setCurrentEducationIds(linkedIds)
          setSelectedEducationId(currentItems[0]?.id ?? '')
          setEducationScope('current')
          setCreatingEducation(false)
        })
        .catch((error) => {
          if (!cancelled) message.error(getErrorMessage(error, '加载教育经历失败'))
        })
        .finally(() => {
          if (!cancelled) setEducationLoading(false)
        })
    })
    return () => {
      cancelled = true
    }
  }, [selectedResumeId])

  useEffect(() => {
    if (!selectedResumeId) {
      void Promise.resolve().then(() => {
        setInternships([])
        setCurrentInternshipIds([])
        setSelectedInternshipId('')
        setCreatingInternship(false)
      })
      return
    }
    let cancelled = false
    void Promise.resolve().then(() => {
      if (cancelled) return
      setInternshipLoading(true)
      void Promise.all([listAllInternships(), listInternships(selectedResumeId)])
        .then(([allItems, currentItems]) => {
          if (cancelled) return
          const linkedIds = currentItems.map((item) => item.id)
          setInternships(allItems)
          setCurrentInternshipIds(linkedIds)
          setSelectedInternshipId(currentItems[0]?.id ?? '')
          setInternshipScope('current')
          setCreatingInternship(false)
        })
        .catch((error) => {
          if (!cancelled) message.error(getErrorMessage(error, '加载实习经历失败'))
        })
        .finally(() => {
          if (!cancelled) setInternshipLoading(false)
        })
    })
    return () => {
      cancelled = true
    }
  }, [selectedResumeId])

  const currentEducations = educations.filter((education) =>
    currentEducationIds.includes(education.id),
  )
  const visibleEducations = educationScope === 'current' ? currentEducations : educations
  const selectedEducation =
    educations.find((education) => education.id === selectedEducationId) ?? null
  const selectedEducationIsCurrent = selectedEducation
    ? currentEducationIds.includes(selectedEducation.id)
    : false
  const currentInternships = internships.filter((item) =>
    currentInternshipIds.includes(item.id),
  )
  const visibleInternships =
    internshipScope === 'current' ? currentInternships : internships
  const selectedInternship =
    internships.find((item) => item.id === selectedInternshipId) ?? null
  const selectedInternshipIsCurrent = selectedInternship
    ? currentInternshipIds.includes(selectedInternship.id)
    : false

  const reusableExperienceEmpty =
    (activeModule === 'education' &&
      !educationLoading &&
      visibleEducations.length === 0 &&
      !creatingEducation) ||
    (activeModule === 'internship' &&
      !internshipLoading &&
      visibleInternships.length === 0 &&
      !creatingInternship)

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
    if (activeModule === 'internship') {
      if (!selectedResumeId) {
        message.warning('请先新建或选择一份简历')
        return
      }
      try {
        const values = await internshipFormRef.current?.validateFields()
        if (!values) return
        const payload = {
          ...values,
          resume_id: selectedResumeId,
          start_date: `${values.start_date}-01`,
          end_date: values.is_current || !values.end_date ? undefined : `${values.end_date}-01`,
          achievements: (values.achievements ?? '')
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean),
        }
        const saved = creatingInternship
          ? await createInternship(payload)
          : await updateInternship(selectedInternshipId, payload)
        setInternships((current) =>
          creatingInternship
            ? [...current, saved]
            : current.map((item) => (item.id === saved.id ? saved : item)),
        )
        if (creatingInternship) {
          setCurrentInternshipIds((current) =>
            current.includes(saved.id) ? current : [...current, saved.id],
          )
          setInternshipScope('current')
        }
        setSelectedInternshipId(saved.id)
        setCreatingInternship(false)
        message.success(creatingInternship ? '实习经历已新增' : '实习经历已保存')
      } catch (error) {
        if (!isFormValidationError(error)) {
          message.error(getErrorMessage(error, '保存实习经历失败'))
        }
      }
      return
    }
    if (activeModule === 'education') {
      if (!selectedResumeId) {
        message.warning('请先新建或选择一份简历')
        return
      }
      try {
        const values = await educationFormRef.current?.validateFields()
        if (!values) return
        const payload = {
          ...values,
          resume_id: selectedResumeId,
          start_date: `${values.start_date}-01`,
          end_date: values.is_current || !values.end_date ? undefined : `${values.end_date}-01`,
        }
        const saved = creatingEducation
          ? await createEducation(payload)
          : await updateEducation(selectedEducationId, payload)
        setEducations((current) =>
          creatingEducation
            ? [...current, saved]
            : current.map((item) => (item.id === saved.id ? saved : item)),
        )
        if (creatingEducation) {
          setCurrentEducationIds((current) =>
            current.includes(saved.id) ? current : [...current, saved.id],
          )
          setEducationScope('current')
        }
        setSelectedEducationId(saved.id)
        setCreatingEducation(false)
        message.success(creatingEducation ? '教育经历已新增' : '教育经历已保存')
      } catch (error) {
        if (!isFormValidationError(error)) {
          message.error(getErrorMessage(error, '保存教育经历失败'))
        }
      }
      return
    }
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

  const startCreatingEducation = () => {
    if (!selectedResumeId) {
      message.warning('请先新建或选择一份简历')
      return
    }
    setCreatingEducation(true)
    setSelectedEducationId('')
  }

  const cancelEducationEdit = () => {
    setCreatingEducation(false)
    const item = visibleEducations[0]
    setSelectedEducationId(item?.id ?? '')
  }

  const changeEducationScope = (scope: 'current' | 'all') => {
    setEducationScope(scope)
    setCreatingEducation(false)
    const items = scope === 'current' ? currentEducations : educations
    const item = items.find((entry) => entry.id === selectedEducationId) ?? items[0]
    setSelectedEducationId(item?.id ?? '')
  }

  const handleAttachEducation = async () => {
    if (!selectedResumeId || !selectedEducation || selectedEducationIsCurrent) return
    setEducationLoading(true)
    try {
      await attachEducation(selectedResumeId, selectedEducation.id)
      setCurrentEducationIds((current) => [...current, selectedEducation.id])
      message.success('已加入当前简历')
    } catch (error) {
      message.error(getErrorMessage(error, '加入当前简历失败'))
    } finally {
      setEducationLoading(false)
    }
  }

  const handleDetachEducation = async () => {
    if (!selectedResumeId || !selectedEducation || !selectedEducationIsCurrent) return
    setEducationLoading(true)
    try {
      await detachEducation(selectedResumeId, selectedEducation.id)
      const remainingIds = currentEducationIds.filter((id) => id !== selectedEducation.id)
      setCurrentEducationIds(remainingIds)
      const next = educations.find((item) => remainingIds.includes(item.id))
      setSelectedEducationId(next?.id ?? '')
      message.success('已从当前简历移除，经历仍保留在经历库')
    } catch (error) {
      message.error(getErrorMessage(error, '从当前简历移除失败'))
    } finally {
      setEducationLoading(false)
    }
  }

  const confirmDeleteEducation = () => {
    if (!selectedEducation) return
    Modal.confirm({
      title: '删除这条教育经历？',
      content: `“${selectedEducation.school_name}”会从所有关联简历中移除，删除后无法恢复。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteEducation(selectedEducation.id)
          const remaining = educations.filter((item) => item.id !== selectedEducation.id)
          setEducations(remaining)
          setCurrentEducationIds((current) =>
            current.filter((id) => id !== selectedEducation.id),
          )
          const next =
            educationScope === 'current'
              ? remaining.find((item) => currentEducationIds.includes(item.id))
              : remaining[0]
          setSelectedEducationId(next?.id ?? '')
          message.success('教育经历已删除')
        } catch (error) {
          message.error(getErrorMessage(error, '删除教育经历失败'))
          throw error
        }
      },
    })
  }

  const startCreatingInternship = () => {
    if (!selectedResumeId) {
      message.warning('请先新建或选择一份简历')
      return
    }
    setCreatingInternship(true)
    setSelectedInternshipId('')
  }

  const cancelInternshipEdit = () => {
    setCreatingInternship(false)
    const item = visibleInternships[0]
    setSelectedInternshipId(item?.id ?? '')
  }

  const changeInternshipScope = (scope: 'current' | 'all') => {
    setInternshipScope(scope)
    setCreatingInternship(false)
    const items = scope === 'current' ? currentInternships : internships
    const item = items.find((entry) => entry.id === selectedInternshipId) ?? items[0]
    setSelectedInternshipId(item?.id ?? '')
  }

  const handleAttachInternship = async () => {
    if (!selectedResumeId || !selectedInternship || selectedInternshipIsCurrent) return
    setInternshipLoading(true)
    try {
      await attachInternship(selectedResumeId, selectedInternship.id)
      setCurrentInternshipIds((current) => [...current, selectedInternship.id])
      message.success('已加入当前简历')
    } catch (error) {
      message.error(getErrorMessage(error, '加入当前简历失败'))
    } finally {
      setInternshipLoading(false)
    }
  }

  const handleDetachInternship = async () => {
    if (!selectedResumeId || !selectedInternship || !selectedInternshipIsCurrent) return
    setInternshipLoading(true)
    try {
      await detachInternship(selectedResumeId, selectedInternship.id)
      const remainingIds = currentInternshipIds.filter((id) => id !== selectedInternship.id)
      setCurrentInternshipIds(remainingIds)
      const next = internships.find((item) => remainingIds.includes(item.id))
      setSelectedInternshipId(next?.id ?? '')
      message.success('已从当前简历移除，经历仍保留在经历库')
    } catch (error) {
      message.error(getErrorMessage(error, '从当前简历移除失败'))
    } finally {
      setInternshipLoading(false)
    }
  }

  const confirmDeleteInternship = () => {
    if (!selectedInternship) return
    Modal.confirm({
      title: '永久删除这条实习经历？',
      content: `“${selectedInternship.company_name} · ${selectedInternship.position_title}”会从所有关联简历中移除，删除后无法恢复。`,
      okText: '永久删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteInternship(selectedInternship.id)
          const remaining = internships.filter((item) => item.id !== selectedInternship.id)
          setInternships(remaining)
          setCurrentInternshipIds((current) =>
            current.filter((id) => id !== selectedInternship.id),
          )
          const next =
            internshipScope === 'current'
              ? remaining.find((item) => currentInternshipIds.includes(item.id))
              : remaining[0]
          setSelectedInternshipId(next?.id ?? '')
          message.success('实习经历已永久删除')
        } catch (error) {
          message.error(getErrorMessage(error, '删除实习经历失败'))
          throw error
        }
      },
    })
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

            {currentModule.multiple &&
              activeModule !== 'education' &&
              activeModule !== 'internship' && (
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
                  options={records[activeModule as Exclude<ResumeModuleKey, 'education'>].map((label, index) => ({
                    value: index,
                    label,
                  }))}
                />
              </div>
            )}

            {activeModule === 'education' && (
              <div className="border-b border-slate-100 bg-slate-50/70 p-4">
                <Segmented
                  block
                  className="mb-3"
                  value={educationScope}
                  onChange={(value) => changeEducationScope(value as 'current' | 'all')}
                  options={[
                    { value: 'current', label: `当前简历 ${currentEducations.length}` },
                    { value: 'all', label: `全部经历 ${educations.length}` },
                  ]}
                />
                <div className="mb-2 flex items-center justify-between">
                  <Text className="text-xs! text-slate-500!">
                    {educationScope === 'current'
                      ? '本简历采用的教育经历'
                      : '个人经历库，可在多份简历中复用'}
                  </Text>
                  <Button
                    type="link"
                    size="small"
                    icon={<PlusOutlined />}
                    disabled={!selectedResumeId}
                    onClick={startCreatingEducation}
                  >
                    新增
                  </Button>
                </div>
                {visibleEducations.length > 0 && !creatingEducation && (
                  <Select
                    className="w-full"
                    value={selectedEducationId}
                    loading={educationLoading}
                    onChange={(value) => {
                      setCreatingEducation(false)
                      setSelectedEducationId(value)
                    }}
                    options={visibleEducations.map((education) => ({
                      value: education.id,
                      label: `${[education.school_name, education.degree]
                        .filter(Boolean)
                        .join(' · ')}${
                        educationScope === 'all' &&
                        currentEducationIds.includes(education.id)
                          ? '（已加入）'
                          : ''
                      }`,
                    }))}
                  />
                )}
                {educationScope === 'all' && selectedEducation && !creatingEducation && (
                  <Button
                    block
                    className="mt-3"
                    type={selectedEducationIsCurrent ? 'default' : 'primary'}
                    disabled={selectedEducationIsCurrent}
                    icon={selectedEducationIsCurrent ? undefined : <PlusOutlined />}
                    onClick={handleAttachEducation}
                  >
                    {selectedEducationIsCurrent ? '已加入当前简历' : '加入当前简历'}
                  </Button>
                )}
                {creatingEducation && (
                  <Text className="text-sm! text-indigo-600!">
                    新增教育经历（保存后自动加入当前简历）
                  </Text>
                )}
              </div>
            )}

            {activeModule === 'internship' && (
              <div className="border-b border-slate-100 bg-slate-50/70 p-4">
                <Segmented
                  block
                  className="mb-3"
                  value={internshipScope}
                  onChange={(value) => changeInternshipScope(value as 'current' | 'all')}
                  options={[
                    { value: 'current', label: `当前简历 ${currentInternships.length}` },
                    { value: 'all', label: `全部经历 ${internships.length}` },
                  ]}
                />
                <div className="mb-2 flex items-center justify-between">
                  <Text className="text-xs! text-slate-500!">
                    {internshipScope === 'current'
                      ? '本简历采用的实习经历'
                      : '个人经历库，可在多份简历中复用'}
                  </Text>
                  <Button
                    type="link"
                    size="small"
                    icon={<PlusOutlined />}
                    disabled={!selectedResumeId}
                    onClick={startCreatingInternship}
                  >
                    新增
                  </Button>
                </div>
                {visibleInternships.length > 0 && !creatingInternship && (
                  <Select
                    className="w-full"
                    value={selectedInternshipId}
                    loading={internshipLoading}
                    onChange={(value) => {
                      setCreatingInternship(false)
                      setSelectedInternshipId(value)
                    }}
                    options={visibleInternships.map((item) => ({
                      value: item.id,
                      label: `${item.company_name} · ${item.position_title}${
                        internshipScope === 'all' &&
                        currentInternshipIds.includes(item.id)
                          ? '（已加入）'
                          : ''
                      }`,
                    }))}
                  />
                )}
                {internshipScope === 'all' &&
                  selectedInternship &&
                  !creatingInternship && (
                    <Button
                      block
                      className="mt-3"
                      type={selectedInternshipIsCurrent ? 'default' : 'primary'}
                      disabled={selectedInternshipIsCurrent}
                      icon={selectedInternshipIsCurrent ? undefined : <PlusOutlined />}
                      onClick={handleAttachInternship}
                    >
                      {selectedInternshipIsCurrent ? '已加入当前简历' : '加入当前简历'}
                    </Button>
                  )}
                {creatingInternship && (
                  <Text className="text-sm! text-indigo-600!">
                    新增实习经历（保存后自动加入当前简历）
                  </Text>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {reusableExperienceEmpty ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    activeModule === 'education'
                      ? educationScope === 'current' && educations.length > 0
                        ? '当前简历还没有教育经历，可从经历库中选择'
                        : '还没有教育经历，创建后可在多份简历中复用'
                      : internshipScope === 'current' && internships.length > 0
                        ? '当前简历还没有实习经历，可从经历库中选择'
                        : '还没有实习经历，创建后可在多份简历中复用'
                  }
                >
                  <Space direction="vertical">
                    {((activeModule === 'education' &&
                      educationScope === 'current' &&
                      educations.length > 0) ||
                      (activeModule === 'internship' &&
                        internshipScope === 'current' &&
                        internships.length > 0)) && (
                      <Button
                        type="primary"
                        onClick={() =>
                          activeModule === 'education'
                            ? changeEducationScope('all')
                            : changeInternshipScope('all')
                        }
                      >
                        从经历库添加
                      </Button>
                    )}
                    <Button
                      type={
                        (activeModule === 'education' ? educations : internships).length === 0
                          ? 'primary'
                          : 'default'
                      }
                      icon={<PlusOutlined />}
                      disabled={!selectedResumeId}
                      onClick={
                        activeModule === 'education'
                          ? startCreatingEducation
                          : startCreatingInternship
                      }
                    >
                      新增{activeModule === 'education' ? '教育' : '实习'}经历
                    </Button>
                  </Space>
                </Empty>
              ) : (
                <>
                  {activeModule === 'education' && selectedEducation && !creatingEducation && (
                    <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
                      修改经历内容会同步影响所有使用该经历的简历。
                    </div>
                  )}
                  {activeModule === 'internship' &&
                    selectedInternship &&
                    !creatingInternship && (
                      <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
                        修改经历内容会同步影响所有使用该经历的简历。
                      </div>
                    )}
                  <EditorForm
                    moduleKey={activeModule}
                    form={profileForm}
                    educationFormRef={educationFormRef}
                    internshipFormRef={internshipFormRef}
                    educationFormKey={
                      creatingEducation ? 'education-new' : `education-${selectedEducationId}`
                    }
                    educationInitialValues={
                      creatingEducation || !selectedEducation
                        ? { is_current: false }
                        : {
                            school_name: selectedEducation.school_name,
                            degree: selectedEducation.degree ?? '',
                            field_of_study: selectedEducation.field_of_study ?? '',
                            location: selectedEducation.location ?? '',
                            start_date: selectedEducation.start_date?.slice(0, 7) ?? '',
                            end_date: selectedEducation.end_date?.slice(0, 7) ?? '',
                            is_current: selectedEducation.is_current,
                            gpa: selectedEducation.gpa ?? '',
                            description: selectedEducation.description ?? '',
                          }
                    }
                    internshipFormKey={
                      creatingInternship
                        ? 'internship-new'
                        : `internship-${selectedInternshipId}`
                    }
                    internshipInitialValues={
                      creatingInternship || !selectedInternship
                        ? { is_current: false }
                        : {
                            company_name: selectedInternship.company_name,
                            position_title: selectedInternship.position_title,
                            department: selectedInternship.department ?? '',
                            location: selectedInternship.location ?? '',
                            start_date: selectedInternship.start_date?.slice(0, 7) ?? '',
                            end_date: selectedInternship.end_date?.slice(0, 7) ?? '',
                            is_current: selectedInternship.is_current,
                            achievements: (selectedInternship.achievements ?? []).join('\n'),
                            description: selectedInternship.description ?? '',
                          }
                    }
                    hasSelectedResume={Boolean(selectedResumeData)}
                  />
                </>
              )}
            </div>

            {!reusableExperienceEmpty && <div className="flex items-center justify-between border-t border-slate-100 bg-white p-4">
              {currentModule.multiple ? (
                <Button
                  type="text"
                  disabled={
                    (activeModule === 'education' && !selectedEducation) ||
                    (activeModule === 'internship' && !selectedInternship)
                  }
                  danger={
                    (activeModule === 'education' && educationScope === 'all') ||
                    (activeModule === 'internship' && internshipScope === 'all') ||
                    (activeModule !== 'education' && activeModule !== 'internship')
                  }
                  icon={<DeleteOutlined />}
                  onClick={
                    activeModule === 'education'
                      ? educationScope === 'current'
                        ? handleDetachEducation
                        : confirmDeleteEducation
                      : activeModule === 'internship'
                        ? internshipScope === 'current'
                          ? handleDetachInternship
                          : confirmDeleteInternship
                        : undefined
                  }
                >
                  {activeModule === 'education'
                    ? educationScope === 'current'
                      ? '移出简历'
                      : '永久删除'
                    : activeModule === 'internship'
                      ? internshipScope === 'current'
                        ? '移出简历'
                        : '永久删除'
                      : '删除'}
                </Button>
              ) : (
                <span />
              )}
              <Space>
                <Button
                  onClick={
                    activeModule === 'education'
                      ? cancelEducationEdit
                      : activeModule === 'internship'
                        ? cancelInternshipEdit
                        : undefined
                  }
                >
                  取消
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={loading || educationLoading || internshipLoading}
                  disabled={
                    (activeModule === 'profile' && !selectedResumeData) ||
                    (activeModule === 'education' && !selectedEducation && !creatingEducation) ||
                    (activeModule === 'internship' &&
                      !selectedInternship &&
                      !creatingInternship)
                  }
                  onClick={handleSave}
                >
                  保存
                </Button>
              </Space>
            </div>}
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

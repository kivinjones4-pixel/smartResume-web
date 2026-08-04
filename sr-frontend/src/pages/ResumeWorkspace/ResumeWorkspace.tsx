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
  Drawer,
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
  attachAward,
  attachEducation,
  attachInternship,
  attachProjectExperience,
  attachWorkExperience,
  createEducation,
  createAward,
  createInternship,
  createProjectExperience,
  createWorkExperience,
  deleteEducation,
  deleteAward,
  deleteInternship,
  deleteProjectExperience,
  deleteWorkExperience,
  detachEducation,
  detachAward,
  detachInternship,
  detachProjectExperience,
  detachWorkExperience,
  listAllEducations,
  listAllAwards,
  listAllInternships,
  listEducations,
  listAwards,
  listInternships,
  listAllProjectExperiences,
  listAllWorkExperiences,
  listProjectExperiences,
  listWorkExperiences,
  updateEducation,
  updateAward,
  updateInternship,
  updateProjectExperience,
  updateWorkExperience,
} from '../../services/Resume'
import type {
  Award,
  AwardFormValues,
  BasicProfileValues,
  Education,
  EducationFormValues,
  Internship,
  InternshipFormValues,
  ProjectExperience,
  ProjectFormValues,
  Resume,
  WorkExperience,
  WorkFormValues,
} from '../../types/Resume'
import type { ResumeModuleKey } from '../../types/ResumeWorkspace'
import { getErrorMessage, isFormValidationError } from '../../utils/error'
import {
  polishResumeRecord,
  polishWholeResume,
  type PolishableModule,
  type PolishSuggestion,
  type ResumePolishItem,
} from '../../services/Polish'
import EditorForm from './components/EditorForm'
import ResumePaper from './components/ResumePaper'
import { RESUME_TEMPLATES, type ResumeTemplateKey } from './components/ResumeTemplates'

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

const records: Record<Exclude<ResumeModuleKey, 'education' | 'internship' | 'work' | 'project' | 'award'>, string[]> = {
  profile: ['个人基本信息'],
}

const navItems = [
  { label: '首页', path: '/' },
  { label: 'AI 简历', path: '/resume' },
  { label: '个人数字人', path: '/#agents' },
  { label: '平台助手', path: '/#agents' },
  { label: '使用流程', path: '/#workflow' },
]

const toAPIDate = (value: string | null) => value?.slice(0, 10) ?? ''

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
    updateResumeTemplate,
    deleteResume,
    saveBasicProfile,
  } = useResumeStore()
  const [profileForm] = Form.useForm<BasicProfileValues>()
  const educationFormRef = useRef<FormInstance<EducationFormValues>>(null)
  const internshipFormRef = useRef<FormInstance<InternshipFormValues>>(null)
  const workFormRef = useRef<FormInstance<WorkFormValues>>(null)
  const projectFormRef = useRef<FormInstance<ProjectFormValues>>(null)
  const awardFormRef = useRef<FormInstance<AwardFormValues>>(null)
  const selectedResumeIdRef = useRef(selectedResumeId)
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
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([])
  const [currentWorkIds, setCurrentWorkIds] = useState<string[]>([])
  const [workScope, setWorkScope] = useState<'current' | 'all'>('current')
  const [selectedWorkId, setSelectedWorkId] = useState('')
  const [workLoading, setWorkLoading] = useState(false)
  const [creatingWork, setCreatingWork] = useState(false)
  const [projectExperiences, setProjectExperiences] = useState<ProjectExperience[]>([])
  const [currentProjectIds, setCurrentProjectIds] = useState<string[]>([])
  const [projectScope, setProjectScope] = useState<'current' | 'all'>('current')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [projectLoading, setProjectLoading] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)
  const [awards, setAwards] = useState<Award[]>([])
  const [currentAwardIds, setCurrentAwardIds] = useState<string[]>([])
  const [awardScope, setAwardScope] = useState<'current' | 'all'>('current')
  const [selectedAwardId, setSelectedAwardId] = useState('')
  const [awardLoading, setAwardLoading] = useState(false)
  const [creatingAward, setCreatingAward] = useState(false)
  const [activeModule, setActiveModule] = useState<ResumeModuleKey>('profile')
  const [recordIndex, setRecordIndex] = useState(0)
  const [editorCollapsed, setEditorCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Resume | null>(null)
  const [renameTitle, setRenameTitle] = useState('')
  const [renameSaving, setRenameSaving] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [newResumeTitle, setNewResumeTitle] = useState('未命名简历')
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<ResumeTemplateKey>('default')
  const [templateSaving, setTemplateSaving] = useState(false)
  const [polishing, setPolishing] = useState(false)
  const [polishGeneratedKey, setPolishGeneratedKey] = useState('')
  const [wholeResumePolishing, setWholeResumePolishing] = useState(false)
  const [polishSuggestions, setPolishSuggestions] = useState<PolishSuggestion[]>([])
  const [suggestionResumeId, setSuggestionResumeId] = useState('')
  const [suggestionDrawerOpen, setSuggestionDrawerOpen] = useState(false)
  const [acceptingSuggestionId, setAcceptingSuggestionId] = useState('')

  const currentModule = modules.find((item) => item.key === activeModule) ?? modules[0]
  const currentPolishKey = `${activeModule}:${
    activeModule === 'education'
      ? creatingEducation ? 'new' : selectedEducationId
      : activeModule === 'internship'
        ? creatingInternship ? 'new' : selectedInternshipId
        : activeModule === 'work'
          ? creatingWork ? 'new' : selectedWorkId
          : activeModule === 'project'
            ? creatingProject ? 'new' : selectedProjectId
            : activeModule === 'award'
              ? creatingAward ? 'new' : selectedAwardId
              : 'profile'
  }`
  const visiblePolishSuggestions = suggestionResumeId === selectedResumeId ? polishSuggestions : []
  const currentTemplateKey: ResumeTemplateKey = RESUME_TEMPLATES.some(
    (template) => template.key === selectedResumeData?.template_key,
  )
    ? (selectedResumeData?.template_key as ResumeTemplateKey)
    : 'default'
  const createPreviewResume: Resume = selectedResumeData
    ? { ...selectedResumeData, title: newResumeTitle, template_key: selectedTemplateKey }
    : {
        id: 'template-preview',
        title: newResumeTitle,
        target_position: null,
        target_company: null,
        template_key: selectedTemplateKey,
        language_code: 'zh-CN',
        status: 'draft',
        is_default: false,
        created_at: '',
        updated_at: '',
      }
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
    selectedResumeIdRef.current = selectedResumeId
  }, [selectedResumeId])

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
        setWorkExperiences([])
        setCurrentWorkIds([])
        setSelectedWorkId('')
        setCreatingWork(false)
      })
      return
    }
    let cancelled = false
    void Promise.resolve().then(() => {
      if (cancelled) return
      setWorkLoading(true)
      void Promise.all([listAllWorkExperiences(), listWorkExperiences(selectedResumeId)])
        .then(([allItems, currentItems]) => {
          if (cancelled) return
          setWorkExperiences(allItems)
          setCurrentWorkIds(currentItems.map((item) => item.id))
          setSelectedWorkId(currentItems[0]?.id ?? '')
          setWorkScope('current')
          setCreatingWork(false)
        })
        .catch((error) => {
          if (!cancelled) message.error(getErrorMessage(error, '加载工作经历失败'))
        })
        .finally(() => {
          if (!cancelled) setWorkLoading(false)
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

  useEffect(() => {
    if (!selectedResumeId) {
      void Promise.resolve().then(() => {
        setProjectExperiences([])
        setCurrentProjectIds([])
        setSelectedProjectId('')
        setCreatingProject(false)
      })
      return
    }
    let cancelled = false
    void Promise.resolve().then(() => {
      if (cancelled) return
      setProjectLoading(true)
      void Promise.all([
        listAllProjectExperiences(),
        listProjectExperiences(selectedResumeId),
      ])
        .then(([allItems, currentItems]) => {
          if (cancelled) return
          setProjectExperiences(allItems)
          setCurrentProjectIds(currentItems.map((item) => item.id))
          setSelectedProjectId(currentItems[0]?.id ?? '')
          setProjectScope('current')
          setCreatingProject(false)
        })
        .catch((error) => {
          if (!cancelled) message.error(getErrorMessage(error, '加载项目经历失败'))
        })
        .finally(() => {
          if (!cancelled) setProjectLoading(false)
        })
    })
    return () => {
      cancelled = true
    }
  }, [selectedResumeId])

  useEffect(() => {
    if (!selectedResumeId) {
      void Promise.resolve().then(() => {
        setAwards([])
        setCurrentAwardIds([])
        setSelectedAwardId('')
        setCreatingAward(false)
      })
      return
    }
    let cancelled = false
    void Promise.resolve().then(() => {
      if (cancelled) return
      setAwardLoading(true)
      void Promise.all([listAllAwards(), listAwards(selectedResumeId)])
        .then(([allItems, currentItems]) => {
          if (cancelled) return
          setAwards(allItems)
          setCurrentAwardIds(currentItems.map((item) => item.id))
          setSelectedAwardId(currentItems[0]?.id ?? '')
          setAwardScope('current')
          setCreatingAward(false)
        })
        .catch((error) => {
          if (!cancelled) message.error(getErrorMessage(error, '加载获奖记录失败'))
        })
        .finally(() => {
          if (!cancelled) setAwardLoading(false)
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
  const currentWorkExperiences = workExperiences.filter((item) =>
    currentWorkIds.includes(item.id),
  )
  const visibleWorkExperiences =
    workScope === 'current' ? currentWorkExperiences : workExperiences
  const selectedWork =
    workExperiences.find((item) => item.id === selectedWorkId) ?? null
  const selectedWorkIsCurrent = selectedWork ? currentWorkIds.includes(selectedWork.id) : false
  const currentProjectExperiences = projectExperiences.filter((item) =>
    currentProjectIds.includes(item.id),
  )
  const visibleProjectExperiences =
    projectScope === 'current' ? currentProjectExperiences : projectExperiences
  const selectedProject =
    projectExperiences.find((item) => item.id === selectedProjectId) ?? null
  const selectedProjectIsCurrent = selectedProject
    ? currentProjectIds.includes(selectedProject.id)
    : false
  const currentAwards = awards.filter((item) => currentAwardIds.includes(item.id))
  const visibleAwards = awardScope === 'current' ? currentAwards : awards
  const selectedAward = awards.find((item) => item.id === selectedAwardId) ?? null
  const selectedAwardIsCurrent = selectedAward
    ? currentAwardIds.includes(selectedAward.id)
    : false

  const reusableExperienceEmpty =
    (activeModule === 'education' &&
      !educationLoading &&
      visibleEducations.length === 0 &&
      !creatingEducation) ||
    (activeModule === 'internship' &&
      !internshipLoading &&
      visibleInternships.length === 0 &&
      !creatingInternship) ||
    (activeModule === 'work' &&
      !workLoading &&
      visibleWorkExperiences.length === 0 &&
      !creatingWork) ||
    (activeModule === 'project' &&
      !projectLoading &&
      visibleProjectExperiences.length === 0 &&
      !creatingProject) ||
    (activeModule === 'award' &&
      !awardLoading &&
      visibleAwards.length === 0 &&
      !creatingAward)

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
    setPolishGeneratedKey('')
    if (editorCollapsed) setEditorCollapsed(false)
  }

  const handlePolish = async () => {
    if (activeModule === 'profile') return
    const form =
      activeModule === 'education'
        ? educationFormRef.current
        : activeModule === 'internship'
          ? internshipFormRef.current
          : activeModule === 'work'
            ? workFormRef.current
            : activeModule === 'project'
              ? projectFormRef.current
              : awardFormRef.current
    if (!form) return

    const values = form.getFieldsValue(true) as Record<string, unknown>
    const fields =
      activeModule === 'education' || activeModule === 'award'
        ? ['description']
        : ['achievements', 'description']
    const content = Object.fromEntries(
      fields.map((field) => [field, String(values[field] ?? '').trim()]).filter(([, value]) => value),
    )
    if (Object.keys(content).length === 0) {
      message.warning('请先填写需要润色的描述或成就')
      return
    }
    const excludedFields = new Set([...fields, 'start_date', 'end_date', 'is_current'])
    const context = Object.fromEntries(
      Object.entries(values)
        .filter(([field, value]) => !excludedFields.has(field) && typeof value === 'string' && value.trim())
        .map(([field, value]) => [field, String(value).trim()]),
    )

    setPolishing(true)
    setPolishGeneratedKey('')
    try {
      const result = await polishResumeRecord({
        module: activeModule as PolishableModule,
        context,
        content,
      })
      const accepted = Object.fromEntries(
        fields
          .filter((field) => typeof result.content[field] === 'string' && result.content[field].trim())
          .map((field) => [field, result.content[field]]),
      )
      form.setFieldsValue(accepted)
      setPolishGeneratedKey(currentPolishKey)
    } catch (error) {
      message.error(getErrorMessage(error, 'AI 润色失败，请稍后再试'))
    } finally {
      setPolishing(false)
    }
  }

  const handleWholeResumePolish = async () => {
    if (!selectedResumeData) return
    const requestResumeId = selectedResumeData.id
    const items: ResumePolishItem[] = [
      ...currentEducations.map((item) => ({
        module: 'education' as const,
        record_id: item.id,
        context: { school_name: item.school_name, degree: item.degree ?? '', field_of_study: item.field_of_study ?? '' },
        content: { description: item.description ?? '' },
      })),
      ...currentInternships.map((item) => ({
        module: 'internship' as const,
        record_id: item.id,
        context: { company_name: item.company_name, position_title: item.position_title },
        content: { achievements: item.achievements.join('\n'), description: item.description ?? '' },
      })),
      ...currentWorkExperiences.map((item) => ({
        module: 'work' as const,
        record_id: item.id,
        context: { company_name: item.company_name, position_title: item.position_title },
        content: { achievements: item.achievements.join('\n'), description: item.description ?? '' },
      })),
      ...currentProjectExperiences.map((item) => ({
        module: 'project' as const,
        record_id: item.id,
        context: { project_name: item.project_name, role_name: item.role_name },
        content: { achievements: item.achievements.join('\n'), description: item.description ?? '' },
      })),
      ...currentAwards.map((item) => ({
        module: 'award' as const,
        record_id: item.id,
        context: { award_name: item.award_name, issuer: item.issuer },
        content: { description: item.description ?? '' },
      })),
    ]
    if (!items.some((item) => Object.values(item.content).some((value) => value.trim()))) {
      message.warning('请先完善简历中的描述或成就')
      return
    }
    setWholeResumePolishing(true)
    setPolishSuggestions([])
    setSuggestionResumeId(requestResumeId)
    try {
      const result = await polishWholeResume({
        target_position: selectedResumeData.target_position ?? '',
        items,
      })
      if (selectedResumeIdRef.current !== requestResumeId) return
      setPolishSuggestions(result.suggestions)
      setSuggestionDrawerOpen(true)
      if (result.suggestions.length === 0) message.info('AI 暂未发现需要润色的内容')
    } catch (error) {
      message.error(getErrorMessage(error, '整份简历润色失败，请稍后再试'))
    } finally {
      setWholeResumePolishing(false)
    }
  }

  const ignoreSuggestion = (id: string) => {
    setPolishSuggestions((current) => current.filter((item) => item.id !== id))
  }

  const saveSuggestionGroup = async (group: PolishSuggestion[]) => {
    if (!selectedResumeId || group.length === 0) throw new Error('未找到需要采纳的建议')
    const suggestion = group[0]
    const valueFor = (field: PolishSuggestion['field'], fallback: string) =>
      group.find((item) => item.field === field)?.suggested ?? fallback

    if (suggestion.module === 'education') {
        const item = educations.find((entry) => entry.id === suggestion.record_id)
        if (!item) throw new Error('教育经历不存在')
        const description = valueFor('description', item.description ?? '')
        const saved = await updateEducation(item.id, {
          resume_id: selectedResumeId, school_name: item.school_name,
          degree: item.degree ?? undefined, field_of_study: item.field_of_study ?? undefined,
          location: item.location ?? undefined, start_date: toAPIDate(item.start_date),
          end_date: item.end_date ? toAPIDate(item.end_date) : undefined, is_current: item.is_current, gpa: item.gpa ?? undefined,
          description,
        })
        setEducations((current) => current.map((entry) => entry.id === saved.id ? saved : entry))
        if (selectedEducationId === item.id) educationFormRef.current?.setFieldValue('description', description)
      } else if (suggestion.module === 'internship' || suggestion.module === 'work') {
        const collection = suggestion.module === 'internship' ? internships : workExperiences
        const item = collection.find((entry) => entry.id === suggestion.record_id)
        if (!item) throw new Error('工作或实习经历不存在')
        const achievementsText = valueFor('achievements', item.achievements.join('\n'))
        const achievements = achievementsText.split('\n').map((value) => value.trim()).filter(Boolean)
        const description = valueFor('description', item.description ?? '')
        const payload = {
          resume_id: selectedResumeId, company_name: item.company_name,
          position_title: item.position_title, department: item.department ?? undefined,
          location: item.location ?? undefined, start_date: toAPIDate(item.start_date),
          end_date: item.end_date ? toAPIDate(item.end_date) : undefined, is_current: item.is_current, achievements,
          description,
        }
        const saved = suggestion.module === 'internship'
          ? await updateInternship(item.id, payload)
          : await updateWorkExperience(item.id, payload)
        if (suggestion.module === 'internship') {
          setInternships((current) => current.map((entry) => entry.id === saved.id ? saved : entry))
          if (selectedInternshipId === item.id) internshipFormRef.current?.setFieldsValue({ achievements: achievementsText, description })
        } else {
          setWorkExperiences((current) => current.map((entry) => entry.id === saved.id ? saved : entry))
          if (selectedWorkId === item.id) workFormRef.current?.setFieldsValue({ achievements: achievementsText, description })
        }
      } else if (suggestion.module === 'project') {
        const item = projectExperiences.find((entry) => entry.id === suggestion.record_id)
        if (!item) throw new Error('项目经历不存在')
        const achievementsText = valueFor('achievements', item.achievements.join('\n'))
        const achievements = achievementsText.split('\n').map((value) => value.trim()).filter(Boolean)
        const description = valueFor('description', item.description ?? '')
        const saved = await updateProjectExperience(item.id, {
          resume_id: selectedResumeId, project_name: item.project_name, role_name: item.role_name,
          project_url: item.project_url ?? undefined, repository_url: item.repository_url ?? undefined,
          start_date: toAPIDate(item.start_date), end_date: item.end_date ? toAPIDate(item.end_date) : undefined,
          is_current: item.is_current, achievements,
          description,
        })
        setProjectExperiences((current) => current.map((entry) => entry.id === saved.id ? saved : entry))
        if (selectedProjectId === item.id) projectFormRef.current?.setFieldsValue({ achievements: achievementsText, description })
      } else {
        const item = awards.find((entry) => entry.id === suggestion.record_id)
        if (!item) throw new Error('获奖记录不存在')
        const description = valueFor('description', item.description ?? '')
        const saved = await updateAward(item.id, {
          resume_id: selectedResumeId, award_name: item.award_name, issuer: item.issuer,
          certificate_url: item.certificate_url ?? undefined, description,
        })
        setAwards((current) => current.map((entry) => entry.id === saved.id ? saved : entry))
        if (selectedAwardId === item.id) awardFormRef.current?.setFieldValue('description', description)
      }
  }

  const acceptSuggestion = async (suggestion: PolishSuggestion) => {
    setAcceptingSuggestionId(suggestion.id)
    try {
      await saveSuggestionGroup([suggestion])
      ignoreSuggestion(suggestion.id)
      message.success('已采纳并同步更新简历')
    } catch (error) {
      message.error(getErrorMessage(error, '采纳建议失败'))
    } finally {
      setAcceptingSuggestionId('')
    }
  }

  const ignoreAllSuggestions = () => {
    const ids = new Set(visiblePolishSuggestions.map((item) => item.id))
    setPolishSuggestions((current) => current.filter((item) => !ids.has(item.id)))
  }

  const acceptAllSuggestions = async () => {
    const groups = new Map<string, PolishSuggestion[]>()
    for (const suggestion of visiblePolishSuggestions) {
      const key = `${suggestion.module}:${suggestion.record_id}`
      groups.set(key, [...(groups.get(key) ?? []), suggestion])
    }
    setAcceptingSuggestionId('all')
    const acceptedIds = new Set<string>()
    try {
      for (const group of groups.values()) {
        await saveSuggestionGroup(group)
        group.forEach((item) => acceptedIds.add(item.id))
      }
      setPolishSuggestions((current) => current.filter((item) => !acceptedIds.has(item.id)))
      message.success(`已采纳并同步更新 ${acceptedIds.size} 条建议`)
    } catch (error) {
      setPolishSuggestions((current) => current.filter((item) => !acceptedIds.has(item.id)))
      message.error(getErrorMessage(error, '批量采纳失败，已保留未处理建议'))
    } finally {
      setAcceptingSuggestionId('')
    }
  }

  const openCreateResumeModal = () => {
    setNewResumeTitle('未命名简历')
    setSelectedTemplateKey('default')
    setCreateModalOpen(true)
  }

  const handleCreateResume = async () => {
    setCreateSaving(true)
    try {
      await createResume(newResumeTitle.trim() || '未命名简历', selectedTemplateKey)
      setCreateModalOpen(false)
      message.success('已新建简历')
    } catch (error) {
      message.error(getErrorMessage(error, '新建简历失败'))
    } finally {
      setCreateSaving(false)
    }
  }

  const handleTemplateChange = async (templateKey: ResumeTemplateKey) => {
    if (!selectedResumeData || selectedResumeData.template_key === templateKey) return
    setTemplateSaving(true)
    try {
      await updateResumeTemplate(selectedResumeData.id, templateKey)
      message.success('模板已切换')
    } catch (error) {
      message.error(getErrorMessage(error, '切换模板失败'))
    } finally {
      setTemplateSaving(false)
    }
  }

  const handleSave = async () => {
    if (activeModule === 'award') {
      if (!selectedResumeId) {
        message.warning('请先新建或选择一份简历')
        return
      }
      try {
        const values = await awardFormRef.current?.validateFields()
        if (!values) return
        const payload = {
          ...values,
          resume_id: selectedResumeId,
        }
        const saved = creatingAward
          ? await createAward(payload)
          : await updateAward(selectedAwardId, payload)
        setAwards((current) =>
          creatingAward
            ? [...current, saved]
            : current.map((item) => (item.id === saved.id ? saved : item)),
        )
        if (creatingAward) {
          setCurrentAwardIds((current) =>
            current.includes(saved.id) ? current : [...current, saved.id],
          )
          setAwardScope('current')
        }
        setSelectedAwardId(saved.id)
        setCreatingAward(false)
        setPolishGeneratedKey('')
        message.success(creatingAward ? '获奖记录已新增' : '获奖记录已保存')
      } catch (error) {
        if (!isFormValidationError(error)) {
          message.error(getErrorMessage(error, '保存获奖记录失败'))
        }
      }
      return
    }
    if (activeModule === 'project') {
      if (!selectedResumeId) {
        message.warning('请先新建或选择一份简历')
        return
      }
      try {
        const values = await projectFormRef.current?.validateFields()
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
        const saved = creatingProject
          ? await createProjectExperience(payload)
          : await updateProjectExperience(selectedProjectId, payload)
        setProjectExperiences((current) =>
          creatingProject
            ? [...current, saved]
            : current.map((item) => (item.id === saved.id ? saved : item)),
        )
        if (creatingProject) {
          setCurrentProjectIds((current) =>
            current.includes(saved.id) ? current : [...current, saved.id],
          )
          setProjectScope('current')
        }
        setSelectedProjectId(saved.id)
        setCreatingProject(false)
        setPolishGeneratedKey('')
        message.success(creatingProject ? '项目经历已新增' : '项目经历已保存')
      } catch (error) {
        if (!isFormValidationError(error)) {
          message.error(getErrorMessage(error, '保存项目经历失败'))
        }
      }
      return
    }
    if (activeModule === 'work') {
      if (!selectedResumeId) {
        message.warning('请先新建或选择一份简历')
        return
      }
      try {
        const values = await workFormRef.current?.validateFields()
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
        const saved = creatingWork
          ? await createWorkExperience(payload)
          : await updateWorkExperience(selectedWorkId, payload)
        setWorkExperiences((current) =>
          creatingWork
            ? [...current, saved]
            : current.map((item) => (item.id === saved.id ? saved : item)),
        )
        if (creatingWork) {
          setCurrentWorkIds((current) =>
            current.includes(saved.id) ? current : [...current, saved.id],
          )
          setWorkScope('current')
        }
        setSelectedWorkId(saved.id)
        setCreatingWork(false)
        setPolishGeneratedKey('')
        message.success(creatingWork ? '工作经历已新增' : '工作经历已保存')
      } catch (error) {
        if (!isFormValidationError(error)) {
          message.error(getErrorMessage(error, '保存工作经历失败'))
        }
      }
      return
    }
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
        setPolishGeneratedKey('')
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
        setPolishGeneratedKey('')
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
    educationFormRef.current?.resetFields()
    setPolishGeneratedKey('')
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
    internshipFormRef.current?.resetFields()
    setPolishGeneratedKey('')
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

  const startCreatingWork = () => {
    if (!selectedResumeId) {
      message.warning('请先新建或选择一份简历')
      return
    }
    setCreatingWork(true)
    setSelectedWorkId('')
  }

  const cancelWorkEdit = () => {
    workFormRef.current?.resetFields()
    setPolishGeneratedKey('')
    setCreatingWork(false)
    setSelectedWorkId(visibleWorkExperiences[0]?.id ?? '')
  }

  const changeWorkScope = (scope: 'current' | 'all') => {
    setWorkScope(scope)
    setCreatingWork(false)
    const items = scope === 'current' ? currentWorkExperiences : workExperiences
    const item = items.find((entry) => entry.id === selectedWorkId) ?? items[0]
    setSelectedWorkId(item?.id ?? '')
  }

  const handleAttachWork = async () => {
    if (!selectedResumeId || !selectedWork || selectedWorkIsCurrent) return
    setWorkLoading(true)
    try {
      await attachWorkExperience(selectedResumeId, selectedWork.id)
      setCurrentWorkIds((current) => [...current, selectedWork.id])
      message.success('已加入当前简历')
    } catch (error) {
      message.error(getErrorMessage(error, '加入当前简历失败'))
    } finally {
      setWorkLoading(false)
    }
  }

  const handleDetachWork = async () => {
    if (!selectedResumeId || !selectedWork || !selectedWorkIsCurrent) return
    setWorkLoading(true)
    try {
      await detachWorkExperience(selectedResumeId, selectedWork.id)
      const remainingIds = currentWorkIds.filter((id) => id !== selectedWork.id)
      setCurrentWorkIds(remainingIds)
      setSelectedWorkId(workExperiences.find((item) => remainingIds.includes(item.id))?.id ?? '')
      message.success('已从当前简历移除，经历仍保留在经历库')
    } catch (error) {
      message.error(getErrorMessage(error, '从当前简历移除失败'))
    } finally {
      setWorkLoading(false)
    }
  }

  const confirmDeleteWork = () => {
    if (!selectedWork) return
    Modal.confirm({
      title: '永久删除这条工作经历？',
      content: `“${selectedWork.company_name} · ${selectedWork.position_title}”会从所有关联简历中移除，删除后无法恢复。`,
      okText: '永久删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteWorkExperience(selectedWork.id)
          const remaining = workExperiences.filter((item) => item.id !== selectedWork.id)
          setWorkExperiences(remaining)
          setCurrentWorkIds((current) => current.filter((id) => id !== selectedWork.id))
          const next =
            workScope === 'current'
              ? remaining.find((item) => currentWorkIds.includes(item.id))
              : remaining[0]
          setSelectedWorkId(next?.id ?? '')
          message.success('工作经历已永久删除')
        } catch (error) {
          message.error(getErrorMessage(error, '删除工作经历失败'))
          throw error
        }
      },
    })
  }

  const startCreatingProject = () => {
    if (!selectedResumeId) {
      message.warning('请先新建或选择一份简历')
      return
    }
    setCreatingProject(true)
    setSelectedProjectId('')
  }

  const cancelProjectEdit = () => {
    projectFormRef.current?.resetFields()
    setPolishGeneratedKey('')
    setCreatingProject(false)
    setSelectedProjectId(visibleProjectExperiences[0]?.id ?? '')
  }

  const changeProjectScope = (scope: 'current' | 'all') => {
    setProjectScope(scope)
    setCreatingProject(false)
    const items = scope === 'current' ? currentProjectExperiences : projectExperiences
    const item = items.find((entry) => entry.id === selectedProjectId) ?? items[0]
    setSelectedProjectId(item?.id ?? '')
  }

  const handleAttachProject = async () => {
    if (!selectedResumeId || !selectedProject || selectedProjectIsCurrent) return
    setProjectLoading(true)
    try {
      await attachProjectExperience(selectedResumeId, selectedProject.id)
      setCurrentProjectIds((current) => [...current, selectedProject.id])
      message.success('已加入当前简历')
    } catch (error) {
      message.error(getErrorMessage(error, '加入当前简历失败'))
    } finally {
      setProjectLoading(false)
    }
  }

  const handleDetachProject = async () => {
    if (!selectedResumeId || !selectedProject || !selectedProjectIsCurrent) return
    setProjectLoading(true)
    try {
      await detachProjectExperience(selectedResumeId, selectedProject.id)
      const remainingIds = currentProjectIds.filter((id) => id !== selectedProject.id)
      setCurrentProjectIds(remainingIds)
      setSelectedProjectId(
        projectExperiences.find((item) => remainingIds.includes(item.id))?.id ?? '',
      )
      message.success('已从当前简历移除，经历仍保留在经历库')
    } catch (error) {
      message.error(getErrorMessage(error, '从当前简历移除失败'))
    } finally {
      setProjectLoading(false)
    }
  }

  const confirmDeleteProject = () => {
    if (!selectedProject) return
    Modal.confirm({
      title: '永久删除这条项目经历？',
      content: `“${selectedProject.project_name} · ${selectedProject.role_name}”会从所有关联简历中移除，删除后无法恢复。`,
      okText: '永久删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteProjectExperience(selectedProject.id)
          const remaining = projectExperiences.filter(
            (item) => item.id !== selectedProject.id,
          )
          setProjectExperiences(remaining)
          setCurrentProjectIds((current) =>
            current.filter((id) => id !== selectedProject.id),
          )
          const next =
            projectScope === 'current'
              ? remaining.find((item) => currentProjectIds.includes(item.id))
              : remaining[0]
          setSelectedProjectId(next?.id ?? '')
          message.success('项目经历已永久删除')
        } catch (error) {
          message.error(getErrorMessage(error, '删除项目经历失败'))
          throw error
        }
      },
    })
  }

  const startCreatingAward = () => {
    if (!selectedResumeId) {
      message.warning('请先新建或选择一份简历')
      return
    }
    setCreatingAward(true)
    setSelectedAwardId('')
  }

  const cancelAwardEdit = () => {
    awardFormRef.current?.resetFields()
    setPolishGeneratedKey('')
    setCreatingAward(false)
    setSelectedAwardId(visibleAwards[0]?.id ?? '')
  }

  const changeAwardScope = (scope: 'current' | 'all') => {
    setAwardScope(scope)
    setCreatingAward(false)
    const items = scope === 'current' ? currentAwards : awards
    const item = items.find((entry) => entry.id === selectedAwardId) ?? items[0]
    setSelectedAwardId(item?.id ?? '')
  }

  const handleAttachAward = async () => {
    if (!selectedResumeId || !selectedAward || selectedAwardIsCurrent) return
    setAwardLoading(true)
    try {
      await attachAward(selectedResumeId, selectedAward.id)
      setCurrentAwardIds((current) => [...current, selectedAward.id])
      message.success('已加入当前简历')
    } catch (error) {
      message.error(getErrorMessage(error, '加入当前简历失败'))
    } finally {
      setAwardLoading(false)
    }
  }

  const handleDetachAward = async () => {
    if (!selectedResumeId || !selectedAward || !selectedAwardIsCurrent) return
    setAwardLoading(true)
    try {
      await detachAward(selectedResumeId, selectedAward.id)
      const remainingIds = currentAwardIds.filter((id) => id !== selectedAward.id)
      setCurrentAwardIds(remainingIds)
      setSelectedAwardId(awards.find((item) => remainingIds.includes(item.id))?.id ?? '')
      message.success('已从当前简历移除，记录仍保留在经历库')
    } catch (error) {
      message.error(getErrorMessage(error, '从当前简历移除失败'))
    } finally {
      setAwardLoading(false)
    }
  }

  const confirmDeleteAward = () => {
    if (!selectedAward) return
    Modal.confirm({
      title: '永久删除这条获奖记录？',
      content: `“${selectedAward.award_name} · ${selectedAward.issuer}”会从所有关联简历中移除，删除后无法恢复。`,
      okText: '永久删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteAward(selectedAward.id)
          const remaining = awards.filter((item) => item.id !== selectedAward.id)
          setAwards(remaining)
          setCurrentAwardIds((current) =>
            current.filter((id) => id !== selectedAward.id),
          )
          const next =
            awardScope === 'current'
              ? remaining.find((item) => currentAwardIds.includes(item.id))
              : remaining[0]
          setSelectedAwardId(next?.id ?? '')
          message.success('获奖记录已永久删除')
        } catch (error) {
          message.error(getErrorMessage(error, '删除获奖记录失败'))
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
              activeModule !== 'internship' &&
              activeModule !== 'work' &&
              activeModule !== 'project' &&
              activeModule !== 'award' && (
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
                  options={records[activeModule as Exclude<ResumeModuleKey, 'education' | 'internship' | 'work' | 'project' | 'award'>].map((label, index) => ({
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

            {activeModule === 'work' && (
              <div className="border-b border-slate-100 bg-slate-50/70 p-4">
                <Segmented
                  block
                  className="mb-3"
                  value={workScope}
                  onChange={(value) => changeWorkScope(value as 'current' | 'all')}
                  options={[
                    { value: 'current', label: `当前简历 ${currentWorkExperiences.length}` },
                    { value: 'all', label: `全部经历 ${workExperiences.length}` },
                  ]}
                />
                <div className="mb-2 flex items-center justify-between">
                  <Text className="text-xs! text-slate-500!">
                    {workScope === 'current'
                      ? '本简历采用的工作经历'
                      : '个人经历库，可在多份简历中复用'}
                  </Text>
                  <Button
                    type="link"
                    size="small"
                    icon={<PlusOutlined />}
                    disabled={!selectedResumeId}
                    onClick={startCreatingWork}
                  >
                    新增
                  </Button>
                </div>
                {visibleWorkExperiences.length > 0 && !creatingWork && (
                  <Select
                    className="w-full"
                    value={selectedWorkId}
                    loading={workLoading}
                    onChange={(value) => {
                      setCreatingWork(false)
                      setSelectedWorkId(value)
                    }}
                    options={visibleWorkExperiences.map((item) => ({
                      value: item.id,
                      label: `${item.company_name} · ${item.position_title}${
                        workScope === 'all' && currentWorkIds.includes(item.id)
                          ? '（已加入）'
                          : ''
                      }`,
                    }))}
                  />
                )}
                {workScope === 'all' && selectedWork && !creatingWork && (
                  <Button
                    block
                    className="mt-3"
                    type={selectedWorkIsCurrent ? 'default' : 'primary'}
                    disabled={selectedWorkIsCurrent}
                    icon={selectedWorkIsCurrent ? undefined : <PlusOutlined />}
                    onClick={handleAttachWork}
                  >
                    {selectedWorkIsCurrent ? '已加入当前简历' : '加入当前简历'}
                  </Button>
                )}
                {creatingWork && (
                  <Text className="text-sm! text-indigo-600!">
                    新增工作经历（保存后自动加入当前简历）
                  </Text>
                )}
              </div>
            )}

            {activeModule === 'project' && (
              <div className="border-b border-slate-100 bg-slate-50/70 p-4">
                <Segmented
                  block
                  className="mb-3"
                  value={projectScope}
                  onChange={(value) => changeProjectScope(value as 'current' | 'all')}
                  options={[
                    { value: 'current', label: `当前简历 ${currentProjectExperiences.length}` },
                    { value: 'all', label: `全部经历 ${projectExperiences.length}` },
                  ]}
                />
                <div className="mb-2 flex items-center justify-between">
                  <Text className="text-xs! text-slate-500!">
                    {projectScope === 'current'
                      ? '本简历采用的项目经历'
                      : '个人经历库，可在多份简历中复用'}
                  </Text>
                  <Button
                    type="link"
                    size="small"
                    icon={<PlusOutlined />}
                    disabled={!selectedResumeId}
                    onClick={startCreatingProject}
                  >
                    新增
                  </Button>
                </div>
                {visibleProjectExperiences.length > 0 && !creatingProject && (
                  <Select
                    className="w-full"
                    value={selectedProjectId}
                    loading={projectLoading}
                    onChange={(value) => {
                      setCreatingProject(false)
                      setSelectedProjectId(value)
                    }}
                    options={visibleProjectExperiences.map((item) => ({
                      value: item.id,
                      label: `${item.project_name} · ${item.role_name}${
                        projectScope === 'all' && currentProjectIds.includes(item.id)
                          ? '（已加入）'
                          : ''
                      }`,
                    }))}
                  />
                )}
                {projectScope === 'all' && selectedProject && !creatingProject && (
                  <Button
                    block
                    className="mt-3"
                    type={selectedProjectIsCurrent ? 'default' : 'primary'}
                    disabled={selectedProjectIsCurrent}
                    icon={selectedProjectIsCurrent ? undefined : <PlusOutlined />}
                    onClick={handleAttachProject}
                  >
                    {selectedProjectIsCurrent ? '已加入当前简历' : '加入当前简历'}
                  </Button>
                )}
                {creatingProject && (
                  <Text className="text-sm! text-indigo-600!">
                    新增项目经历（保存后自动加入当前简历）
                  </Text>
                )}
              </div>
            )}

            {activeModule === 'award' && (
              <div className="border-b border-slate-100 bg-slate-50/70 p-4">
                <Segmented
                  block
                  className="mb-3"
                  value={awardScope}
                  onChange={(value) => changeAwardScope(value as 'current' | 'all')}
                  options={[
                    { value: 'current', label: `当前简历 ${currentAwards.length}` },
                    { value: 'all', label: `全部记录 ${awards.length}` },
                  ]}
                />
                <div className="mb-2 flex items-center justify-between">
                  <Text className="text-xs! text-slate-500!">
                    {awardScope === 'current'
                      ? '本简历采用的获奖记录'
                      : '个人记录库，可在多份简历中复用'}
                  </Text>
                  <Button
                    type="link"
                    size="small"
                    icon={<PlusOutlined />}
                    disabled={!selectedResumeId}
                    onClick={startCreatingAward}
                  >
                    新增
                  </Button>
                </div>
                {visibleAwards.length > 0 && !creatingAward && (
                  <Select
                    className="w-full"
                    value={selectedAwardId}
                    loading={awardLoading}
                    onChange={(value) => {
                      setCreatingAward(false)
                      setSelectedAwardId(value)
                    }}
                    options={visibleAwards.map((item) => ({
                      value: item.id,
                      label: `${item.award_name} · ${item.issuer}${
                        awardScope === 'all' && currentAwardIds.includes(item.id)
                          ? '（已加入）'
                          : ''
                      }`,
                    }))}
                  />
                )}
                {awardScope === 'all' && selectedAward && !creatingAward && (
                  <Button
                    block
                    className="mt-3"
                    type={selectedAwardIsCurrent ? 'default' : 'primary'}
                    disabled={selectedAwardIsCurrent}
                    icon={selectedAwardIsCurrent ? undefined : <PlusOutlined />}
                    onClick={handleAttachAward}
                  >
                    {selectedAwardIsCurrent ? '已加入当前简历' : '加入当前简历'}
                  </Button>
                )}
                {creatingAward && (
                  <Text className="text-sm! text-indigo-600!">
                    新增获奖记录（保存后自动加入当前简历）
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
                      : activeModule === 'internship'
                        ? internshipScope === 'current' && internships.length > 0
                          ? '当前简历还没有实习经历，可从经历库中选择'
                          : '还没有实习经历，创建后可在多份简历中复用'
                        : activeModule === 'work'
                          ? workScope === 'current' && workExperiences.length > 0
                            ? '当前简历还没有工作经历，可从经历库中选择'
                            : '还没有工作经历，创建后可在多份简历中复用'
                          : activeModule === 'project'
                            ? projectScope === 'current' && projectExperiences.length > 0
                              ? '当前简历还没有项目经历，可从经历库中选择'
                              : '还没有项目经历，创建后可在多份简历中复用'
                            : awardScope === 'current' && awards.length > 0
                              ? '当前简历还没有获奖记录，可从记录库中选择'
                              : '还没有获奖记录，创建后可在多份简历中复用'
                  }
                >
                  <Space direction="vertical">
                    {((activeModule === 'education' &&
                      educationScope === 'current' &&
                      educations.length > 0) ||
                      (activeModule === 'internship' &&
                        internshipScope === 'current' &&
                        internships.length > 0) ||
                      (activeModule === 'work' &&
                        workScope === 'current' &&
                        workExperiences.length > 0) ||
                      (activeModule === 'project' &&
                        projectScope === 'current' &&
                        projectExperiences.length > 0) ||
                      (activeModule === 'award' &&
                        awardScope === 'current' &&
                        awards.length > 0)) && (
                      <Button
                        type="primary"
                        onClick={() =>
                          activeModule === 'education'
                            ? changeEducationScope('all')
                            : activeModule === 'internship'
                              ? changeInternshipScope('all')
                              : activeModule === 'work'
                                ? changeWorkScope('all')
                                : activeModule === 'project'
                                  ? changeProjectScope('all')
                                  : changeAwardScope('all')
                        }
                      >
                        从经历库添加
                      </Button>
                    )}
                    <Button
                      type={
                        (activeModule === 'education'
                          ? educations
                          : activeModule === 'internship'
                            ? internships
                            : activeModule === 'work'
                              ? workExperiences
                              : activeModule === 'project'
                                ? projectExperiences
                                : awards
                        ).length === 0
                          ? 'primary'
                          : 'default'
                      }
                      icon={<PlusOutlined />}
                      disabled={!selectedResumeId}
                      onClick={
                        activeModule === 'education'
                          ? startCreatingEducation
                          : activeModule === 'internship'
                            ? startCreatingInternship
                            : activeModule === 'work'
                              ? startCreatingWork
                              : activeModule === 'project'
                                ? startCreatingProject
                                : startCreatingAward
                      }
                    >
                      新增{activeModule === 'award' ? '获奖记录' : `${activeModule === 'education' ? '教育' : activeModule === 'internship' ? '实习' : activeModule === 'work' ? '工作' : '项目'}经历`}
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
                  {activeModule === 'work' && selectedWork && !creatingWork && (
                    <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
                      修改经历内容会同步影响所有使用该经历的简历。
                    </div>
                  )}
                  {activeModule === 'project' && selectedProject && !creatingProject && (
                    <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
                      修改经历内容会同步影响所有使用该经历的简历。
                    </div>
                  )}
                  {activeModule === 'award' && selectedAward && !creatingAward && (
                    <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
                      修改记录内容会同步影响所有使用该记录的简历。
                    </div>
                  )}
                  <EditorForm
                    moduleKey={activeModule}
                    form={profileForm}
                    educationFormRef={educationFormRef}
                    internshipFormRef={internshipFormRef}
                    workFormRef={workFormRef}
                    projectFormRef={projectFormRef}
                    awardFormRef={awardFormRef}
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
                    workFormKey={creatingWork ? 'work-new' : `work-${selectedWorkId}`}
                    workInitialValues={
                      creatingWork || !selectedWork
                        ? { is_current: false }
                        : {
                            company_name: selectedWork.company_name,
                            position_title: selectedWork.position_title,
                            department: selectedWork.department ?? '',
                            location: selectedWork.location ?? '',
                            start_date: selectedWork.start_date?.slice(0, 7) ?? '',
                            end_date: selectedWork.end_date?.slice(0, 7) ?? '',
                            is_current: selectedWork.is_current,
                            achievements: (selectedWork.achievements ?? []).join('\n'),
                            description: selectedWork.description ?? '',
                          }
                    }
                    projectFormKey={
                      creatingProject ? 'project-new' : `project-${selectedProjectId}`
                    }
                    projectInitialValues={
                      creatingProject || !selectedProject
                        ? { is_current: false }
                        : {
                            project_name: selectedProject.project_name,
                            role_name: selectedProject.role_name,
                            project_url: selectedProject.project_url ?? '',
                            repository_url: selectedProject.repository_url ?? '',
                            start_date: selectedProject.start_date?.slice(0, 7) ?? '',
                            end_date: selectedProject.end_date?.slice(0, 7) ?? '',
                            is_current: selectedProject.is_current,
                            achievements: (selectedProject.achievements ?? []).join('\n'),
                            description: selectedProject.description ?? '',
                          }
                    }
                    awardFormKey={creatingAward ? 'award-new' : `award-${selectedAwardId}`}
                    awardInitialValues={
                      creatingAward || !selectedAward
                        ? {}
                        : {
                            award_name: selectedAward.award_name,
                            issuer: selectedAward.issuer,
                            certificate_url: selectedAward.certificate_url ?? '',
                            description: selectedAward.description ?? '',
                          }
                    }
                    hasSelectedResume={Boolean(selectedResumeData)}
                    polishing={polishing}
                    polishGenerated={polishGeneratedKey === currentPolishKey}
                    onPolish={handlePolish}
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
                    (activeModule === 'internship' && !selectedInternship) ||
                    (activeModule === 'work' && !selectedWork) ||
                    (activeModule === 'project' && !selectedProject) ||
                    (activeModule === 'award' && !selectedAward)
                  }
                  danger={
                    (activeModule === 'education' && educationScope === 'all') ||
                    (activeModule === 'internship' && internshipScope === 'all') ||
                    (activeModule === 'work' && workScope === 'all') ||
                    (activeModule === 'project' && projectScope === 'all') ||
                    (activeModule === 'award' && awardScope === 'all') ||
                    (activeModule !== 'education' &&
                      activeModule !== 'internship' &&
                      activeModule !== 'work' &&
                      activeModule !== 'project' &&
                      activeModule !== 'award')
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
                        : activeModule === 'work'
                          ? workScope === 'current'
                            ? handleDetachWork
                            : confirmDeleteWork
                          : activeModule === 'project'
                            ? projectScope === 'current'
                              ? handleDetachProject
                              : confirmDeleteProject
                            : activeModule === 'award'
                              ? awardScope === 'current'
                                ? handleDetachAward
                                : confirmDeleteAward
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
                      : activeModule === 'work'
                        ? workScope === 'current'
                          ? '移出简历'
                          : '永久删除'
                        : activeModule === 'project'
                          ? projectScope === 'current'
                            ? '移出简历'
                            : '永久删除'
                          : activeModule === 'award'
                            ? awardScope === 'current'
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
                        : activeModule === 'work'
                          ? cancelWorkEdit
                          : activeModule === 'project'
                            ? cancelProjectEdit
                            : activeModule === 'award'
                              ? cancelAwardEdit
                              : undefined
                  }
                >
                  取消
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={
                    loading ||
                    educationLoading ||
                    internshipLoading ||
                    workLoading ||
                    projectLoading ||
                    awardLoading
                  }
                  disabled={
                    (activeModule === 'profile' && !selectedResumeData) ||
                    (activeModule === 'education' && !selectedEducation && !creatingEducation) ||
                    (activeModule === 'internship' &&
                      !selectedInternship &&
                      !creatingInternship) ||
                    (activeModule === 'work' && !selectedWork && !creatingWork) ||
                    (activeModule === 'project' && !selectedProject && !creatingProject) ||
                    (activeModule === 'award' && !selectedAward && !creatingAward)
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
              <Button
                size="small"
                type="primary"
                icon={<ThunderboltOutlined />}
                loading={wholeResumePolishing}
                disabled={!selectedResumeData || wholeResumePolishing || visiblePolishSuggestions.length > 0}
                onClick={handleWholeResumePolish}
              >
                AI 帮我润色
              </Button>
              {visiblePolishSuggestions.length > 0 && (
                <Button size="small" onClick={() => setSuggestionDrawerOpen(true)}>
                  润色建议（{visiblePolishSuggestions.length}）
                </Button>
              )}
              <Select
                size="small"
                className="w-32"
                value={currentTemplateKey}
                loading={templateSaving}
                disabled={!selectedResumeData || templateSaving}
                options={RESUME_TEMPLATES.map((template) => ({
                  value: template.key,
                  label: template.name,
                }))}
                onChange={handleTemplateChange}
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

          <div className="relative flex min-h-[calc(100%-54px)] justify-center p-9">
            {wholeResumePolishing && (
              <div className="absolute inset-0 z-20 overflow-hidden bg-slate-900/12 backdrop-blur-[1px]">
                <div className="absolute inset-x-0 top-1/2 z-10 text-center">
                  <span className="rounded-full bg-white/95 px-5 py-2 text-sm font-medium text-violet-700 shadow-lg">
                    AI 正在扫描并分析整份简历…
                  </span>
                </div>
                <div className="resume-scan-line absolute inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent shadow-[0_0_16px_4px_rgba(139,92,246,0.45)]" />
              </div>
            )}
            {selectedResumeData ? (
              <ResumePaper
                resume={selectedResumeData}
                profile={profile}
                educations={currentEducations}
                internships={currentInternships}
                workExperiences={currentWorkExperiences}
                projectExperiences={currentProjectExperiences}
                awards={currentAwards}
                polishSuggestionKeys={visiblePolishSuggestions.map((item) => item.id)}
              />
            ) : (
              <div className="grid min-h-150 w-full place-items-center">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="暂无简历，请从右侧新建一份简历"
                >
                  <Button type="primary" icon={<FileAddOutlined />} onClick={openCreateResumeModal}>
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
              <Button block type="primary" icon={<PlusOutlined />} onClick={openCreateResumeModal}>
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
      <Drawer
        title={`AI 润色建议（${visiblePolishSuggestions.length}）`}
        width={460}
        open={suggestionDrawerOpen}
        onClose={() => setSuggestionDrawerOpen(false)}
      >
        {visiblePolishSuggestions.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无待处理建议" />
        ) : (
          <div className="space-y-4">
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-xl border border-violet-100 bg-white/95 p-3 shadow-sm backdrop-blur">
              <Text className="text-xs! text-slate-500!">请先处理当前建议，再次进行润色</Text>
              <Space>
                <Button size="small" disabled={acceptingSuggestionId === 'all'} onClick={ignoreAllSuggestions}>
                  全部忽略
                </Button>
                <Button
                  size="small"
                  type="primary"
                  loading={acceptingSuggestionId === 'all'}
                  onClick={() => void acceptAllSuggestions()}
                >
                  全部采纳
                </Button>
              </Space>
            </div>
            {visiblePolishSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="rounded-xl border border-violet-100 bg-violet-50/40 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Tag color="purple">
                    {suggestion.module === 'education' ? '教育经历' : suggestion.module === 'internship' ? '实习经历' : suggestion.module === 'work' ? '工作经历' : suggestion.module === 'project' ? '项目经历' : '获奖记录'}
                    {' · '}
                    {suggestion.field === 'achievements' ? '成就' : '描述'}
                  </Tag>
                </div>
                <Text className="text-xs! text-slate-400!">原文</Text>
                <div className="mt-1 whitespace-pre-line rounded-lg bg-white px-3 py-2 text-sm leading-6 text-slate-600">
                  {suggestion.original}
                </div>
                <Text className="mt-3 block! text-xs! text-violet-500!">AI 建议</Text>
                <div className="mt-1 whitespace-pre-line rounded-lg border border-violet-100 bg-white px-3 py-2 text-sm leading-6 text-slate-800">
                  {suggestion.suggested}
                </div>
                <Text className="mt-3 block! text-xs! text-slate-400!">优化原因</Text>
                <div className="mt-1 text-sm leading-6 text-slate-600">
                  {suggestion.reason || '增强表达的专业性、清晰度和结果导向。'}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button size="small" disabled={Boolean(acceptingSuggestionId)} onClick={() => ignoreSuggestion(suggestion.id)}>
                    忽略
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    loading={acceptingSuggestionId === suggestion.id}
                    disabled={acceptingSuggestionId === 'all'}
                    onClick={() => void acceptSuggestion(suggestion)}
                  >
                    采纳
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Drawer>
      <Modal
        title="新建简历"
        open={createModalOpen}
        okText="创建简历"
        cancelText="取消"
        confirmLoading={createSaving}
        okButtonProps={{ disabled: !newResumeTitle.trim() }}
        width={1040}
        onOk={handleCreateResume}
        onCancel={() => {
          if (!createSaving) setCreateModalOpen(false)
        }}
      >
        <div className="mt-5 grid grid-cols-[360px_1fr] gap-7">
          <div>
            <Text strong>简历标题</Text>
            <Input
              className="mt-2"
              value={newResumeTitle}
              maxLength={150}
              showCount
              placeholder="请输入简历标题"
              onChange={(event) => setNewResumeTitle(event.target.value)}
            />
            <Text strong className="mt-5 block!">选择模板</Text>
            <div className="mt-2 space-y-3">
              {RESUME_TEMPLATES.map((template) => {
                const selected = selectedTemplateKey === template.key
                return (
                  <button
                    key={template.key}
                    type="button"
                    className={`block w-full rounded-xl border p-3 text-left transition ${
                      selected
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100'
                        : 'border-slate-200 hover:border-indigo-300'
                    }`}
                    onClick={() => setSelectedTemplateKey(template.key)}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <Text strong>{template.name}</Text>
                      {selected && <Tag color="blue" className="m-0!">已选择</Tag>}
                    </span>
                    <Text className="mt-1 block! text-xs! leading-5! text-slate-500!">
                      {template.description}
                    </Text>
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <Text strong>实时预览</Text>
            <div className="mt-2 flex h-130 justify-center overflow-hidden rounded-xl bg-slate-100 p-4">
              <div className="h-125 w-90 overflow-hidden shadow-lg">
                <div className="origin-top-left" style={{ transform: 'scale(0.5)' }}>
                  <ResumePaper
                    resume={createPreviewResume}
                    profile={profile}
                    educations={currentEducations}
                    internships={currentInternships}
                    workExperiences={currentWorkExperiences}
                    projectExperiences={currentProjectExperiences}
                    awards={currentAwards}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
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

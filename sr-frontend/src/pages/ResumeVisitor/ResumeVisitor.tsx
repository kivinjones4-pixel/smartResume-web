import { useCallback, useEffect, useState } from 'react'
import { ThunderboltOutlined } from '@ant-design/icons'
import { Typography, message } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { getPublicResume, unlockResume } from '../../services/PublicResume'
import { ApiError } from '../../services/request'
import { useAuth } from '../../store/Auth'
import type { PublicResumeData } from '../../types/PublicResume'
import { getErrorMessage } from '../../utils/error'
import ResumePaper from '../ResumeWorkspace/components/ResumePaper'
import ResumeChatSidebar from './components/ResumeChatSidebar'
import VisitorAccessGate from './components/VisitorAccessGate'

const { Text } = Typography

export default function ResumeVisitor() {
  const { id: resumeID = '' } = useParams()
  const navigate = useNavigate()
  const { loading: authLoading } = useAuth()
  const [data, setData] = useState<PublicResumeData>()
  const [codeOpen, setCodeOpen] = useState(false)
  const [code, setCode] = useState('')
  const [unlocking, setUnlocking] = useState(false)

  const loadResume = useCallback(async () => {
    try {
      setData(await getPublicResume(resumeID))
      setCodeOpen(false)
    } catch (error) {
      if (error instanceof ApiError && error.code === 'VISITOR_CODE_REQUIRED') {
        setCodeOpen(true)
        return
      }
      if (!(error instanceof ApiError && error.code === 'PRIVATE_RESUME')) {
        message.error(getErrorMessage(error, '简历不可访问'))
      }
      navigate('/', { replace: true })
    }
  }, [navigate, resumeID])

  useEffect(() => {
    if (authLoading) return

    void getPublicResume(resumeID)
      .then((resume) => {
        setData(resume)
        setCodeOpen(false)
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.code === 'VISITOR_CODE_REQUIRED') {
          setCodeOpen(true)
          return
        }
        if (!(error instanceof ApiError && error.code === 'PRIVATE_RESUME')) {
          message.error(getErrorMessage(error, '简历不可访问'))
        }
        navigate('/', { replace: true })
      })
  }, [authLoading, navigate, resumeID])

  const unlock = async () => {
    setUnlocking(true)
    try {
      await unlockResume(resumeID, code)
      await loadResume()
    } catch (error) {
      message.error(getErrorMessage(error, '访客码不正确'))
    } finally {
      setUnlocking(false)
    }
  }

  if (!data) {
    return (
      <VisitorAccessGate
        code={code}
        open={codeOpen}
        unlocking={unlocking}
        onCodeChange={setCode}
        onCancel={() => navigate('/', { replace: true })}
        onUnlock={() => void unlock()}
      />
    )
  }

  return (
    <div className="h-screen min-w-260 overflow-hidden bg-[#eef0f5]">
      <header className="flex h-16 items-center border-b border-slate-200 bg-white px-6">
        <button className="brand" type="button" onClick={() => navigate('/')}>
          <span className="brand-mark"><ThunderboltOutlined /></span>
          智简 AI
        </button>
        <Text strong className="mx-auto">{data.resume.title}</Text>
        <div className="w-25" />
      </header>
      <main className="grid h-[calc(100vh-64px)] grid-cols-[340px_minmax(794px,1fr)]">
        <ResumeChatSidebar
          resumeID={resumeID}
          enabled={data.ai_enabled}
          welcomeMessage={data.welcome_message}
        />
        <section className="overflow-auto p-8">
          <div className="mx-auto w-fit">
            <ResumePaper
              resume={data.resume}
              profile={data.profile}
              educations={data.educations}
              internships={data.internships}
              workExperiences={data.work_experiences}
              projectExperiences={data.project_experiences}
              awards={data.awards}
            />
          </div>
        </section>
      </main>
    </div>
  )
}

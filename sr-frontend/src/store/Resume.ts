import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import * as resumeService from '../services/Resume'
import type {
  BasicProfileValues,
  Resume,
  ResumeStoreValue,
  UserProfile,
} from '../types/Resume'

const ResumeContext = createContext<ResumeStoreValue | null>(null)

export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [resumeList, basicProfile] = await Promise.all([
        resumeService.listResumes(),
        resumeService.getBasicProfile(),
      ])
      setResumes(resumeList)
      setProfile(basicProfile)
      setSelectedResumeId((current) =>
        resumeList.some((item) => item.id === current) ? current : (resumeList[0]?.id ?? ''),
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const createResume = useCallback(async (title?: string) => {
    const resume = await resumeService.createResume(title)
    setResumes((current) => [resume, ...current])
    setSelectedResumeId(resume.id)
    return resume
  }, [])

  const renameResume = useCallback(async (id: string, title: string) => {
    const updatedResume = await resumeService.renameResume(id, title)
    setResumes((current) =>
      current.map((item) => (item.id === updatedResume.id ? updatedResume : item)),
    )
  }, [])

  const deleteResume = useCallback(async (id: string) => {
    await resumeService.deleteResume(id)
    const refreshed = await resumeService.listResumes()
    setResumes(refreshed)
    setSelectedResumeId((current) =>
      current === id || !refreshed.some((item) => item.id === current)
        ? (refreshed[0]?.id ?? '')
        : current,
    )
  }, [])

  const saveBasicProfile = useCallback(async (values: BasicProfileValues) => {
    await resumeService.saveBasicProfile(values)
    setProfile((current) => current && { ...current, ...values })
    setResumes((current) =>
      current.map((item) =>
        item.id === values.resume_id
          ? { ...item, target_position: values.target_position }
          : item,
      ),
    )
  }, [])

  const value = useMemo<ResumeStoreValue>(() => {
    const selectedResume = resumes.find((item) => item.id === selectedResumeId) ?? null
    return {
      resumes,
      profile,
      selectedResumeId,
      selectedResume,
      loading,
      load,
      selectResume: setSelectedResumeId,
      createResume,
      renameResume,
      deleteResume,
      saveBasicProfile,
    }
  }, [
    createResume,
    deleteResume,
    load,
    loading,
    profile,
    resumes,
    renameResume,
    saveBasicProfile,
    selectedResumeId,
  ])

  return createElement(ResumeContext.Provider, { value }, children)
}

export function useResumeStore() {
  const context = useContext(ResumeContext)
  if (!context) throw new Error('useResumeStore must be used inside ResumeProvider')
  return context
}

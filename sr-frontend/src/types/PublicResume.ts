import type {
  Award,
  Education,
  Internship,
  ProjectExperience,
  Resume,
  UserProfile,
  WorkExperience,
} from './Resume'

export type ResumeAgentHistoryMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type PublicResumeData = {
  resume: Resume
  profile: UserProfile
  educations: Education[]
  internships: Internship[]
  work_experiences: WorkExperience[]
  project_experiences: ProjectExperience[]
  awards: Award[]
  ai_enabled: boolean
  welcome_message: string
}

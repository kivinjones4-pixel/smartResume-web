import type {
  Award,
  Education,
  Internship,
  ProjectExperience,
  Resume,
  UserProfile,
  WorkExperience,
} from '../../../../types/Resume'

export type ResumeTemplateData = {
  resume: Resume
  profile: UserProfile | null
  educations: Education[]
  internships: Internship[]
  workExperiences: WorkExperience[]
  projectExperiences: ProjectExperience[]
  awards: Award[]
}

export type ResumeEntryData = {
  id: string
  title: string
  subtitle: string
  time: string
  description: string
  achievements: string[]
  links: string[]
}

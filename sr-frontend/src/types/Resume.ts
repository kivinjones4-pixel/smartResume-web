export type Resume = {
  id: string
  title: string
  target_position: string | null
  target_company: string | null
  template_key: string
  language_code: string
  status: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export type UserProfile = {
  id: string
  user_id: string
  full_name: string
  avatar_url: string | null
  headline: string | null
  gender: 'male' | 'female' | 'other' | 'undisclosed' | null
  birth_date: string | null
  location: string | null
  contact_email: string | null
  contact_phone: string | null
  website_url: string | null
  github_url: string | null
  linkedin_url: string | null
  summary: string | null
  years_of_experience: number | null
}

export type BasicProfileValues = Omit<UserProfile, 'id' | 'user_id' | 'avatar_url'> & {
  resume_id: string
  target_position: string
}

export type ResumeStoreValue = {
  resumes: Resume[]
  profile: UserProfile | null
  selectedResumeId: string
  selectedResume: Resume | null
  loading: boolean
  load: () => Promise<void>
  selectResume: (id: string) => void
  createResume: (title?: string) => Promise<Resume>
  renameResume: (id: string, title: string) => Promise<void>
  deleteResume: (id: string) => Promise<void>
  saveBasicProfile: (values: BasicProfileValues) => Promise<void>
}

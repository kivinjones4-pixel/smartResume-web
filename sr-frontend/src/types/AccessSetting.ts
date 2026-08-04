export type Visibility = 'private' | 'public' | 'restricted'

export type AgentSetting = {
  language_style: 'professional' | 'friendly' | 'concise' | 'enthusiastic'
  welcome_message: string
  additional_info: string
}

export type ResumeAccessRow = {
  resume_id: string
  title: string
  target_position: string | null
  template_key: string
  visibility: Visibility
  visitor_code: string | null
  ai_enabled: boolean
  visible_fields: string[]
}

export type AccessSettingsData = {
  agent_setting: AgentSetting
  resumes: ResumeAccessRow[]
}

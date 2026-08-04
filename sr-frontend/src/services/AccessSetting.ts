import { http } from './request'
import type { AccessSettingsData, AgentSetting, ResumeAccessRow, Visibility } from '../types/AccessSetting'

export const getAccessSettings = () => http.get<AccessSettingsData>('/api/v1/access-settings')

export async function saveAgentSetting(values: AgentSetting) {
  const result = await http.put<{ agent_setting: AgentSetting }>('/api/v1/access-settings/agent', values)
  return result.agent_setting
}

export async function updateResumeAccess(
  resumeId: string,
  values: Partial<Pick<ResumeAccessRow, 'ai_enabled' | 'visible_fields'>> & { visibility?: Visibility },
) {
  const result = await http.patch<{ setting: Omit<ResumeAccessRow, 'title' | 'target_position' | 'template_key'> }>(
    `/api/v1/access-settings/resumes/${encodeURIComponent(resumeId)}`,
    values,
  )
  return result.setting
}

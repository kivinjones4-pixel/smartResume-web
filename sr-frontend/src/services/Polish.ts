import type { ResumeModuleKey } from '../types/ResumeWorkspace'
import { http } from './request'

export type PolishableModule = Exclude<ResumeModuleKey, 'profile'>

export type PolishRecordRequest = {
  module: PolishableModule
  context: Record<string, string>
  content: Record<string, string>
}

export async function polishResumeRecord(payload: PolishRecordRequest) {
  return http.post<{ content: Record<string, string> }>('/api/v1/ai-polish/record', payload)
}

export type ResumePolishItem = PolishRecordRequest & { record_id: string }

export type PolishSuggestion = {
  id: string
  module: PolishableModule
  record_id: string
  field: 'description' | 'achievements'
  original: string
  suggested: string
  reason: string
}

export async function polishWholeResume(payload: {
  target_position: string
  items: ResumePolishItem[]
}) {
  return http.post<{ suggestions: PolishSuggestion[] }>('/api/v1/ai-polish/resume', payload)
}

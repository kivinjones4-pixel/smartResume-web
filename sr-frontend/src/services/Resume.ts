import type { BasicProfileValues, Resume, UserProfile } from '../types/Resume'
import { http } from './request'

export async function listResumes() {
  const response = await http.get<{ resumes: Resume[] }>('/api/v1/resumes')
  return response.resumes
}

export async function createResume(title = '未命名简历') {
  const response = await http.post<{ resume: Resume }>('/api/v1/resumes', { title })
  return response.resume
}

export async function renameResume(id: string, title: string) {
  const response = await http.patch<{ resume: Resume }>(
    `/api/v1/resumes/${encodeURIComponent(id)}`,
    { title },
  )
  return response.resume
}

export function deleteResume(id: string) {
  return http.delete<void>(`/api/v1/resumes/${encodeURIComponent(id)}`)
}

export async function getBasicProfile() {
  const response = await http.get<{ profile: UserProfile }>('/api/v1/profile/basic')
  return response.profile
}

export function saveBasicProfile(values: BasicProfileValues) {
  return http.put<{ message: string }>('/api/v1/profile/basic', values)
}

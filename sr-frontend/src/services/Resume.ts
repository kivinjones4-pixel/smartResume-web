import type {
  BasicProfileValues,
  Education,
  Internship,
  Resume,
  SaveEducationValues,
  SaveInternshipValues,
  UserProfile,
} from '../types/Resume'
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

export async function listEducations(resumeId: string) {
  const response = await http.get<{ educations: Education[] | null }>(
    `/api/v1/educations?resume_id=${encodeURIComponent(resumeId)}`,
  )
  return response.educations ?? []
}

export async function listAllEducations() {
  const response = await http.get<{ educations: Education[] | null }>('/api/v1/educations')
  return response.educations ?? []
}

export async function createEducation(values: SaveEducationValues) {
  const response = await http.post<{ education: Education }>('/api/v1/educations', values)
  return response.education
}

export async function updateEducation(id: string, values: SaveEducationValues) {
  const response = await http.put<{ education: Education }>(
    `/api/v1/educations/${encodeURIComponent(id)}`,
    values,
  )
  return response.education
}

export function deleteEducation(id: string) {
  return http.delete<void>(`/api/v1/educations/${encodeURIComponent(id)}`)
}

export function attachEducation(resumeId: string, educationId: string) {
  return http.post<void>(
    `/api/v1/resumes/${encodeURIComponent(resumeId)}/educations/${encodeURIComponent(educationId)}`,
  )
}

export function detachEducation(resumeId: string, educationId: string) {
  return http.delete<void>(
    `/api/v1/resumes/${encodeURIComponent(resumeId)}/educations/${encodeURIComponent(educationId)}`,
  )
}

export async function listInternships(resumeId: string) {
  const response = await http.get<{ internships: Internship[] | null }>(
    `/api/v1/internships?resume_id=${encodeURIComponent(resumeId)}`,
  )
  return response.internships ?? []
}

export async function listAllInternships() {
  const response = await http.get<{ internships: Internship[] | null }>('/api/v1/internships')
  return response.internships ?? []
}

export async function createInternship(values: SaveInternshipValues) {
  const response = await http.post<{ internship: Internship }>('/api/v1/internships', values)
  return response.internship
}

export async function updateInternship(id: string, values: SaveInternshipValues) {
  const response = await http.put<{ internship: Internship }>(
    `/api/v1/internships/${encodeURIComponent(id)}`,
    values,
  )
  return response.internship
}

export function deleteInternship(id: string) {
  return http.delete<void>(`/api/v1/internships/${encodeURIComponent(id)}`)
}

export function attachInternship(resumeId: string, internshipId: string) {
  return http.post<void>(
    `/api/v1/resumes/${encodeURIComponent(resumeId)}/internships/${encodeURIComponent(internshipId)}`,
  )
}

export function detachInternship(resumeId: string, internshipId: string) {
  return http.delete<void>(
    `/api/v1/resumes/${encodeURIComponent(resumeId)}/internships/${encodeURIComponent(internshipId)}`,
  )
}

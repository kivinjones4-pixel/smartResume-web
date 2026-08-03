import type {
  Award,
  BasicProfileValues,
  Education,
  Internship,
  ProjectExperience,
  Resume,
  SaveEducationValues,
  SaveAwardValues,
  SaveInternshipValues,
  SaveProjectValues,
  SaveWorkValues,
  UserProfile,
  WorkExperience,
} from '../types/Resume'
import { http } from './request'

export async function listResumes() {
  const response = await http.get<{ resumes: Resume[] }>('/api/v1/resumes')
  return response.resumes
}

export async function createResume(title = '未命名简历', templateKey = 'default') {
  const response = await http.post<{ resume: Resume }>('/api/v1/resumes', {
    title,
    template_key: templateKey,
  })
  return response.resume
}

export async function renameResume(id: string, title: string) {
  const response = await http.patch<{ resume: Resume }>(
    `/api/v1/resumes/${encodeURIComponent(id)}`,
    { title },
  )
  return response.resume
}

export async function updateResumeTemplate(id: string, templateKey: string) {
  const response = await http.patch<{ resume: Resume }>(
    `/api/v1/resumes/${encodeURIComponent(id)}`,
    { template_key: templateKey },
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

export async function listWorkExperiences(resumeId: string) {
  const response = await http.get<{ work_experiences: WorkExperience[] | null }>(
    `/api/v1/work-experiences?resume_id=${encodeURIComponent(resumeId)}`,
  )
  return response.work_experiences ?? []
}

export async function listAllWorkExperiences() {
  const response = await http.get<{ work_experiences: WorkExperience[] | null }>(
    '/api/v1/work-experiences',
  )
  return response.work_experiences ?? []
}

export async function createWorkExperience(values: SaveWorkValues) {
  const response = await http.post<{ work_experience: WorkExperience }>(
    '/api/v1/work-experiences',
    values,
  )
  return response.work_experience
}

export async function updateWorkExperience(id: string, values: SaveWorkValues) {
  const response = await http.put<{ work_experience: WorkExperience }>(
    `/api/v1/work-experiences/${encodeURIComponent(id)}`,
    values,
  )
  return response.work_experience
}

export function deleteWorkExperience(id: string) {
  return http.delete<void>(`/api/v1/work-experiences/${encodeURIComponent(id)}`)
}

export function attachWorkExperience(resumeId: string, workId: string) {
  return http.post<void>(
    `/api/v1/resumes/${encodeURIComponent(resumeId)}/work-experiences/${encodeURIComponent(workId)}`,
  )
}

export function detachWorkExperience(resumeId: string, workId: string) {
  return http.delete<void>(
    `/api/v1/resumes/${encodeURIComponent(resumeId)}/work-experiences/${encodeURIComponent(workId)}`,
  )
}

export async function listProjectExperiences(resumeId: string) {
  const response = await http.get<{ project_experiences: ProjectExperience[] | null }>(
    `/api/v1/project-experiences?resume_id=${encodeURIComponent(resumeId)}`,
  )
  return response.project_experiences ?? []
}

export async function listAllProjectExperiences() {
  const response = await http.get<{ project_experiences: ProjectExperience[] | null }>(
    '/api/v1/project-experiences',
  )
  return response.project_experiences ?? []
}

export async function createProjectExperience(values: SaveProjectValues) {
  const response = await http.post<{ project_experience: ProjectExperience }>(
    '/api/v1/project-experiences',
    values,
  )
  return response.project_experience
}

export async function updateProjectExperience(id: string, values: SaveProjectValues) {
  const response = await http.put<{ project_experience: ProjectExperience }>(
    `/api/v1/project-experiences/${encodeURIComponent(id)}`,
    values,
  )
  return response.project_experience
}

export function deleteProjectExperience(id: string) {
  return http.delete<void>(`/api/v1/project-experiences/${encodeURIComponent(id)}`)
}

export function attachProjectExperience(resumeId: string, projectId: string) {
  return http.post<void>(
    `/api/v1/resumes/${encodeURIComponent(resumeId)}/project-experiences/${encodeURIComponent(projectId)}`,
  )
}

export function detachProjectExperience(resumeId: string, projectId: string) {
  return http.delete<void>(
    `/api/v1/resumes/${encodeURIComponent(resumeId)}/project-experiences/${encodeURIComponent(projectId)}`,
  )
}

export async function listAwards(resumeId: string) {
  const response = await http.get<{ awards: Award[] | null }>(
    `/api/v1/awards?resume_id=${encodeURIComponent(resumeId)}`,
  )
  return response.awards ?? []
}

export async function listAllAwards() {
  const response = await http.get<{ awards: Award[] | null }>('/api/v1/awards')
  return response.awards ?? []
}

export async function createAward(values: SaveAwardValues) {
  const response = await http.post<{ award: Award }>('/api/v1/awards', values)
  return response.award
}

export async function updateAward(id: string, values: SaveAwardValues) {
  const response = await http.put<{ award: Award }>(
    `/api/v1/awards/${encodeURIComponent(id)}`,
    values,
  )
  return response.award
}

export function deleteAward(id: string) {
  return http.delete<void>(`/api/v1/awards/${encodeURIComponent(id)}`)
}

export function attachAward(resumeId: string, awardId: string) {
  return http.post<void>(
    `/api/v1/resumes/${encodeURIComponent(resumeId)}/awards/${encodeURIComponent(awardId)}`,
  )
}

export function detachAward(resumeId: string, awardId: string) {
  return http.delete<void>(
    `/api/v1/resumes/${encodeURIComponent(resumeId)}/awards/${encodeURIComponent(awardId)}`,
  )
}

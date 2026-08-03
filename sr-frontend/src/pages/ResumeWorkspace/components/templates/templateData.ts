import type { ResumeEntryData, ResumeTemplateData } from './types'

export function hasText(value: string | null | undefined): value is string {
  return Boolean(value?.trim())
}

export function dateRange(start: string | null, end: string | null, isCurrent: boolean) {
  return [formatMonth(start), isCurrent ? '至今' : formatMonth(end)].filter(hasText).join(' — ')
}

function formatMonth(value: string | null) {
  if (!value) return ''
  const [year, month] = value.slice(0, 7).split('-')
  return month ? `${year}.${month}` : year
}

export function getContacts(profile: ResumeTemplateData['profile']) {
  return [
    profile?.location,
    profile?.contact_phone,
    profile?.contact_email,
    profile?.website_url,
    profile?.github_url,
    profile?.linkedin_url,
  ].filter(hasText)
}

export function getTemplateSections(data: ResumeTemplateData) {
  const sections: { key: string; title: string; entries: ResumeEntryData[] }[] = [
    {
      key: 'education',
      title: '教育经历',
      entries: data.educations.map((item) => ({
        id: item.id,
        title: [item.school_name, item.field_of_study].filter(hasText).join('｜'),
        subtitle: [item.degree, item.location, item.gpa && `GPA ${item.gpa}`].filter(hasText).join(' · '),
        time: dateRange(item.start_date, item.end_date, item.is_current),
        description: item.description ?? '',
        achievements: [],
        links: [],
      })),
    },
    {
      key: 'internship',
      title: '实习经历',
      entries: data.internships.map(companyEntry),
    },
    {
      key: 'work',
      title: '工作经历',
      entries: data.workExperiences.map(companyEntry),
    },
    {
      key: 'project',
      title: '项目经历',
      entries: data.projectExperiences.map((item) => ({
        id: item.id,
        title: [item.project_name, item.role_name].filter(hasText).join('｜'),
        subtitle: '',
        time: dateRange(item.start_date, item.end_date, item.is_current),
        description: item.description ?? '',
        achievements: item.achievements,
        links: [item.project_url, item.repository_url].filter(hasText),
      })),
    },
    {
      key: 'award',
      title: '获奖记录',
      entries: data.awards.map((item) => ({
        id: item.id,
        title: item.award_name,
        subtitle: item.issuer,
        time: '',
        description: item.description ?? '',
        achievements: [],
        links: [item.certificate_url].filter(hasText),
      })),
    },
  ]
  return sections.filter((section) => section.entries.length > 0)
}

function companyEntry(item: ResumeTemplateData['internships'][number]): ResumeEntryData {
  return {
    id: item.id,
    title: [item.company_name, item.position_title].filter(hasText).join('｜'),
    subtitle: [item.department, item.location].filter(hasText).join(' · '),
    time: dateRange(item.start_date, item.end_date, item.is_current),
    description: item.description ?? '',
    achievements: item.achievements,
    links: [],
  }
}

import type { ResumeEntryData, ResumeTemplateData } from './types'
import { getContacts, getTemplateSections, hasText } from './templateData'
import PolishMark from './PolishMark'

export default function ProfessionalResumeTemplate(data: ResumeTemplateData) {
  const { profile, resume } = data
  return (
    <article className="resume-template bg-white px-13 py-11 font-sans text-slate-700">
      {profile && <header className="border-b border-slate-800 pb-5 text-center"><h1 className="m-0 text-[28px] font-semibold tracking-[0.18em] text-slate-900">{profile.full_name}</h1>{hasText(resume.target_position) && <p className="mt-2 mb-0 text-[12px] font-semibold tracking-widest text-slate-600">{resume.target_position}</p>}{hasText(profile.headline) && <p className="mt-2 mb-0 text-[10px] text-slate-500">{profile.headline}</p>}<p className="mt-3 mb-0 break-all text-[10px] text-slate-500">{getContacts(profile).join('  |  ')}</p></header>}
      {getTemplateSections(data).map((section) => <section className="mt-6" key={section.key}><h2 className="mb-3 border-b border-slate-300 pb-1.5 text-[13px] font-bold tracking-[0.15em] text-slate-900">{section.title}</h2><div className="space-y-3">{section.entries.map((entry) => <ProfessionalEntry key={entry.id} entry={entry} suggestionKeys={data.polishSuggestionKeys} />)}</div></section>)}
      {hasText(profile?.summary) && <section className="mt-6"><h2 className="mb-3 border-b border-slate-300 pb-1.5 text-[13px] font-bold tracking-[0.15em] text-slate-900">个人优势</h2><p className="m-0 whitespace-pre-line text-[10.5px] leading-[1.85]">{profile.summary}</p></section>}
    </article>
  )
}

function ProfessionalEntry({ entry, suggestionKeys }: { entry: ResumeEntryData; suggestionKeys?: string[] }) {
  const marked = (field: string) => suggestionKeys?.includes(`${entry.module}:${entry.id}:${field}`) ?? false
  return <div><div className="flex justify-between gap-4 text-[11.5px]"><b className="text-slate-900">{entry.title}</b>{entry.time && <span className="shrink-0 tabular-nums text-slate-500">{entry.time}</span>}</div>{entry.subtitle && <p className="my-0.5 text-[10px] font-medium text-slate-500">{entry.subtitle}</p>}{entry.description && <p className="mt-1 mb-0 whitespace-pre-line text-[10.5px] leading-[1.75]">{entry.description}<PolishMark visible={marked('description')} /></p>}{entry.achievements.filter(hasText).length > 0 && <div className="flex items-start"><ul className="mt-1 mb-0 flex-1 list-square space-y-0.5 pl-4 text-[10.5px] leading-[1.7]">{entry.achievements.filter(hasText).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul><PolishMark visible={marked('achievements')} /></div>}{entry.links.length > 0 && <p className="mt-1 break-all text-[9px] text-slate-500">{entry.links.join(' | ')}</p>}</div>
}

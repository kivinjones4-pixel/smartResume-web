import type { ResumeEntryData, ResumeTemplateData } from './types'
import { getContacts, getTemplateSections, hasText } from './templateData'

export default function TraditionalResumeTemplate(data: ResumeTemplateData) {
  const { profile, resume } = data
  return (
    <article className="min-h-240 w-180 bg-[#fffefa] px-15 py-12 font-serif text-[#222] shadow-[0_8px_30px_rgba(49,54,79,0.12)]">
      {profile && <header className="border-y-4 border-double border-[#333] py-6 text-center"><h1 className="m-0 text-[29px] font-bold tracking-[0.3em]">{profile.full_name}</h1>{hasText(resume.target_position) && <p className="mt-2 mb-0 text-[13px] font-bold">应聘岗位：{resume.target_position}</p>}{hasText(profile.headline) && <p className="mt-2 mb-0 text-[10.5px]">{profile.headline}</p>}<p className="mt-3 mb-0 break-all text-[10px]">{getContacts(profile).join('　|　')}</p></header>}
      {getTemplateSections(data).map((section) => <section className="mt-6" key={section.key}><h2 className="mb-3 border-b-2 border-[#444] pb-1 text-[14px] font-bold tracking-[0.2em]">{section.title}</h2>{section.entries.map((entry) => <TraditionalEntry key={entry.id} entry={entry} />)}</section>)}
      {hasText(profile?.summary) && <section className="mt-6"><h2 className="mb-3 border-b-2 border-[#444] pb-1 text-[14px] font-bold tracking-[0.2em]">个人优势</h2><p className="m-0 whitespace-pre-line text-[11px] leading-[2]">{profile.summary}</p></section>}
    </article>
  )
}

function TraditionalEntry({ entry }: { entry: ResumeEntryData }) {
  return <div className="mb-4 last:mb-0"><div className="grid grid-cols-[1fr_auto] gap-5 text-[11.5px]"><b>{entry.title}</b>{entry.time && <span className="tabular-nums">{entry.time}</span>}</div>{entry.subtitle && <p className="mt-0.5 mb-0 text-[10px]">{entry.subtitle}</p>}{entry.description && <p className="mt-1 mb-0 whitespace-pre-line text-[10.5px] leading-[1.9]">{entry.description}</p>}{entry.achievements.filter(hasText).length > 0 && <ol className="mt-1 mb-0 space-y-0.5 pl-5 text-[10.5px] leading-[1.8]">{entry.achievements.filter(hasText).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ol>}{entry.links.length > 0 && <p className="mt-1 break-all text-[9px] underline">{entry.links.join('；')}</p>}</div>
}

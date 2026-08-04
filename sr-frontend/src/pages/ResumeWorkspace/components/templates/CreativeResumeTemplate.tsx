import type { ResumeEntryData, ResumeTemplateData } from './types'
import { getContacts, getTemplateSections, hasText } from './templateData'
import PolishMark from './PolishMark'

export default function CreativeResumeTemplate(data: ResumeTemplateData) {
  const { profile, resume } = data
  const sections = getTemplateSections(data)
  return (
    <article className="resume-template overflow-hidden bg-[#fffdf9] text-[#2f2942]">
      <header className="relative overflow-hidden bg-[#382f63] px-13 py-10 text-white"><span className="absolute -top-12 -right-8 h-40 w-40 rounded-full bg-[#ff7a66] opacity-90" /><span className="absolute right-25 -bottom-20 h-32 w-32 rotate-45 rounded-3xl bg-[#f5c451] opacity-80" />{profile && <div className="relative z-10 max-w-115"><p className="m-0 text-[10px] font-semibold tracking-[0.3em] text-[#f5c451]">CURRICULUM VITAE</p><h1 className="mt-3 mb-0 text-[34px] font-black tracking-wide">{profile.full_name}</h1>{hasText(resume.target_position) && <p className="mt-2 mb-0 text-[14px] text-purple-100">{resume.target_position}</p>}{hasText(profile.headline) && <p className="mt-2 mb-0 text-[10px] text-purple-200">{profile.headline}</p>}</div>}</header>
      <div className="grid grid-cols-[155px_1fr]">
        <aside className="bg-[#eee9ff] px-6 py-8"><h2 className="mb-3 text-[11px] font-black tracking-widest text-[#5a45a2]">联系方式</h2><div className="space-y-2 break-all text-[9px] leading-[1.6] text-[#625978]">{getContacts(profile).map((contact) => <p className="m-0" key={contact}>{contact}</p>)}</div></aside>
        <div className="px-9 py-8">{sections.map((section, sectionIndex) => <section className="mb-6" key={section.key}><h2 className="mb-3 flex items-center gap-2 text-[13px] font-black text-[#382f63]"><span className={`grid h-5 w-5 place-items-center rounded-full text-[9px] text-white ${sectionIndex % 2 ? 'bg-[#ff7a66]' : 'bg-[#6b55b9]'}`}>{sectionIndex + 1}</span>{section.title}</h2><div className="border-l-2 border-[#ded7f6] pl-4">{section.entries.map((entry) => <CreativeEntry key={entry.id} entry={entry} suggestionKeys={data.polishSuggestionKeys} />)}</div></section>)}{hasText(profile?.summary) && <section><h2 className="mb-3 flex items-center gap-2 text-[13px] font-black text-[#382f63]"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#ff7a66] text-[9px] text-white">{sections.length + 1}</span>个人优势</h2><p className="m-0 whitespace-pre-line border-l-2 border-[#ded7f6] pl-4 text-[10px] leading-[1.75] text-[#625978]">{profile.summary}</p></section>}</div>
      </div>
    </article>
  )
}

function CreativeEntry({ entry, suggestionKeys }: { entry: ResumeEntryData; suggestionKeys?: string[] }) {
  const marked = (field: string) => suggestionKeys?.includes(`${entry.module}:${entry.id}:${field}`) ?? false
  return <div className="relative mb-4 last:mb-0"><span className="absolute top-1 -left-[21px] h-2 w-2 rounded-full bg-[#ff7a66]" /><div className="flex justify-between gap-3"><b className="text-[11.5px] text-[#382f63]">{entry.title}</b>{entry.time && <span className="shrink-0 rounded-full bg-[#f6e3dd] px-2 py-0.5 text-[8.5px] text-[#a54e40]">{entry.time}</span>}</div>{entry.subtitle && <p className="mt-0.5 mb-0 text-[9.5px] font-semibold text-[#7b6ba5]">{entry.subtitle}</p>}{entry.description && <p className="mt-1 mb-0 whitespace-pre-line text-[10px] leading-[1.7] text-[#625978]">{entry.description}<PolishMark visible={marked('description')} /></p>}{entry.achievements.filter(hasText).length > 0 && <div className="flex items-start"><ul className="mt-1 flex-1 list-disc space-y-0.5 pl-4 text-[10px] leading-[1.65] text-[#625978]">{entry.achievements.filter(hasText).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul><PolishMark visible={marked('achievements')} /></div>}{entry.links.length > 0 && <p className="mt-1 break-all text-[8.5px] text-[#6b55b9]">{entry.links.join(' · ')}</p>}</div>
}

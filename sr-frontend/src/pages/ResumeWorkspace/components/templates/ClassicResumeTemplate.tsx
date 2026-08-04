import type { ResumeEntryData, ResumeTemplateData } from './types'
import { getContacts, getTemplateSections, hasText } from './templateData'
import PolishMark from './PolishMark'

export default function ClassicResumeTemplate(data: ResumeTemplateData) {
  const { profile, resume } = data
  const contacts = getContacts(profile)
  return (
    <article className="min-h-240 w-180 bg-white px-14 py-12 text-[#343a4a] shadow-[0_8px_30px_rgba(49,54,79,0.12)]">
      {profile && (
        <header className="flex items-start justify-between border-b-2 border-indigo-500 pb-7">
          <div className="min-w-0 pr-5">
            <h1 className="m-0 text-[30px] font-bold tracking-wide text-slate-800">{profile.full_name}</h1>
            {hasText(resume.target_position) && <p className="mt-2 mb-0 text-[14px] font-medium text-indigo-600">{resume.target_position}</p>}
            {hasText(profile.headline) && <p className="mt-2 mb-0 text-[11px] text-slate-600">{profile.headline}</p>}
            {contacts.length > 0 && <p className="mt-3 mb-0 break-all text-[11px] text-slate-500">{contacts.join(' · ')}</p>}
          </div>
          <Avatar profile={profile} />
        </header>
      )}
      {getTemplateSections(data).map((section) => (
        <section className="mt-7" key={section.key}>
          <h2 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-slate-800"><span className="h-4 w-1 rounded bg-indigo-500" />{section.title}</h2>
          <div className="text-[11px] leading-[1.9] text-slate-600">{section.entries.map((entry) => <ClassicEntry key={entry.id} entry={entry} suggestionKeys={data.polishSuggestionKeys} />)}</div>
        </section>
      ))}
      {hasText(profile?.summary) && <section className="mt-7"><h2 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-slate-800"><span className="h-4 w-1 rounded bg-indigo-500" />个人优势</h2><p className="m-0 whitespace-pre-line text-[11px] leading-[1.9] text-slate-600">{profile.summary}</p></section>}
    </article>
  )
}

function Avatar({ profile }: { profile: NonNullable<ResumeTemplateData['profile']> }) {
  return profile.avatar_url ? <img className="h-18 w-18 rounded-full object-cover" src={profile.avatar_url} alt="头像" /> : <div className="grid h-18 w-18 shrink-0 place-items-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-500">{profile.full_name.trim().slice(-2) || '简历'}</div>
}

function ClassicEntry({ entry, suggestionKeys }: { entry: ResumeEntryData; suggestionKeys?: string[] }) {
  return <div className="mb-4 last:mb-0"><div className="flex items-start justify-between gap-4"><b className="text-[13px] text-slate-700">{entry.title}</b>{entry.time && <span className="shrink-0 text-[11px] text-slate-400">{entry.time}</span>}</div>{entry.subtitle && <p className="mt-0.5 mb-0 text-slate-500">{entry.subtitle}</p>}{entry.description && <p className="mt-1.5 mb-0 whitespace-pre-line">{entry.description}<PolishMark visible={hasSuggestion(suggestionKeys, entry, 'description')} /></p>}<Details entry={entry} suggestionKeys={suggestionKeys} /></div>
}

function Details({ entry, suggestionKeys }: { entry: ResumeEntryData; suggestionKeys?: string[] }) {
  return <>{entry.achievements.filter(hasText).length > 0 && <div className="flex items-start"><ul className="mt-1.5 mb-0 flex-1 list-disc space-y-0.5 pl-4">{entry.achievements.filter(hasText).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul><PolishMark visible={hasSuggestion(suggestionKeys, entry, 'achievements')} /></div>}{entry.links.length > 0 && <p className="mt-1 break-all text-indigo-500">{entry.links.join(' · ')}</p>}</>
}

function hasSuggestion(keys: string[] | undefined, entry: ResumeEntryData, field: string) {
  return keys?.includes(`${entry.module}:${entry.id}:${field}`) ?? false
}

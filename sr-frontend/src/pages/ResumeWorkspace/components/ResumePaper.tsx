import ClassicResumeTemplate from './templates/ClassicResumeTemplate'
import CreativeResumeTemplate from './templates/CreativeResumeTemplate'
import ProfessionalResumeTemplate from './templates/ProfessionalResumeTemplate'
import TraditionalResumeTemplate from './templates/TraditionalResumeTemplate'
import type { ResumeTemplateData } from './templates/types'
import { forwardRef, type CSSProperties } from 'react'

const templateRenderers: Record<string, React.ComponentType<ResumeTemplateData>> = {
  default: ClassicResumeTemplate,
  professional: ProfessionalResumeTemplate,
  creative: CreativeResumeTemplate,
  traditional: TraditionalResumeTemplate,
}

const ResumePaper = forwardRef<HTMLDivElement, ResumeTemplateData>(function ResumePaper(props, ref) {
  const Template = templateRenderers[props.resume.template_key] ?? ClassicResumeTemplate
  return (
    <div
      ref={ref}
      className="resume-paper"
      data-resume-paper
      style={{
        '--resume-letter-spacing': `${props.resume.theme_config?.layout?.letter_spacing ?? 0}px`,
        '--resume-module-spacing': `${props.resume.theme_config?.layout?.module_spacing ?? 24}px`,
        '--resume-line-spacing': props.resume.theme_config?.layout?.line_spacing ?? 1.8,
      } as CSSProperties}
    >
      <Template {...props} />
    </div>
  )
})

export default ResumePaper

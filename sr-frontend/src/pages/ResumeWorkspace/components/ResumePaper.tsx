import ClassicResumeTemplate from './templates/ClassicResumeTemplate'
import CreativeResumeTemplate from './templates/CreativeResumeTemplate'
import ProfessionalResumeTemplate from './templates/ProfessionalResumeTemplate'
import TraditionalResumeTemplate from './templates/TraditionalResumeTemplate'
import type { ResumeTemplateData } from './templates/types'

const templateRenderers: Record<string, React.ComponentType<ResumeTemplateData>> = {
  default: ClassicResumeTemplate,
  professional: ProfessionalResumeTemplate,
  creative: CreativeResumeTemplate,
  traditional: TraditionalResumeTemplate,
}

export default function ResumePaper(props: ResumeTemplateData) {
  const Template = templateRenderers[props.resume.template_key] ?? ClassicResumeTemplate
  return <Template {...props} />
}

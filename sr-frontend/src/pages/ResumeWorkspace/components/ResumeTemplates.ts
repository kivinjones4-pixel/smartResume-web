export const RESUME_TEMPLATES = [
  {
    key: 'default',
    name: '经典单栏',
    description: '清晰、稳重的单栏结构，适合多数岗位',
  },
  {
    key: 'professional',
    name: '简洁专业风',
    description: '排版干净、重点突出，适合互联网、金融、咨询和企业职能岗位',
  },
  {
    key: 'creative',
    name: '创意设计风',
    description: '色彩与排版更具视觉亮点，适合设计、广告和传媒岗位',
  },
  {
    key: 'traditional',
    name: '稳重传统风',
    description: '结构严谨、文字为主，适合国企、公务员、教育和医疗岗位',
  },
] as const

export type ResumeTemplateKey = (typeof RESUME_TEMPLATES)[number]['key']

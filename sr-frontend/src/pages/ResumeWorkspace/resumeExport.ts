export type ResumeExportType = 'pdf' | 'word' | 'image'

const A4_WIDTH = 794
const A4_HEIGHT = 1123

function safeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || '简历'
}

function collectStyles() {
  return Array.from(document.styleSheets).map((sheet) => {
    try {
      return Array.from(sheet.cssRules).map((rule) => rule.cssText).join('\n')
    } catch {
      return ''
    }
  }).join('\n')
}

function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function documentHtml(element: HTMLElement, title: string, extraStyles = '') {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${collectStyles()}\n${extraStyles}</style></head><body>${element.outerHTML}</body></html>`
}

async function exportImage(element: HTMLElement, fileName: string) {
  const height = Math.max(element.scrollHeight, A4_HEIGHT)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${A4_WIDTH}" height="${height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml"><style>${collectStyles()}</style>${element.outerHTML}</div></foreignObject></svg>`
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const image = new Image()
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('图片渲染失败'))
      image.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = A4_WIDTH * 2
    canvas.height = height * 2
    const context = canvas.getContext('2d')
    if (!context) throw new Error('浏览器不支持画布导出')
    context.scale(2, 2)
    context.drawImage(image, 0, 0)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('图片生成失败')
    download(blob, `${fileName}.png`)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function exportResume(element: HTMLElement, title: string, type: ResumeExportType) {
  const fileName = safeFileName(title)
  if (type === 'image') return exportImage(element, fileName)
  if (type === 'word') {
    const html = documentHtml(element, title)
    download(new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' }), `${fileName}.doc`)
    return
  }

  const frame = document.createElement('iframe')
  frame.style.position = 'fixed'
  frame.style.width = '0'
  frame.style.height = '0'
  frame.style.border = '0'
  document.body.appendChild(frame)
  const target = frame.contentDocument
  if (!target) throw new Error('无法创建 PDF 打印页面')
  target.open()
  target.write(documentHtml(element, title, '@page{size:A4;margin:0}html,body{margin:0!important;background:#fff!important}.resume-paper{box-shadow:none!important}.resume-paper::after{display:none!important}'))
  target.close()
  await new Promise((resolve) => window.setTimeout(resolve, 250))
  frame.contentWindow?.focus()
  frame.contentWindow?.print()
  window.setTimeout(() => frame.remove(), 1000)
}

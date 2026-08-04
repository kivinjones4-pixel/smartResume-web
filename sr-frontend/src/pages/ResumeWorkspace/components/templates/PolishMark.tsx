export default function PolishMark({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <span
      className="ml-2 inline-flex h-4 min-w-4 translate-y-px items-center justify-center rounded-full bg-violet-600 px-1 text-[8px] font-bold leading-none text-white shadow-sm shadow-violet-300"
      title="此处有 AI 润色建议"
    >
      AI
    </span>
  )
}

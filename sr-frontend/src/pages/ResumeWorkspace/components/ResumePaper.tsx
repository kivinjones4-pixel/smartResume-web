type ResumePaperProps = {
  title: string
}

export default function ResumePaper({ title }: ResumePaperProps) {
  return (
    <article className="min-h-240 w-180 bg-white px-14 py-12 text-[#343a4a] shadow-[0_8px_30px_rgba(49,54,79,0.12)]">
      <header className="flex items-start justify-between border-b-2 border-indigo-500 pb-7">
        <div>
          <h1 className="m-0 text-[30px] font-bold tracking-wide text-slate-800">佳卓</h1>
          <p className="mt-2 mb-0 text-[14px] font-medium text-indigo-600">高级产品经理</p>
          <p className="mt-3 text-[11px] text-slate-500">
            深圳 · 138 0000 0000 · jiazhuo@example.com
          </p>
        </div>
        <div className="grid h-18 w-18 place-items-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-500">
          JZ
        </div>
      </header>

      <ResumeSection title="个人优势">
        <p>
          6 年互联网产品经验，专注 AI 产品与企业效率工具，擅长从复杂业务中提炼核心需求，
          具备从用户研究、产品规划到商业化落地的完整经验。
        </p>
      </ResumeSection>
      <ResumeSection title="工作经历">
        <ResumeEntry
          title="智云科技｜高级产品经理"
          time="2022.06 — 至今"
          text="主导智能化产品从 0 到 1 落地，重构核心使用流程，推动业务转化率提升 32%；协同算法、研发和市场团队完成三次关键版本迭代。"
        />
        <ResumeEntry
          title="星海科技｜产品经理"
          time="2019.07 — 2022.05"
          text="负责企业协作产品规划，通过用户分层和数据分析提升重点功能使用率，服务超过 200 家企业客户。"
        />
      </ResumeSection>
      <ResumeSection title="项目经历">
        <ResumeEntry
          title="AI 智能简历与个人数字人平台"
          time="产品负责人"
          text="设计 AI 简历 Copilot 与双 Agent 交互引擎，支持 ATS 优化、实时 Diff、多租户 RAG 检索及流式问答。"
        />
      </ResumeSection>
      <ResumeSection title="教育经历">
        <ResumeEntry
          title="华南理工大学｜计算机科学与技术"
          time="2015.09 — 2019.06"
          text="本科 · 校级优秀毕业生"
        />
      </ResumeSection>
      <footer className="mt-10 border-t border-slate-100 pt-3 text-right text-[9px] text-slate-300">
        {title} · 智简 AI 生成
      </footer>
    </article>
  )
}

function ResumeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="mb-3 flex items-center gap-2 text-[14px] font-bold text-slate-800">
        <span className="h-4 w-1 rounded bg-indigo-500" />
        {title}
      </h2>
      <div className="text-[11px] leading-[1.9] text-slate-600">{children}</div>
    </section>
  )
}

function ResumeEntry({
  title,
  time,
  text,
}: {
  title: string
  time: string
  text: string
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <b className="text-[12px] text-slate-700">{title}</b>
        <span className="text-[10px] text-slate-400">{time}</span>
      </div>
      <p className="mt-1.5 mb-0">{text}</p>
    </div>
  )
}

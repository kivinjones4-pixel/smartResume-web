# 当前行为基线

状态：observed，2026-09-08。依据源码静态检查；没有新增运行验收。后续变更应保留仍适用的行为，并明确修改项。

## FE-001 编辑与建议确认

工作区支持经历编辑、模板预览和润色建议处理。整份润色展示原文、建议及原因，接受操作才保存对应内容。

### FE-001-S1 用户忽略建议

- Given 已返回润色建议。
- When 用户选择忽略。
- Then 移除该候选建议，不因忽略动作将建议写入经历数据。

证据：`sr-frontend/src/pages/ResumeWorkspace/ResumeWorkspace.tsx`。导出边界：PDF 为浏览器打印，Word 为 HTML .doc，图片为 Canvas 输出；不是原生 DOCX 生成。

## AUTH-001 请求刷新

普通请求通过统一请求层携带认证信息；同一页面内并发 401 共享 refreshPromise，每个原请求最多自动刷新重试一次。

### AUTH-001-S1 刷新失败

- Given Access Token 失效。
- When 刷新未成功。
- Then 返回错误，不无限递归重试。

证据：`sr-frontend/src/services/request.ts`。已知缺口：后端刷新令牌轮换尚需原子化，前端合并不能保障跨标签页或直接 API 并发安全。

## DATA-001 经历归属

经历属于用户，可通过关联表加入简历；以教育模块为例，创建记录与关联在事务中执行，并检查简历归属。

### DATA-001-S1 非所属简历

- Given 当前用户不拥有目标简历。
- When 创建教育经历并请求关联该简历。
- Then 拒绝操作，不提交新增记录和关联。

证据：`sr-backend/internal/service/education.go`。此场景需集成测试验证，不能推广为所有接口已完成权限审计。

## AI-001 平台 RAG

平台问题经 Embedding、向量与关键词召回、RRF 融合、上下文组装后调用 Chat，支持流式结果和来源返回。

### AI-001-S1 无候选资料

- Given 没有满足检索规则的候选。
- When 准备回答。
- Then 提示词包含资料不足说明并要求不编造平台事实；实际拒答效果仍需模型评测。

证据：`sr-backend/internal/agent/service.go`、`retrieval.go`。RAG_ENABLED 当前仅加载而未见行为分支，不应描述为可用降级开关。

## AI-002 简历问答与润色

简历分身根据用户、简历和可见字段构建上下文，使用最近最多 12 条有效角色历史消息；它不使用个人向量检索。润色返回值经过字段白名单、原记录匹配及去重。

### AI-002-S1 模型返回未知字段

- Given 整份润色模型输出包含非输入允许字段。
- When 服务过滤建议。
- Then 丢弃该项，不把未知字段作为可保存建议返回。

证据：`sr-backend/internal/agent/resume_agent.go`、`polish.go`。

## KI-000 知识导入现状

`go run ./cmd/knowledge-import` 依赖进程环境；Air 的 env_files 仅作用于 Air 子进程。导入器筛选 active 且非 internal 的 Markdown，并按内容哈希和模型检查是否跳过。

证据：`sr-backend/cmd/knowledge-import/main.go`、`internal/knowledge/importer.go`。已知缺口：删除或下架文档的已入库记录未见完整对账处理；表向量维度固定 1536。

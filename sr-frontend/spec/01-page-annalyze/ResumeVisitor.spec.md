# ResumeVisitor 页面说明

## 页面职责

`ResumeVisitor` 是公开简历访问入口，负责根据简历权限展示内容，并为已启用 AI 问答的简历提供单页会话。

## 组件结构

- `ResumeVisitor.tsx`：编排权限加载、访客码解锁和简历展示。
- `components/VisitorAccessGate.tsx`：展示访问校验状态和六位访客码弹窗。
- `components/ResumeChatSidebar.tsx`：管理当前页面的问答历史和流式消息。
- `../ResumeWorkspace/components/ResumePaper.tsx`：复用工作台已有简历渲染组件。

## 数据边界

- 所有 HTTP 请求统一由 `src/services/PublicResume.ts` 发起。
- 页面数据与聊天历史类型统一放在 `src/types/PublicResume.ts`。
- 访客令牌仅保存在当前浏览器会话中，并按简历 ID 隔离。
- AI 上下文由后端根据 `visible_fields` 过滤，前端不负责权限裁剪。

## 修改注意事项

- 新增公开字段时，需要同时更新访问设置白名单、后端公开数据过滤和前端类型。
- 不要在页面或子组件中直接调用原生 `fetch`。
- 流式接口需要保留 `X-Visitor-Token`、`X-Device-ID` 和 Access Token 注入逻辑。

# SmartResume 协作指南

## 项目与事实来源

- 使用中文沟通，代码标识符沿用模块现有风格。用户明确要求优先于本文件。
- 前端：`sr-frontend`，React + TypeScript + Vite；后端：`sr-backend`，Go + Gin + PostgreSQL。
- 平台助手使用混合检索 RAG；简历分身使用数据库上下文；润色生成待用户确认的建议。不要将业务命名 Agent 等同于工具调用或多智能体系统。
- 开始修改前读取相关源码与规范。规范描述预期行为，源码证明当前实现；发现冲突时明确记录差距，不能假称已实现。
- `PROJECT_ANALYSIS.md` 是阶段性分析；版本与依赖以 go.mod、package.json 和锁文件为准。

## SDD 工作流

- 入口：`specs/README.md`。复杂需求或跨层行为变更，在 `specs/changes/<change-id>/` 维护 proposal.md、design.md、task.md、spec.md。
- proposal 说明问题与范围；design 记录技术决策；spec 定义可验收场景；task 用场景编号关联实现与验证。
- 文案、局部样式、可逆的小修复按影响范围直接完成，不强制创建四份文档。
- 用户已授权实现时，可连续完成规范、代码与验证，无需为流程额外索取审批。只有缺失的业务决策会改变结果时才询问。
- 任务完成必须有证据；未运行、失败、外部依赖阻塞需分别记录。归档前将行为变化合并到 `specs/baseline/`。
- 现有 `sr-frontend/spec/01-page-annalyze/` 保存页面实现说明；新业务契约写入 specs 并互相引用，不复制两套规则。

## 项目技能路由

项目技能存放在根目录 `skills/`，按下列触发条件读取对应 SKILL.md；不假设该自定义目录会被所有客户端自动发现，也不要求每次加载全部技能。

| 任务 | 技能 |
| --- | --- |
| 新增或调整复杂业务、SDD 文档与验收 | `skills/spec-workflow/SKILL.md` |
| 修改前后端代码结构或业务实现 | `skills/code-specification/SKILL.md` |
| 用户要求提交说明、Commit 或 PR | `skills/change-description/SKILL.md` |
| 用户要求安全审计，或变更认证、公开访问、数据权限 | `skills/security-review/SKILL.md` |
| 从 API 契约实现或调整 TypeScript Client | `skills/api-client/SKILL.md` |
| Windows 知识库导入及环境变量排障 | `skills/knowledge-import/SKILL.md` |

## 实现边界

- 前端修改遵循 `docs/structure-reference.md`；HTTP 经过 services/request.ts，页面调用业务 service。
- 后端接口、业务与模型分别位于 handler、service、model；知识检索位于 agent 和 knowledge。延续已有边界，避免无关重构。
- 用户数据读写限定归属；公开响应和模型上下文遵守同一可见字段策略。模型输出不直接作为数据库字段或工具执行授权。
- PostgreSQL 使用现有迁移约定；不要用删除表、清库或反复执行 init.sql 修复普通连接错误。
- 不输出 .env 内容、密钥、令牌；诊断配置仅显示变量名及是否设置。
- 保留用户已有修改；不要自动提交、推送或发布。明确请求包含这些动作时按授权范围执行。

## 命令与验证

以下命令从标注目录运行。Windows 默认 PowerShell，不执行 Bash 的 set -a 或 source。

| 目录 | 命令 | 用途 |
| --- | --- | --- |
| sr-frontend | `npm install` | 安装依赖；保留锁定版本，网络失败检查锁文件下载地址与缓存权限 |
| sr-frontend | `npm run dev` | 开发服务 |
| sr-frontend | `npm run build` / `npm run lint` | 类型、构建或静态检查 |
| sr-backend | `air -c .air.toml` | 自动加载 .env 并热重载 |
| sr-backend | `go test ./...` | 后端测试；可先运行相关包 |
| 项目根目录 | `powershell -NoProfile -ExecutionPolicy Bypass -File skills/knowledge-import/scripts/import-knowledge.ps1 -CheckOnly` | 仅验证导入配置存在性 |
| 项目根目录 | `powershell -NoProfile -ExecutionPolicy Bypass -File skills/spec-workflow/scripts/check-specs.ps1` | 检查规范与技能基础结构 |

直接 go run 不会因为存在 .env 自动加载它。数据库需安装 pgvector；导入前还需知识库及混合检索 SQL。按影响运行有意义的检查，文档改动无需重复构建业务代码。最终报告说明修改、验证结果和剩余限制，不能把结构检查称为业务验证。

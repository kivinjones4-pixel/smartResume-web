---
name: change-description
description: 根据 SmartResume 实际 diff 和验证结果撰写中文 PR 描述或 Conventional Commit；仅在用户要求提交说明、PR 或 Commit 工作时使用。
---

# 变更说明

检查实际 diff、相关 spec 与验证记录。按最终范围描述，不按聊天过程描述。

- Commit 使用 `type(scope): 简洁说明`，例如 `fix(auth): 避免刷新令牌重复消费`；type 按实际变更选择 feat、fix、refactor、docs、test、chore。
- PR 先描述问题与行为变化，再列验证和真实限制；复杂变更链接场景 ID 与迁移说明。
- 未运行检查明确标注；不要编造性能提升、测试通过或已解决的安全问题。
- 起草文本不等于授权执行 git commit、push 或发布 PR；用户明确要求的动作按其范围执行。
- 避免包含 .env、令牌、真实简历个人信息。只记录必要的脱敏复现步骤。

---
name: spec-workflow
description: 为 SmartResume 跨层功能或复杂行为变更创建和维护 proposal、design、task、spec，关联验收场景、实现与归档；小型文案或局部样式修改无需触发完整流程。
---

# 规范驱动变更

读取根目录 AGENTS.md、specs/README.md 和相关 baseline。用户指定已有变更时先继续该目录，不创建重复提案。

- 新变更从根目录执行 `powershell -NoProfile -ExecutionPolicy Bypass -File skills/spec-workflow/scripts/new-change.ps1 -ChangeId <id>`。
- 先写业务问题和边界，再记录技术决策，用 Given/When/Then 定义成功、失败和权限场景。task 引用场景 ID。
- 区分当前能力与目标能力；状态变化需匹配实现和验证证据。不要因为写完设计就勾选实现任务。
- 已授权实施可直接推进；仅对无法推断且影响业务结果的决策澄清，不增加仪式性审批。
- 执行 `powershell -NoProfile -ExecutionPolicy Bypass -File skills/spec-workflow/scripts/check-specs.ps1` 检查文档结构；该检查不能替代源码测试或业务验收。
- 完成后更新 baseline 并归档变更目录；保留历史证据，不覆盖未完成变更。

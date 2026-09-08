# 规范目录与工作流

本项目采用 SDD，并借鉴 OpenSpec 的提案、设计、任务和规范分工。这里是项目自定义的 Markdown 工作流，使用单数 `task.md`，不依赖或宣称兼容 OpenSpec CLI。

## 目录

- `baseline/spec.md`：当前代码可观察到的行为基线与已知缺口，不代表全部经过运行验收。
- `changes/<change-id>/proposal.md`：为什么改、改什么、哪些不在范围内。
- `changes/<change-id>/design.md`：上下文、方案、权衡、失败行为、迁移与风险。
- `changes/<change-id>/spec.md`：此次新增、修改或移除的要求及 Given/When/Then 场景。
- `changes/<change-id>/task.md`：实现和验证清单，引用场景 ID、证据及状态。
- `archive/<change-id>/`：实施并验证后的变更历史；按需创建。

`changes/windows-knowledge-import/` 是针对已有导入问题的具体草案，供后续实施；其中业务变更任务保持未完成。

## 推进规则

1. 读取 baseline 和相关代码，确定现状与需求差距。
2. 写 proposal 定义边界，再迭代 design 与 spec，最后拆 task；四份文档应保持一致。
3. 需求使用稳定编号，例如 KI-001；场景使用 KI-001-S1。任务引用编号，测试或人工验证结果回填 task。
4. 明确必要的业务决策后实施；已有授权时无需额外的提案批准仪式。
5. 状态使用 draft、implementing、verified、archived。仅当范围内任务完成且验收证据齐全才标为 verified。
6. 完成后更新 baseline，将变更目录归档并保留证据。超出范围的问题另建变更，不顺手扩张当前任务。

## 脚本

从项目根目录执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File skills/spec-workflow/scripts/new-change.ps1 -ChangeId resume-job-match
powershell -NoProfile -ExecutionPolicy Bypass -File skills/spec-workflow/scripts/check-specs.ps1
```

生成器拒绝覆盖已有变更。检查器只验证文件、占位符和技能入口基本结构，不验证业务正确性。模板占位符必须在交付提案前填写。

命令中的 ExecutionPolicy Bypass 仅作用于该次 PowerShell 子进程，不修改系统策略；用于执行仓库内已审阅脚本。

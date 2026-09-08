---
name: knowledge-import
description: 在 Windows PowerShell 为 SmartResume 检查 .env 并运行 Markdown 知识库向量导入，排查缺失 Embedding 配置；不用于 PDF 解析、安装数据库或启动前端。
---

# 知识库导入

项目 Air 加载的 .env 不会传播给另一个 PowerShell 的 go run。使用本目录 scripts/import-knowledge.ps1，避免反复手工粘贴加载代码。

从项目根目录：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File skills/knowledge-import/scripts/import-knowledge.ps1 -CheckOnly
powershell -NoProfile -ExecutionPolicy Bypass -File skills/knowledge-import/scripts/import-knowledge.ps1
```

- CheckOnly 仅检查变量，不访问数据库或模型；成功不代表凭证有效或数据库可连接。
- 示例的 ExecutionPolicy Bypass 仅作用于本次子进程，不更改系统执行策略；执行前可审阅仓库脚本。
- 正常导入会调用 Embedding 并写数据库；仅在用户要求导入时执行，不因诊断问题自动导入。
- 需在目标库安装 pgvector，并先执行知识库与混合检索 SQL；不要自动清库或安装服务。
- 脚本只支持项目单行 KEY=value 格式、整行注释和成对引号；不支持变量插值、多行值和行尾注释，不把 .env 当代码执行。
- 文件仅补充未设置或空的进程变量，脚本结束恢复环境；输出只显示配置名，不显示密钥。
- PDF/Word 输入需单独设计解析与清洗流程，现有导入器只读取 Markdown。

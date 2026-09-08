---
name: api-client
description: 根据 SmartResume Gin 路由、Handler 和现有契约生成或同步 TypeScript API 类型与 Client，处理认证、响应包和 SSE；不用于无契约依据的接口猜测。
---

# API 契约与 Client

1. 从 cmd/main.go 路由定位 Handler，确认方法、路径、绑定约束、鉴权、成功与失败响应；对照前端 services 和 types。
2. 阅读项目根目录 docs/structure-reference.md。类型写入 src/types，语义化调用写入 src/services，统一通过 request.ts 的 http 或 authenticatedFetch。
3. 类型表达 nullable 与可选字段的区别；核对日期、列表空值和错误码。不因 Go 模型有字段就认定 HTTP 返回该字段。
4. SSE 使用流读取，核对 events、结束、错误和取消；不能按普通 JSON 响应处理。
5. 契约冲突记录到相关 spec，不擅自更改后端响应以迁就生成代码。
6. 运行前端 build，按风险补契约样例验证。没有机器可读 OpenAPI 文件时不假称自动生成；重复的大规模生成再引入专用脚本。

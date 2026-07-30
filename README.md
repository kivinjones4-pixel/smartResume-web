# 🚀 AI Resume Builder & Multi-Agent Studio (Fullstack)

![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go)
![Gin](https://img.shields.io/badge/Gin-1.9+-000000?logo=gin)
![React 19](https://img.shields.io/badge/React-19.0-blue?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+_pgvector-4169E1?logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7.0+-DC382D?logo=redis)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC?logo=tailwind-css)

基于 **Go + Gin + React 19 + PostgreSQL (pgvector)** 搭建的一站式 AI 智能简历构建平台与多 Agent 数字人系统。

---

## 🌟 核心 AI 功能与架构说明

项目围绕 **“AI 简历 Copilot + 双 Agent 交互引擎”** 构建：

```text
                                 ┌───────────────────────────────┐
                                 │     React 19 + Tailwind UI    │
                                 └───────────────┬───────────────┘
                                                 │ HTTP / SSE Stream
                                 ┌───────────────▼───────────────┐
                                 │      Go + Gin API Gateway     │
                                 └───────────────┬───────────────┘
                                                 │
      ┌──────────────────────────────────────────┼──────────────────────────────────────────┐
      ▼                                          ▼                                          ▼
┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
│   1. 简历 AI 润色/Copilot  │      │ 2. Agent 1: 个人数字人      │      │ 3. Agent 2: 平台/发明人助手 │
├───────────────────────────┤      ├───────────────────────────┤      ├───────────────────────────┤
│ • 结构化 JSON Schema 输出   │      │ • 多租户 RAG 检索 (vector)  │      │ • 平台使用指导/发明人宣发    │
│ • 语法重写与 ATS 关键词优化  │      │ • 简历经历流式解答           │      │ • Tool Calling (发邮件/查项目)│
│ • 实时 Diff 比对与一键采纳.  │      │ • 专属人设/语气 Prompt 定制. │      │ • 流量转化与开发者技术亮点    │
└───────────────────────────┘      └───────────────────────────┘      └───────────────────────────┘
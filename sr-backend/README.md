# ⚡ AI-Powered Resume Builder & Agent Studio (Backend)

![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go)
![Gin](https://img.shields.io/badge/Gin-1.9+-000000?logo=gin)
![GORM](https://img.shields.io/badge/GORM-1.25+-3776AB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+_with_pgvector-4169E1?logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7.0+-DC382D?logo=redis)
![JWT](https://img.shields.io/badge/JWT-Authentication-000000?logo=json-web-tokens)

基于 **Go + Gin** 搭建的高性能多租户全栈 AI 简历编辑与 Agent 数字人服务后端。

---

## 🌟 核心架构与技术亮点

- ⚡ **高性能并发与长连接 (SSE)**：基于 Go 语言的原生 Goroutine 与 Channel 机制，利用 Gin 框架实现毫秒级响应的 **Server-Sent Events (SSE)** 流式打字机 API。
- 🛡️ **JWT 认证与安全设计**：采用无状态 JWT (JSON Web Token) 双 Token（Access Token + Refresh Token）签发与续期机制，集成 Redis 缓存实现 Token 撤销黑名单。
- 📦 **GORM + PostgreSQL 存储层**：采用 GORM ORM 引擎，结合 **PostgreSQL + `pgvector` 扩展**，实现个人简历知识库的毫秒级向量切片检索与语义匹配（RAG）。
- 🔒 **多租户数据隔离**：所有 RAG 向量检索与履历数据库操作均强制绑定 `user_id`，确保访客在询问特定 AI 分身时严格遵循租户数据隔离安全原则。
- 🤖 **双 Agent 策略路由**：
  - **`AgentPersonal`**：基于简历 RAG 检索，回答访客关于指定用户的履历疑问。
  - **`AgentPlatform`**：作为系统官方助手，宣发平台功能及开发者（发明人）技术履历。
- 🚀 **解耦的 LLM 适配器模式**：通过 Golang `Interface` 抽象 LLM 供应商层，支持零成本平滑切换 DeepSeek、OpenAI、Claude 及本地 Ollama。

---

## 🛠️ 技术选型与依赖

| 领域 | 选型 | 方案说明 |
| :--- | :--- | :--- |
| **开发语言** | Go 1.22+ | 高性能、低延迟、高并发 |
| **Web 框架** | Gin Web Framework | 轻量级、极速路由匹配 |
| **ORM 框架** | GORM | 简单易用的 Go 关系型数据库 ORM |
| **主数据库** | PostgreSQL 16 (`pgvector`) | 关系型存储 + 向量知识库 (Vector DB) 统一解决方案 |
| **缓存/会话** | Redis 7 | 存储 JWT 令牌黑名单、API 限流及高频热数据缓存 |
| **认证鉴权** | `golang-jwt/jwt` | 安全规范的声明式 Token 校验中间件 |
| **配置管理** | Viper | 格式兼容 (YAML/ENV) 的多环境动态配置加载 |

## 本地启动

默认连接本机 Homebrew PostgreSQL 的 `/tmp` Unix Socket，数据库名为
`LocalAIResumeDB`，数据库用户为当前 macOS 用户。

```bash
cp .env.example .env
set -a
source .env
set +a
go run ./cmd
curl http://127.0.0.1:8080/ping
```

当前配置无需加载 `.env` 即可使用默认值。需要覆盖配置时，请将 `.env`
中的变量导出到当前终端，或由 IDE/进程管理器注入环境变量。生产环境必须设置
独立的 `DB_USER`、`DB_PASSWORD`、`JWT_ACCESS_SECRET`、
`JWT_REFRESH_SECRET` 和合适的 `DB_SSLMODE`。

### Windows 初始化远程数据库

`scripts/init-database.ps1` 读取后端 `.env` 的 `DB_HOST`、`DB_PORT`、
`DB_USER`、`DB_PASSWORD`、`DB_NAME` 和 `DB_SSLMODE`，非空的同名进程变量优先。
Neon 使用云端主机、真实密码和 `DB_SSLMODE=require`。脚本不读取连接 URL；
不额外设置 channel binding。目标数据库需要预先存在，账号需有建表和创建扩展权限。

从项目根目录运行：

```powershell
# 离线检查配置与 SQL 文件，不连接数据库，也不要求安装 psql
powershell -NoProfile -ExecutionPolicy Bypass -File sr-backend/scripts/init-database.ps1 -CheckOnly

# 首次初始化：需要 PostgreSQL 客户端 psql 在 PATH 中
powershell -NoProfile -ExecutionPolicy Bypass -File sr-backend/scripts/init-database.ps1
```

若 psql 未加入 PATH，可追加 `-PsqlPath 'C:\Program Files\PostgreSQL\16\bin\psql.exe'`
（按实际安装路径调整）；自定义配置文件使用 `-EnvFile`。
ExecutionPolicy Bypass 仅作用于本次 PowerShell 子进程。

执行顺序：`init.sql` → `20260804_add_resume_access_settings.sql` →
`20260805_add_visitor_ai_daily_usage.sql` → `init_knowledge_rag.sql` →
`init_hybrid_search.sql`。SQL 创建 pgcrypto、vector、pg_trgm 扩展，向量维度固定为 1536。
脚本初始化表结构，不搬迁本地数据，也不调用模型或导入知识库内容。

**`init.sql` 不可重复执行，仅用于首次建表。** 已成功执行基础 SQL、只需补充后续表和
索引时追加 `-SkipBase`。脚本不清库，任一文件失败后立即停止；各 SQL 文件独立提交，
已经成功的文件不会整体回滚。只有确认基础初始化完整成功后才能使用 `-SkipBase`。
离线检查成功不代表密码有效、远程连接成功或数据库初始化完成。

### 导入平台助手知识库

首次导入前执行 `scripts/init_knowledge_rag.sql`，并配置独立的 Chat 与
Embedding 服务环境变量。知识库导入只调用 Embedding 服务，不调用 Chat 模型。

```bash
set -a
source .env
set +a
go run ./cmd/knowledge-import
```

导入器读取 `KNOWLEDGE_PATH` 下的 Markdown 文件，跳过 `internal` 和非
`active` 文档，按标题及段落切分后写入 PostgreSQL/pgvector。相同内容及相同
Embedding 模型不会重复生成向量；更换 Embedding 模型后会自动重新生成。

混合检索还需要执行一次 `scripts/init_hybrid_search.sql` 来启用 `pg_trgm`
并创建标题、正文的模糊关键词索引：

```bash
psql -v ON_ERROR_STOP=1 -f scripts/init_hybrid_search.sql
```

运行时会分别取得向量与关键词候选，再使用 RRF 合并排名。姓名、邮箱、项目名
等精确关键词命中不受向量相似度阈值限制。

可使用下面的 SQL 检查最近一次导入结果：

```sql
SELECT status, documents_scanned, documents_changed, chunks_written, error_message
FROM knowledge_import_runs
ORDER BY started_at DESC
LIMIT 1;
```

### 平台助手接口

`POST /api/v1/assistant/chat` 需要 Access Token。后端会依次调用 Embedding
服务、pgvector 检索和 Chat 服务，并在项目标准响应包中返回答案与知识来源。

```json
{
  "message": "SmartResume 是做什么的？"
}
```

### 认证接口

| Method | Path | 说明 |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | 邮箱、用户名和密码注册 |
| POST | `/api/v1/auth/login` | 邮箱或手机号加密码登录 |
| POST | `/api/v1/auth/refresh` | 轮换 Refresh Token |
| POST | `/api/v1/auth/logout` | 撤销 Refresh Token 并退出 |
| GET | `/api/v1/auth/me` | Access Token 鉴权并读取当前用户 |

### 教育经历接口

以下接口均需携带 Access Token。教育经历按简历加载；新增和编辑时的
`resume_id` 会用于校验简历归属及维护 `resume_education_rel` 关联。

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/api/v1/educations` | 查询用户的全部教育经历 |
| GET | `/api/v1/educations?resume_id=:resume_id` | 查询当前简历已加入的教育经历 |
| POST | `/api/v1/educations` | 新增教育经历并关联简历 |
| PUT | `/api/v1/educations/:id` | 保存教育经历 |
| DELETE | `/api/v1/educations/:id` | 删除教育经历并级联清理简历关联 |
| POST | `/api/v1/resumes/:id/educations/:educationId` | 将已有经历加入当前简历 |
| DELETE | `/api/v1/resumes/:id/educations/:educationId` | 仅从当前简历移除经历 |

### 实习经历接口

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/api/v1/internships` | 查询用户的全部实习经历 |
| GET | `/api/v1/internships?resume_id=:resume_id` | 查询当前简历已加入的实习经历 |
| POST | `/api/v1/internships` | 新增实习经历并关联简历 |
| PUT | `/api/v1/internships/:id` | 保存实习经历 |
| DELETE | `/api/v1/internships/:id` | 删除实习经历并级联清理简历关联 |
| POST | `/api/v1/resumes/:id/internships/:internshipId` | 将已有经历加入当前简历 |
| DELETE | `/api/v1/resumes/:id/internships/:internshipId` | 仅从当前简历移除经历 |

Access Token 通过响应体返回并由前端保存在内存；Refresh Token 通过
`HttpOnly` Cookie 传输，数据库只保存其 SHA-256 哈希。

---

## 📂 项目结构

```text
cmd/
└── server/             # 应用入口 main.go
config/                 # 全局配置解析 (Viper)与 YAML 文件
internal/
├── agent/              # AI Agent 核心逻辑
│   ├── adapter/        # LLM 供应商适配器 (DeepSeek/OpenAI/Ollama)
│   ├── rag/            # 向量检索 (pgvector) 与 Prompt 组装引擎
│   └── service.go      # 双 Agent 策略调度层
├── handler/            # HTTP 控制层 (Gin Handlers & SSE Controller)
├── middleware/         # Gin 中间件 (JWT 鉴权, CORS, CORS, RateLimiter, Recover)
├── model/              # GORM 数据结构定义与数据库迁移 (AutoMigrate)
├── repository/         # 数据库与 Redis 数据持久化操作层 (DAO)
└── service/            # 业务逻辑层 (User, Resume, Auth)
pkg/                    # 可复用的通用包 (JWT 签发, Crypto, SSE 封装, Logger)
docs/                   # Swagger / OpenAPI 接口文档
scripts/                # 数据库初始化 SQL (包含 pgvector 扩展开启)
go.mod

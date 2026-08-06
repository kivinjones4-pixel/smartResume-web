# KK 平台助手知识库

本目录存放允许 KK 在对话中使用的平台公开资料。内容会在导入时被切分、生成向量并写入 PostgreSQL/pgvector；Markdown 文件始终作为可审查的知识原文。

## 目录约定

- `product/`：平台定位、功能、使用方法和版本说明
- `developer/`：开发者公开简介、产品故事与合作信息
- `faq/`：用户常见问题及标准答案
- `security/`：访问权限、公开范围和安全边界
- `assistant/`：KK 的身份、语气和回答边界

## 编写规则

1. 只写已经上线或确定存在的能力，规划中的功能必须明确标注。
2. 不录入密码、API Key、身份证号、私人联系方式等敏感信息。
3. `visibility: public` 表示可以直接向用户展示；内部资料不得标记为公开。
4. 更新内容时同步修改 `updated_at` 和 `version`。
5. `TODO` 占位内容在补充真实资料前，不得作为对外事实回答。

## 当前文档索引

- `product/platform-intro.md`：平台定位、已上线能力与功能边界。
- `product/user-guide.md`：从注册、创建简历到导出和分享的操作指南。
- `product/ai-and-sharing.md`：AI 润色、平台助手、简历 AI 代理及访问设置。
- `faq/basic.md`：高频问题、限制和故障处理。
- `security/security.md`：代码实现能够确认的隐私与访问控制说明。
- `developer/profile.md`：开发者已确认的公开资料。
- `assistant/kk-persona.md`：KK 的回答规则（内部资料，不作为引用来源展示）。

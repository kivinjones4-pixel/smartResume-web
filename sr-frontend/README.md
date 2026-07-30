# 🚀 AI-Powered Resume Builder & Agent Studio (Frontend)
![React 19](https://img.shields.io/badge/React-19.0-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC?logo=tailwind-css)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite)
![Antd](https://img.shields.io/badge/antd-5.x-0170FE?logo=ant-design)

基于 **React 19**、**TypeScript** 和 **Tailwind CSS** 构建的现代化全栈 AI 简历编辑与 Agent 数字人交互平台前端项目。

---

## 🌟 核心特性

- ⚛️ **React 19 前沿特性**：全量拥抱 React 19 新特性，使用 `useActionState`、`useFormStatus` 及 `use` 异步资源处理，全面简化状态管理与表单逻辑。
- 🎨 **Tailwind CSS 极致响应式**：采用 Tailwind CSS 进行原子化样式构建，内置深色/浅色主题切换与优雅的平滑动画。
- 🤖 **双 Agent 交互体验**：
  - **个人 AI 数字人**：在公开简历页提供流式打字机交互（SSE），智能解答访客关于该履历的提问。
  - **全局平台 Agent**：常驻系统右下角，提供平台引导与发明人技术栈宣发。
- 📝 **块级/Markdown 简历编辑器**：支持实时预览、AI 一键润色/重写以及高保真 PDF 导出。
- ⚡ **Vite 极速构建**：秒级热重载（HMR）与极致的打包体积优化。

---

## 🛠️ 技术选型与依赖

| 领域 | 选型 | 方案说明 |
| :--- | :--- | :--- |
| **核心框架** | React 19 + TypeScript | 利用最新的 React 19 Actions 与 Compiler 提升性能 |
| **构建工具** | Vite 5 | 极速的开发体验与高效的生产打包 |
| **样式方案** | Tailwind CSS | 原子化 CSS 库，配合 `clsx` / `tailwind-merge` 管理动态类名 |
| **图标库** | Lucide React | 轻量且现代化的 SVG 图标套件 |
| **状态管理** | Zustand / React 19 Context | 轻量级全局状态与组件状态解耦 |
| **网络请求** | Fetch API + SSE | 原生支持流式响应处理（Server-Sent Events） |
| **代码规范** | ESLint + Prettier | 严格的 TypeScript 类型校验与代码格式化 |

---

## 📂 项目结构

```text
src/
├── assets/          # 静态资源（图片、字体等）
├── components/      # 通用 UI 组件
├── pages/           # 页面组件(各模块分别有components文件夹)
├── hooks/           # 自定义 React Hooks (例如: useSSE, useTheme)
├── services/        # API 请求层与 SSE 流式解析器
├── store/           # Zustand 全局状态管理
├── types/           # TypeScript 类型定义文件
├── utils/           # 工具函数 (类名合并、格式化等)
├── App.tsx          # 根组件与路由配置
└── main.tsx         # 应用入口文件
```
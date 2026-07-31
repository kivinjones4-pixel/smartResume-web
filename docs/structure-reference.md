# 智简 AI 前端 文件结构管理 Reference

## 简历工作台

- 新建页面
  1. 独立页面一律放在src/pages/`${ModuleName}`目录下，命名为`${ModuleName}.tsx`，如`NewResume.tsx`，大驼峰命名；
  2. 子页面可放在src/pages/`${ParentName}`/children目录下，命名为`${ChildName}.tsx`，如`ResumeList.tsx`，大驼峰命名；
  3. 各页面尽量拆分组件，组件一律放在各页面与tsx同级的components目录下；
  4. 非必要无需css/scss文件，直接使用tailwind
  5. 组件拆分基本判断：表单、侧边栏、列表、复杂卡片等，若组件库存在则优先使用组件库组件

- 架构规范
  1. 各模块 API 请求统一放在 `src/services` 目录下，命名为 `${ModuleName}.ts`
  2. 各模块store统一放在src/store目录下命名为`${ModuleName}.ts`
  3. 各模块类型规范统一放在src/types目录下命名为`${ModuleName}.ts`

- 请求工具规范
  1. 原生 `fetch` 只允许在 `src/services/request.ts` 中调用，页面、组件和 store 不直接发起 HTTP 请求；
  2. `request.ts` 统一负责 API 错误解析、Access Token 注入、Cookie 携带、401 刷新与原请求重试；
  3. 多个请求同时返回 401 时只能发起一次 Refresh Token 请求，其他请求等待同一个刷新结果；
  4. 各业务模块通过 `src/services/${ModuleName}.ts` 暴露语义化方法，不在页面中拼接 URL；
  5. 请求参数和响应类型统一引用 `src/types/${ModuleName}.ts`。

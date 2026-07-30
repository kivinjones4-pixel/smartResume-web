# 智简 AI 前端 文件结构管理 Reference

## 简历工作台

- 新建页面
  1. 独立页面一律放在src/pages/`${ModuleName}`目录下，命名为`${ModuleName}.tsx`，如`NewResume.tsx`，大驼峰命名；
  2. 子页面可放在src/pages/`${ParentName}`/children目录下，命名为`${ChildName}.tsx`，如`ResumeList.tsx`，大驼峰命名；
  3. 各页面尽量拆分组件，组件一律放在各页面与tsx同级的components目录下；
  4. 非必要无需css/scss文件，直接使用tailwind
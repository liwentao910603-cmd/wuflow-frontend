# WuFlow Frontend - Claude Code Context

## 产品定位
「让人真正学会的学习伙伴」——核心动词是「学」「懂」「连接」，不是「存」和「搜」。

## 技术栈
- **框架**：Next.js 16（App Router）
- **样式**：Tailwind CSS，Notion 风格白底，`#2383E2` 蓝色强调色
- **字体**：Inter + Noto Sans SC
- **部署**：Vercel，`git push` 自动触发部署
- **域名**：wuflow.cn
- **后端 API**：api.wuflow.cn（开发时 localhost:9000）
- **GitHub**：liwentao910603-cmd/wuflow-frontend

## 本地路径
```
C:\Users\72719\wuflow\frontend
```

## 目录结构
```
frontend/
├── components/
│   └── Sidebar.tsx
├── app/
│   ├── page.js                        # 落地页
│   ├── login/page.tsx                 # 登录页
│   ├── dashboard/
│   │   ├── page.tsx                   # 仪表盘（热力图入口）
│   │   └── CheckinModal.tsx           # 学习打卡弹窗
│   ├── ingest/page.tsx                # 资料整理（URL/PDF/文本，两步生成）
│   ├── notes/
│   │   ├── page.tsx                   # 知识库列表（含概念标签、删除、加入复习）
│   │   └── [id]/page.tsx              # 笔记详情页（含相关笔记推荐）
│   ├── concepts/
│   │   ├── page.tsx                   # 概念库列表页
│   │   └── [term]/page.tsx            # 概念 Wiki 详情页
│   ├── qa/page.tsx                    # AI 问答（流式输出+来源引用）
│   ├── review/page.tsx                # 遗忘曲线复习
│   ├── study-stats/page.tsx           # 知识雷达图+盲点诊断
│   └── admin/page.tsx                 # 运营后台（密码：wuflow2026）
```

## 关键环境变量（.env.local，不可提交）
```
NEXT_PUBLIC_API_URL=http://localhost:9000   # dev
# prod 自动读取 api.wuflow.cn
```

## 重要技术约定（必须遵守）
- 页面跳转用 `window.location.href`，**不用** `router.push()`
- Next.js 16 代理用 `proxy.ts`，**不是** `middleware.ts`
- 不引入新 UI 组件库，保持轻量
- API 地址统一从环境变量读取，不硬编码
- 用户输入做基础 sanitize，不直接渲染到 DOM

## 各页面核心功能说明

### ingest/page.tsx
- 三 Tab：URL 输入 / PDF 拖拽 / 文本粘贴
- 两步生成：先快速返回 title+summary（~3s），后台继续生成全文，前端轮询 `/notes/{id}/status`
- 零整体刷新，进度可见

### notes/[id]/page.tsx
- 展示笔记详情
- 底部展示相关笔记推荐（来自 `note_relations` 缓存表）

### review/page.tsx
- 遗忘曲线复习，题目来自 `cached_questions`（预生成缓存，快）
- 支持自评打分，更新 `mastery_level`

### study-stats/page.tsx
- 顶部：GitHub 风格学习热力图
- 底部：知识雷达图 + 盲点诊断

### concepts/[term]/page.tsx
- 概念 Wiki 详情，路由用 `{term:path}` 支持含斜杠的概念名

### admin/page.tsx
- 数据看板：用户数、今日新增、活跃度
- 预警 + 用户反馈列表

## 已完成功能（不可破坏）
- ✅ 用户认证（Supabase Auth）+ 侧边栏
- ✅ 落地页、Dashboard
- ✅ 资料整理（两步生成，轮询状态）
- ✅ 知识库列表（删除、加入复习、概念标签）
- ✅ AI 问答（流式输出+来源引用）
- ✅ L1 学习打卡热力图
- ✅ L2 遗忘曲线复习
- ✅ L3 知识雷达图+盲点诊断
- ✅ 1.6b 相关笔记推荐
- ✅ 1.6c 概念 Wiki
- ✅ 用户反馈弹窗（侧边栏入口）
- ✅ 运营后台 /admin

### 流记模块（已完成）
- ✅ stream_notes 表 + RLS
- ✅ 后端 CRUD 接口（GET列表/GET单条/POST/PUT/DELETE）
- ✅ /stream-notes 列表页（时间流卡片，客户端渲染）
- ✅ /stream-notes/[id] 详情/编辑页（支持标题、Markdown正文、来源链接、标签）
- ✅ 侧边栏「流记」入口（PenLine图标）

## 开发原则
1. 改动前先读对应 page.tsx
2. 每个新功能先问：对用户学习体验有什么改善？
3. 加载状态、错误提示必须完善（不能白屏，错误文案用中文）
4. 移动端友好（中国用户大量使用手机）
5. 付费墙设计要自然，不突兀
6. 改动后在 localhost:3000 验证再提交

## 下一步开发（Tier 3）
- Phase 1.5 L4：个性化学习路径推荐
- Phase 1.5 L5：每周学习报告（Agent 驱动，图片导出 1080×1920px）

## Phase 2 启动条件
7日留存 >40% + 50个付费用户
Phase 2 功能：视频 URL 处理、Pro 订阅（¥29/月）、模板市场

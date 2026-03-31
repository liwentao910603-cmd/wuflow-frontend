# WuFlow Frontend - Project Context for Claude Code

## Project Overview
WuFlow (悟流) frontend - AI-powered knowledge management tool for self-learners.
Solo indie project by Leo (怪仔), targeting Chinese self-learners.
Live at: https://wuflow.cn (deployed on Vercel)

## Tech Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS, Notion风格（白底、简洁）
- **Deployment**: Vercel
- **Backend API**: FastAPI at localhost:9000 (dev) / 待部署服务器 (prod)
- **GitHub**: liwentao910603-cmd/wuflow-frontend

## Directory Structure
```
frontend/
├── app/
│   ├── page.js              # 落地页（白底 Notion 风格）
│   ├── ingest/
│   │   └── page.tsx         # 资料整理页（URL / PDF拖拽 / 文本 三Tab）
│   ├── notes/
│   │   └── page.tsx         # 知识库列表页
│   └── qa/
│       └── page.tsx         # 知识库问答页（RAG + 来源引用）
├── public/
├── .env.local               # 环境变量（never commit）
└── package.json
```

## Key Environment Variables (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:9000   # dev
# prod 部署后改为服务器地址
```

## Page Descriptions

### page.js — 落地页
- 白底 Notion 风格
- 产品介绍 + CTA 入口

### ingest/page.tsx — 资料整理页（F1核心）
- 三个 Tab：URL输入 / PDF拖拽上传 / 文本粘贴
- 调用后端 POST /ingest
- 返回 DeepSeek 生成的结构化笔记

### notes/page.tsx — 知识库列表页
- 展示所有已入库的笔记
- 从 Supabase 拉取，按 created_at 排序
- 支持查看笔记详情

### qa/page.tsx — 问答页（F3核心）
- 输入问题 → 调用后端 RAG 接口
- 返回答案 + 来源引用（source citation）
- 对话式 UI

## Backend API Endpoints (FastAPI localhost:9000)
- `POST /ingest` — URL/PDF/文本 → 生成结构化笔记存入 Supabase
- `POST /qa` — 问题 → RAG 检索 → 返回答案+来源

## Design Principles
- Notion 风格：白底、无多余装饰、字体清晰
- 中文用户为主，文案用中文
- 移动端适配（Tailwind 响应式）
- 保持简洁，不过度设计

## Development Principles
1. 先读对应 page.tsx 再动手改
2. API 地址统一从 env 读取，不硬编码
3. 错误状态要有用户友好的提示（中文）
4. 不引入新的 UI 组件库（保持轻量）
5. 改动后在 localhost:3000 验证再提交

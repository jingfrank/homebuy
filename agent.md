# 🤖 Agent Guide — 居安择时 (HomeBuy AI)

> 本文件是为自动化开发 Agent（如 Hermes Agent、Claude、Antigravity 等）提供的项目上下文与运维部署指南。

---

## 1. 项目概览 (Project Overview)

- **项目名称**：居安择时 (HomeBuy AI)
- **定位**：个人与家庭上海买房决策、板块行情分析、房源精选 PK 与置业随记工具。
- **支持端**：
  - **PC 桌面端**（宽度 > 768px）：顶部完整导航栏。
  - **移动端**（宽度 ≤ 768px）：底部固定 Tab Bar，支持 iPhone 安全区与触控交互。
- **技术栈**：
  - 前端：React 19 + TypeScript + Vite + Lucide React
  - 后端：Hono + Node.js 20+ 内置 `node:sqlite`（无编译依赖）
  - 鉴权：JWT + 共享密码认证
  - 运维：Nginx（反向代理 + 静态托管） + PM2（进程管理）

---

## 2. 目录结构说明 (Directory Structure)

```
prediction/
├── src/                        # 前端 React 源码
│   ├── components/             # UI 组件
│   │   ├── LoginPage.tsx       # 密码登录页面
│   │   ├── MobileTabBar.tsx    # 手机端底部导航栏
│   │   ├── Navbar.tsx          # PC 端顶部导航栏
│   │   ├── CommunityLedgerSection.tsx  # 小区房源精选与对比
│   │   ├── HousingNotesSection.tsx     # 置业随记与行情情报
│   │   ├── AssessmentWizard.tsx        # 买房时机评估
│   │   ├── MarketMatrixSection.tsx     # 板块行情分析
│   │   ├── MortgageCalculatorSection.tsx # 房贷与压力测试
│   │   ├── RentVsBuySection.tsx        # 租售30年对比
│   │   └── ChecklistSection.tsx        # 避坑清单
│   ├── types/                  # TypeScript 类型定义
│   │   ├── community.ts        # 小区与房源数据结构
│   │   ├── notes.ts            # 置业笔记结构
│   │   └── prediction.ts       # 预测模型类型
│   ├── utils/                  # 工具类与 API 客户端
│   │   ├── api.ts              # 统一 API 请求封装与 JWT Token 管理
│   │   ├── communityStorage.ts # 小区/房源异步 API 交互
│   │   └── notesStorage.ts     # 笔记异步 API 交互
│   ├── App.tsx                 # 根组件（鉴权拦截与响应式切换）
│   └── index.css               # 全局样式与移动端媒体查询
│
├── server/                     # 后端 Hono 源码
│   ├── index.ts                # 服务入口 (默认端口 3001)
│   ├── config.ts               # 环境变量与配置 (APP_PASSWORD, JWT_SECRET)
│   ├── db.ts                   # SQLite 数据库连接与建表 (node:sqlite)
│   ├── seed.ts                 # 初始样本数据注入脚本
│   ├── middleware/
│   │   └── auth.ts             # JWT 鉴权拦截器
│   └── routes/
│       ├── auth.ts             # POST /api/auth/login, GET /api/auth/verify
│       ├── communities.ts      # /api/communities CRUD
│       ├── listings.ts         # /api/listings CRUD
│       └── notes.ts            # /api/notes CRUD
│
├── data/                       # 数据库文件持久化目录
│   └── app.db                  # SQLite 数据库文件（自动生成，受 gitignore）
├── docs/                       # 架构与部署文档
│   ├── architecture-plan.md    # 详细架构与表结构设计
│   └── deploy-guide.md         # VPS 部署操作指引
├── nginx.conf                  # Nginx 反代配置
├── deploy.sh                   # 一键构建与上传脚本
├── tsconfig.json / tsconfig.app.json / tsconfig.server.json
└── vite.config.ts              # Vite 配置（含 /api 开发代理）
```

---

## 3. 常用脚本命令 (Scripts)

| 命令 | 说明 |
|------|------|
| `npm run dev:all` | 同时启动前端 Vite (5173) 与后端 Hono (3001) |
| `npm run dev:server` | 单独启动后端热重载服务 |
| `npm run dev` | 单独启动前端 Vite 开发服务器 |
| `npm run seed` | 初始化导入默认示例数据到 SQLite 数据库 |
| `npm run build` | 前端打包输出到 `dist/` |
| `npm run build:server`| 后端编译到 `dist-server/` |
| `npm run start` | 生产环境启动后端编译产物 |

---

## 4. VPS 自动化部署指引 (Agent Operations for VPS)

如果 Agent 在 VPS 服务器（IP: `111.229.187.142`）上执行部署，请按以下步骤操作：

### 4.1 基础环境准备
1. 确保已安装 Node.js 20 LTS 或更高版本：`node -v`
2. 全局安装 PM2：`npm install -g pm2`
3. 安装 Nginx：`apt-get install -y nginx`

### 4.2 构建与数据库初始化
在项目根目录执行：
```bash
npm install
npm run build
npm run seed  # 首次部署时运行，初始化数据表与样本数据
```

### 4.3 后端服务启动 (PM2)
```bash
# 使用 PM2 托管后端（启用实验性 node:sqlite 支持）
pm2 start "node --experimental-sqlite --import tsx/esm server/index.ts" \
  --name "prediction-api" \
  --env production \
  --update-env

pm2 save
pm2 startup
```

### 4.4 Nginx 配置与生效
```bash
# 复制项目中的 nginx.conf 到 sites-available
cp nginx.conf /etc/nginx/sites-available/prediction
ln -sf /etc/nginx/sites-available/prediction /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

## 5. 核心配置与环境变量 (Environment Variables)

- `PORT`: 后端监听端口，默认 `3001`
- `APP_PASSWORD`: 访问登录密码，默认 `homebuy2026`
- `JWT_SECRET`: JWT 签名密钥，默认 `prediction-jwt-secret-2026`

---

## 6. 注意事项与约束 (Agent Constraints)

1. **零编译原生依赖**：后端已全部使用 Node 22+ 内置的 `node:sqlite`（`DatabaseSync`），**禁止**引入需要 `node-gyp` 编译的 C++ 插件（如 `better-sqlite3`）。
2. **移动端自适应**：新增任何功能时，需在 `<768px` 宽度下测试移动端体验，输入框保证 `font-size: 16px` 防止 iOS 自动缩放。
3. **数据一致性**：前端组件中对小区或房源的新增/修改/删除，统一通过 `src/utils/communityStorage.ts` 与 `src/utils/notesStorage.ts` 中的异步函数与后端交互。

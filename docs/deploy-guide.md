# 🚀 居安择时 — VPS 部署指南

> VPS IP：`111.229.187.142`，访问地址 `http://111.229.187.142`

---

## 一、VPS 一次性初始化（仅需做一次）

SSH 登录 VPS 后，按顺序执行：

```bash
# 1. 安装 Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 2. 安装 PM2（进程守护）
npm install -g pm2

# 3. 安装 Nginx
apt-get install -y nginx

# 4. 创建应用目录
mkdir -p /var/www/prediction/{dist,dist-server,data}

# 5. 配置 Nginx
cp /var/www/prediction/nginx.conf /etc/nginx/sites-available/prediction
ln -s /etc/nginx/sites-available/prediction /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 6. 开机自启
pm2 startup
systemctl enable nginx
```

---

## 二、修改密码（重要！）

打开 [deploy.sh](file:///D:/prediction/deploy.sh)，修改第 9-10 行：

```bash
APP_PASSWORD="你的密码"        # 你和老婆登录用的密码
JWT_SECRET="随机长字符串"       # 安全密钥，随便打几十个字符
```

> [!CAUTION]
> 默认密码是 `homebuy2026`，**上线前必须改掉**！

---

## 三、本地开发启动

```bash
# 安装依赖（首次）
npm install

# 同时启动前端(5173) + 后端(3001)
npm run dev:all

# 首次：导入示例数据到本地数据库
npm run seed
```

访问 `http://localhost:5173`，输入密码 `homebuy2026` 登录。

---

## 四、部署到 VPS

```bash
# Windows 上用 Git Bash 或 WSL 执行
bash deploy.sh
```

部署完成后访问 `http://111.229.187.142`

---

## 五、密码修改后重部署

```bash
# 在 VPS 上直接更新环境变量
ssh root@111.229.187.142
pm2 restart prediction-api --update-env \
  APP_PASSWORD=新密码 JWT_SECRET=新密钥
```

---

## 六、项目文件结构

```
prediction/
├── src/                        前端 React 代码
│   ├── components/
│   │   ├── LoginPage.tsx       🆕 密码登录页
│   │   ├── MobileTabBar.tsx    🆕 手机底部导航
│   │   └── ...原有组件（未改动）
│   ├── utils/
│   │   ├── api.ts              🆕 统一 API 客户端（JWT 管理）
│   │   ├── communityStorage.ts ✏️ 改为 async API 调用
│   │   └── notesStorage.ts     ✏️ 改为 async API 调用
│   └── App.tsx                 ✏️ 加了登录态 + 手机判断
│
├── server/                     🆕 Hono 后端
│   ├── index.ts                入口 (port 3001)
│   ├── db.ts                   SQLite 初始化建表
│   ├── seed.ts                 示例数据导入脚本
│   ├── routes/
│   │   ├── auth.ts             POST /api/auth/login
│   │   ├── communities.ts      CRUD /api/communities
│   │   ├── listings.ts         CRUD /api/listings
│   │   └── notes.ts            CRUD /api/notes
│   └── middleware/auth.ts      JWT 鉴权中间件
│
├── data/app.db                 🆕 SQLite 数据库（自动生成）
├── nginx.conf                  🆕 Nginx 配置
├── deploy.sh                   🆕 一键部署脚本
├── tsconfig.server.json        🆕 后端 TS 配置
└── vite.config.ts              ✏️ 加了 /api 开发代理
```

---

## 七、两人协作说明

- 你和老婆用**同一个密码**登录
- 所有数据存在 VPS 的 SQLite 里，两端实时同步
- 手机浏览器打开 `http://111.229.187.142` 即可使用
- 手机端显示底部 Tab Bar（5个常用功能）
- PC 端显示顶部导航栏（全部7个功能）

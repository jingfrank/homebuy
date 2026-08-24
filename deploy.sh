#!/bin/bash
# =============================================================
# 居安择时 VPS 部署脚本
# VPS IP: 111.229.187.142
# 使用方式: bash deploy.sh
# =============================================================

set -e  # 遇到错误立即退出

VPS_USER="root"
VPS_IP="111.229.187.142"
REMOTE_DIR="/var/www/prediction"
APP_PASSWORD="homebuy2026"   # ← 上线前请修改此密码！
JWT_SECRET="prediction-jwt-2026-secret-change-me"  # ← 请修改！

echo "🏗️  开始构建前端..."
npm run build

echo "🏗️  开始构建后端..."
npm run build:server

echo "📦  上传文件到 VPS..."
ssh "$VPS_USER@$VPS_IP" "mkdir -p $REMOTE_DIR/{dist,dist-server,data}"

# 上传前端静态文件
rsync -avz --delete dist/ "$VPS_USER@$VPS_IP:$REMOTE_DIR/dist/"

# 上传后端编译产物
rsync -avz --delete dist-server/ "$VPS_USER@$VPS_IP:$REMOTE_DIR/dist-server/"

# 上传 package.json (生产依赖)
scp package.json "$VPS_USER@$VPS_IP:$REMOTE_DIR/"

echo "📥  VPS 安装生产依赖..."
ssh "$VPS_USER@$VPS_IP" "cd $REMOTE_DIR && npm install --omit=dev"

echo "🚀  重启后端服务..."
ssh "$VPS_USER@$VPS_IP" "
  # 设置环境变量
  export APP_PASSWORD='$APP_PASSWORD'
  export JWT_SECRET='$JWT_SECRET'
  export PORT=3001
  export NODE_ENV=production

  # 首次运行需要 seed 数据
  if [ ! -f $REMOTE_DIR/data/app.db ]; then
    echo '首次部署：初始化数据库...'
    cd $REMOTE_DIR && node dist-server/server/seed.js || true
  fi

  # PM2 重启
  cd $REMOTE_DIR
  pm2 describe prediction-api > /dev/null 2>&1 \
    && pm2 restart prediction-api --update-env \
    || pm2 start dist-server/server/index.js \
        --name prediction-api \
        --env production \
        -- \
        APP_PASSWORD='$APP_PASSWORD' \
        JWT_SECRET='$JWT_SECRET'

  pm2 save
"

echo "✅  部署完成！访问 http://$VPS_IP"

# 羽毛球团体赛管理系统 - 部署指南

## 服务器信息
- IPv6: 2001:19f0:5400:2987:5400:05ff:fef1:3e29
- Username: root
- Password: 5Kh+B-t-,wBGKY+T

## 部署步骤

### 1. 连接服务器
```bash
ssh root@2001:19f0:5400:2987:5400:05ff:fef1:3e29
# 密码: 5Kh+B-t-,wBGKY+T
```

### 2. 安装 Node.js (如果未安装)
```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 验证安装
node -v
npm -v
```

### 3. 安装 PM2 (进程管理器)
```bash
npm install -g pm2
```

### 4. 创建项目目录并上传代码
```bash
# 在服务器上创建目录
mkdir -p /var/www/badminton-tournament-system
```

### 5. 从本地上传代码 (在本地执行)
```bash
# 使用 scp 上传项目
scp -r d:\AICoding\Program\badminton-tournament-system root@2001:19f0:5400:2987:5400:05ff:fef1:3e29:/var/www/
```

### 6. 在服务器上安装依赖并启动
```bash
cd /var/www/badminton-tournament-system

# 安装依赖
npm install

# 使用 PM2 启动服务
pm2 start npm --name "badminton" -- run start

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

### 7. 配置防火墙 (如果需要)
```bash
# 开放端口 3000 和 3001
ufw allow 3000
ufw allow 3001
ufw enable
```

### 8. 访问应用
- 前端: http://[2001:19f0:5400:2987:5400:05ff:fef1:3e29]:3000
- 后端: http://[2001:19f0:5400:2987:5400:05ff:fef1:3e29]:3001

## 常用命令

### PM2 管理
```bash
pm2 list              # 查看所有进程
pm2 logs badminton    # 查看日志
pm2 restart badminton # 重启服务
pm2 stop badminton    # 停止服务
pm2 delete badminton  # 删除进程
```

### 更新代码
```bash
cd /var/www/badminton-tournament-system
git pull              # 如果使用 git
npm install           # 更新依赖
pm2 restart badminton # 重启服务
```

## 注意事项
1. 确保服务器防火墙开放了 3000 和 3001 端口
2. 数据库文件位于 data/badminton.db，请定期备份
3. 建议配置 Nginx 反向代理以支持域名访问

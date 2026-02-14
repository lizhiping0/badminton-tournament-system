# 部署脚本 - 在本地 PowerShell 中运行

$SERVER_IP = "2001:19f0:5400:2987:5400:05ff:fef1:3e29"
$SERVER_USER = "root"
$SERVER_PASS = "5Kh+B-t-,wBGKY+T"
$REMOTE_PATH = "/var/www/badminton-tournament-system"
$LOCAL_PATH = "d:\AICoding\Program\badminton-tournament-system"

Write-Host "=== 羽毛球团体赛管理系统部署脚本 ===" -ForegroundColor Cyan
Write-Host ""

# 检查是否安装了必要工具
Write-Host "[1/5] 检查环境..." -ForegroundColor Yellow

# 检查 Node.js
$nodeVersion = node -v 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: 未安装 Node.js，请先安装 Node.js" -ForegroundColor Red
    exit 1
}
Write-Host "  Node.js 版本: $nodeVersion" -ForegroundColor Green

# 检查 sshpass (Windows 可能没有)
$sshpass = Get-Command sshpass -ErrorAction SilentlyContinue
if (-not $sshpass) {
    Write-Host "  提示: 未安装 sshpass，将使用交互式 SSH" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[2/5] 打包项目..." -ForegroundColor Yellow

# 创建临时目录
$tempDir = "$env:TEMP\badminton-deploy"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# 复制必要文件
$excludeDirs = @("node_modules", ".git", "data")
Get-ChildItem -Path $LOCAL_PATH -Exclude $excludeDirs | Copy-Item -Destination $tempDir -Recurse

Write-Host "  项目文件已打包到: $tempDir" -ForegroundColor Green

Write-Host ""
Write-Host "[3/5] 连接服务器并准备环境..." -ForegroundColor Yellow
Write-Host "  请输入服务器密码: 5Kh+B-t-,wBGKY+T" -ForegroundColor Gray

# 在服务器上创建目录和安装 Node.js
$setupCommands = @"
mkdir -p $REMOTE_PATH
apt update -qq
apt install -y -qq curl
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y -qq nodejs
fi
npm install -g pm2
node -v
npm -v
"@

Write-Host ""
Write-Host "  执行命令: 安装 Node.js 和 PM2..." -ForegroundColor Gray
ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" $setupCommands

Write-Host ""
Write-Host "[4/5] 上传项目文件..." -ForegroundColor Yellow
Write-Host "  请再次输入服务器密码..." -ForegroundColor Gray

# 使用 scp 上传
scp -o StrictHostKeyChecking=no -r "$tempDir\*" "$SERVER_USER@$SERVER_IP:$REMOTE_PATH/"

Write-Host "  文件上传完成" -ForegroundColor Green

Write-Host ""
Write-Host "[5/5] 安装依赖并启动服务..." -ForegroundColor Yellow
Write-Host "  请再次输入服务器密码..." -ForegroundColor Gray

$startCommands = @"
cd $REMOTE_PATH
npm install --production
pm2 delete badminton 2>/dev/null || true
pm2 start npm --name 'badminton' -- run start
pm2 save
pm2 startup | tail -1 | bash
echo ''
echo '=== 部署完成 ==='
echo '前端地址: http://[$SERVER_IP]:3000'
echo '后端地址: http://[$SERVER_IP]:3001'
"@

ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" $startCommands

# 清理临时文件
Remove-Item -Recurse -Force $tempDir

Write-Host ""
Write-Host "=== 部署完成 ===" -ForegroundColor Cyan
Write-Host "前端地址: http://[$SERVER_IP]:3000" -ForegroundColor Green
Write-Host "后端地址: http://[$SERVER_IP]:3001" -ForegroundColor Green

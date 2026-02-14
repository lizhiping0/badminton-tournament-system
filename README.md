# 羽毛球团体赛管理系统

一个简洁、高效的羽毛球团体赛管理系统，支持淘汰赛制的团体赛事管理。

## 功能特点

- 🏆 **赛事管理**：支持多届赛事管理，可创建、切换、归档不同届次
- 👥 **队伍管理**：添加参赛队伍，管理参赛人员信息
- 📅 **赛程安排**：自动生成淘汰赛对阵表，支持手动调整
- 🏸 **比分记录**：实时录入比分，自动判定胜负
- 📊 **成绩统计**：自动计算积分排名，支持导出Excel
- 📱 **响应式设计**：支持PC端和移动端访问

## 技术栈

- **前端**：React 18 + Vite + Tailwind CSS + Zustand
- **后端**：Node.js + Express
- **数据库**：SQLite (sql.js)
- **导出**：SheetJS (xlsx)

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
# 同时启动前端和后端
npm start

# 或者分别启动
npm run server  # 后端服务 (端口 3001)
npm run dev     # 前端服务 (端口 3000)
```

### 访问系统

打开浏览器访问 http://localhost:3000

## 使用指南

### 1. 创建赛事

1. 进入"赛事管理"页面
2. 点击"新建赛事"按钮
3. 填写赛事名称、年份、日期等信息
4. 保存后自动切换为当前赛事

### 2. 添加队伍

1. 进入"队伍管理"页面
2. 点击"添加队伍"按钮
3. 填写队伍名称、联系人等信息
4. 选择队伍后，可添加参赛人员

### 3. 生成赛程

1. 进入"赛程安排"页面
2. 点击"自动生成对阵表"按钮
3. 系统自动生成淘汰赛对阵表
4. 可编辑比赛时间和场地

### 4. 录入比分

1. 进入"比赛记录"页面
2. 选择一场团体赛
3. 点击"创建5场单项比赛"
4. 为每场比赛选择参赛选手
5. 录入每局比分，系统自动判定胜负

### 5. 查看成绩

1. 进入"成绩统计"页面
2. 点击"计算成绩"按钮
3. 查看积分排名
4. 可导出Excel报表

## 比赛规则

### 单项比赛规则

- 采用三局两胜制
- 每局21分
- 20-20平后，需领先2分获胜，最高30分

### 团体赛规则

- 每场团体赛包含5场单项比赛
- 出场顺序：男双 → 女单 → 男单 → 女双 → 混双
- 先赢得3场单项的队伍获胜

### 积分规则

- 每场比赛胜者获得1个积分
- 积分相同时，依次比较：胜负关系 → 净胜局数 → 净胜分数

## 项目结构

```
badminton-tournament-system/
├── server/                 # 后端代码
│   ├── index.js           # 入口文件
│   ├── db/                # 数据库
│   │   ├── database.js    # 数据库连接
│   │   └── schema.sql     # 表结构
│   └── routes/            # API路由
│       ├── events.js      # 赛事管理
│       ├── teams.js       # 队伍管理
│       ├── players.js     # 参赛人员
│       ├── matchTypes.js  # 比赛项目
│       ├── teamMatches.js # 团体赛
│       ├── matches.js     # 单项比赛
│       ├── standings.js   # 成绩统计
│       └── export.js      # 数据导出
├── src/                   # 前端代码
│   ├── main.jsx          # 入口文件
│   ├── App.jsx           # 主组件
│   ├── index.css         # 样式文件
│   ├── store/            # 状态管理
│   │   └── useStore.js   # Zustand store
│   └── pages/            # 页面组件
│       ├── Events.jsx    # 赛事管理
│       ├── Teams.jsx     # 队伍管理
│       ├── Schedule.jsx  # 赛程安排
│       ├── Matches.jsx   # 比赛记录
│       └── Standings.jsx # 成绩统计
├── data/                  # 数据目录
│   └── badminton.db      # SQLite数据库
├── doc/                   # 文档
└── package.json          # 项目配置
```

## API接口

### 赛事管理

- `GET /api/events` - 获取赛事列表
- `POST /api/events` - 创建赛事
- `PUT /api/events/:id` - 更新赛事
- `DELETE /api/events/:id` - 删除赛事

### 队伍管理

- `GET /api/teams?event_id=X` - 获取队伍列表
- `POST /api/teams` - 创建队伍
- `PUT /api/teams/:id` - 更新队伍
- `DELETE /api/teams/:id` - 删除队伍

### 参赛人员

- `GET /api/players?team_id=X` - 获取人员列表
- `POST /api/players` - 添加人员
- `DELETE /api/players/:id` - 删除人员

### 赛程安排

- `GET /api/team-matches?event_id=X` - 获取对阵表
- `POST /api/team-matches` - 创建团体赛
- `POST /api/team-matches/generate-bracket` - 自动生成对阵表
- `PUT /api/team-matches/:id` - 更新团体赛
- `DELETE /api/team-matches/:id` - 删除团体赛

### 比赛记录

- `GET /api/matches?team_match_id=X` - 获取比赛列表
- `POST /api/matches` - 创建比赛
- `PUT /api/matches/:id` - 更新选手信息
- `PUT /api/matches/:id/score` - 更新比分
- `POST /api/matches/:id/correct` - 修正比分

### 成绩统计

- `GET /api/standings?event_id=X` - 获取排名
- `POST /api/standings/calculate` - 计算成绩

### 数据导出

- `GET /api/export/schedule/:eventId` - 导出赛程
- `GET /api/export/matches/:eventId` - 导出比赛记录
- `GET /api/export/standings/:eventId` - 导出成绩

## 数据备份

数据库文件位于 `data/badminton.db`，可直接复制该文件进行备份。

## 许可证

MIT License

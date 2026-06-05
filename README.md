# 舞台设备租赁系统

## 原始需求

> 建设一个给演出经纪、剧院技术部、设备供应商共同使用的舞台设备租赁系统，排期和点验界面适合用 React 做成高密度工作台，后端可以用 NestJS 管理档期锁定、设备流水和结算规则。演出经纪提交演出日期、排练时段、舞台规格和设备清单；剧院技术部确认装台窗口、供电条件、吊挂点位和场馆限制；设备供应商登记灯光、音响、控台、线材、支架、运输箱和押金条款。系统要串起档期申请、设备锁定、出库点验、装台联调、演后归还、损耗确认和费用结算。设备归还时要区分正常磨损、缺件、超时占用、现场损坏和供应商漏发，押金扣减要能追到具体设备、点验照片和责任说明。

## 项目简介

舞台设备租赁系统面向演出经纪、剧院技术部和设备供应商三类角色，覆盖从档期申请到费用结算的完整业务流程：

- **演出经纪**：提交演出项目（日期、排练时段、舞台规格、设备清单），推进项目状态
- **剧院技术部**：确认装台窗口、供电条件、吊挂点位、场馆限制
- **设备供应商**：登记设备（灯光/音响/控台/线材/支架/运输箱）及押金条款

业务流程：档期申请 → 设备锁定 → 出库点验 → 装台联调 → 演后归还 → 损耗确认 → 费用结算

归还时区分五种损耗类型：正常磨损、缺件、超时占用、现场损坏、供应商漏发。押金扣减可追到具体设备、点验照片和责任说明。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + TypeScript + Ant Design 5 + Vite |
| 后端 | NestJS 11 + TypeORM + sql.js（SQLite） |
| 部署 | Docker + Docker Compose + Nginx |

## 目录结构

```
├── backend/              # NestJS 后端
│   ├── src/
│   │   ├── entities/     # 数据库实体
│   │   ├── users/        # 用户模块
│   │   ├── projects/     # 演出项目模块
│   │   ├── equipment/    # 设备管理模块
│   │   ├── schedules/    # 档期排期模块
│   │   ├── inspections/  # 点验管理模块
│   │   ├── venue/        # 场馆确认模块
│   │   └── settlements/  # 费用结算模块
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/             # React 前端
│   ├── src/
│   │   ├── pages/        # 页面组件
│   │   ├── components/   # 公共组件
│   │   ├── api.ts        # API 客户端
│   │   ├── types.ts      # 类型定义
│   │   └── store.tsx     # 认证状态
│   ├── nginx.conf        # Nginx 配置（Docker 用）
│   ├── Dockerfile
│   └── .dockerignore
├── docker-compose.yml    # Docker 编排
├── Dockerfile            # 根目录 Dockerfile（构建后端）
├── .dockerignore
├── README.md
└── .done
```

## 启动方式

### 前置要求

- Node.js 22+
- Docker & Docker Compose（如使用 Docker 启动）

### Docker 一键启动（推荐）

```bash
docker compose up --build
```

后台运行：

```bash
docker compose up --build -d
```

停止服务：

```bash
docker compose down
```

访问地址：http://localhost:8080

默认账号：
| 角色 | 用户名 | 密码 |
|------|--------|------|
| 演出经纪 | broker1 | 123456 |
| 剧院技术部 | tech1 | 123456 |
| 设备供应商 | supplier1 | 123456 |

### 本地开发启动

#### 1. 安装依赖

```bash
cd backend && npm install
cd ../frontend && npm install
```

#### 2. 启动后端

```bash
cd backend && npm run start:dev
```

后端地址：http://localhost:3000

#### 3. 启动前端

```bash
cd frontend && npm run dev
```

前端地址：http://localhost:5173

## API 文档

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 用户 | POST | /users/login | 登录 |
| 用户 | POST | /users | 创建用户 |
| 用户 | GET | /users | 用户列表 |
| 用户 | GET | /users/role/:role | 按角色查询 |
| 用户 | POST | /users/seed | 初始化种子数据 |
| 项目 | GET | /projects | 项目列表 |
| 项目 | POST | /projects | 创建项目 |
| 项目 | GET | /projects/:id | 项目详情 |
| 项目 | PUT | /projects/:id | 更新项目 |
| 项目 | PUT | /projects/:id/status | 更新项目状态 |
| 设备 | GET | /equipment | 设备列表 |
| 设备 | POST | /equipment | 登记设备 |
| 设备 | PUT | /equipment/:id | 更新设备 |
| 设备 | GET | /equipment/category/:category | 按类别查询 |
| 设备 | POST | /equipment/seed | 初始化种子设备 |
| 档期 | GET | /schedules | 档期列表 |
| 档期 | POST | /schedules | 申请档期 |
| 档期 | PUT | /schedules/:id/lock | 锁定档期 |
| 档期 | PUT | /schedules/:id/outbound | 标记出库 |
| 档期 | PUT | /schedules/:id/setup | 标记装台 |
| 档期 | PUT | /schedules/:id/return | 标记归还 |
| 档期 | PUT | /schedules/:id/cancel | 取消档期 |
| 点验 | GET | /inspections | 点验列表 |
| 点验 | POST | /inspections | 创建点验 |
| 点验 | POST | /inspections/:id/items | 添加点验项 |
| 点验 | PUT | /inspections/items/:itemId | 更新点验项 |
| 点验 | GET | /inspections/deductions/:scheduleId | 查询扣款项 |
| 场馆 | GET | /venue | 场馆确认列表 |
| 场馆 | POST | /venue | 创建场馆确认 |
| 场馆 | PUT | /venue/:id/confirm | 确认场馆条件 |
| 结算 | GET | /settlements | 结算列表 |
| 结算 | POST | /settlements/project/:projectId/generate | 生成结算单 |
| 结算 | PUT | /settlements/:id/status | 更新结算状态 |
| 结算 | PUT | /settlements/items/:itemId | 更新结算项 |

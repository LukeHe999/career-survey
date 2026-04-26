# 🎓 大学生职业规划倾向调查问卷系统

基于 Node.js + Express + SQLite 的轻量级在线问卷系统，支持多层级跳转逻辑、管理后台和 CSV 导出。

## 功能特性

- **分层问卷设计** — 根据「就业 / 深造 / 未确定」自动展示不同分支题目
- **进度保存** — 填写中可随时退出，下次继续
- **数据汇总** — 所有学生填写的数据统一存储，管理员后台查看
- **CSV 导出** — 一键导出为 Excel 可打开的 CSV 文件
- **管理密码保护** — 后台数据需密码访问
- **手机友好** — 适配手机屏幕，QQ / 微信浏览器均可使用
- **零外部依赖** — 使用 SQLite 数据库，无需单独安装数据库服务

## 快速开始

### 本地运行

```bash
# 1. 安装依赖
npm install

# 2. 启动服务（默认密码 admin888）
npm start

# 或指定管理密码
ADMIN_PASSWORD=your_password node server.js

# 3. 打开浏览器
# 问卷页面: http://localhost:3000
# 管理后台: http://localhost:3000/admin.html
```

## 使用指南

### 📝 学生填写问卷

学生打开问卷链接后，按以下步骤填写：

1. **欢迎页** → 点击「开始填写」
2. **基本信息** → 填写专业、年级、性别
3. **毕业去向意向** → 选择就业 / 深造 / 未确定
   - 选 **就业** → 继续回答就业方向相关问题（单位类型、期望薪资、准备情况等）
   - 选 **深造** → 继续回答深造方向相关问题（学硕/专硕、院校层次、考研准备等）
   - 选 **未确定** → 回答困惑原因
   - 选 **其他** → 直接跳到综合信息
4. **综合信息** → 选择希望学校提供的支持，可填写补充意见
5. **提交** → 数据上传至服务器，显示填写概要

### 🔐 管理员查看数据

1. 打开 `https://你的域名/admin.html`
2. 输入管理密码（默认 `admin888`）
3. 在管理后台可：
   - 查看数据概览（总问卷数、各去向人数）
   - 按去向 / 年级筛选
   - 查看每条完整记录
   - **导出 CSV**（可直接用 Excel 或 WPS 打开）
   - **刷新数据**（获取最新提交）

> ⚠️ 管理密码可通过环境变量 `ADMIN_PASSWORD` 修改，部署前建议修改默认密码。

## 部署指南

### 方式一：Railway（推荐，免费）

[Railway](https://railway.app) 提供免费云托管，无需信用卡。

1. **Fork 或推送到你的 GitHub**
   ```bash
   git remote add origin https://github.com/你的用户名/career-survey.git
   git push -u origin main
   ```

2. **在 Railway 部署**
   - 打开 https://railway.app
   - 点击 **Start a New Project** → **Deploy from GitHub repo**
   - 授权后选择 `career-survey` 仓库
   - Railway 会自动检测 Node.js 并部署

3. **配置域名**
   - 部署成功后，点击 **Generate Domain** 获取公网链接
   - 如需要自定义域名，可在 Settings → Domains 中配置

4. **修改管理密码（可选）**
   - 进入项目 Dashboard → **Variables**
   - 添加环境变量：`ADMIN_PASSWORD` = `你设置的密码`

### 方式二：Zeabur（国内访问更快）

[Zeabur](https://zeabur.com) 对中国用户更友好，访问速度更快。

1. 将代码推送到 GitHub
2. 打开 https://zeabur.com 登录
3. 点击 **新建项目** → **导入 GitHub 仓库**
4. 选择 `career-survey`
5. 在环境变量中添加 `ADMIN_PASSWORD`
6. 部署完成后会自动生成 HTTPS 链接

### 方式三：Vercel（需搭配外部数据库）

> ⚠️ Vercel 的 serverless 环境不支持 SQLite 文件存储，如需在 Vercel 部署，需要修改后端使用 PostgreSQL 或 Upstash Redis。

### 方式四：手动部署到 VPS

```bash
# 在服务器上
git clone https://github.com/你的用户名/career-survey.git
cd career-survey
npm install --production

# 使用 PM2 保持服务运行
npm install -g pm2
ADMIN_PASSWORD=你的密码 pm2 start server.js --name survey

# 设置开机自启
pm2 save
pm2 startup

# 使用 Nginx 反向代理（可选）
```

Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name survey.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | HTML5 + CSS3 + Vanilla JS |
| 后端 | Node.js + Express |
| 数据库 | SQLite（better-sqlite3） |
| 部署 | Railway / Zeabur / VPS |

## 项目结构

```
survey-app/
├── package.json        # 项目配置与依赖
├── server.js           # Express 服务器 + API + 数据库
├── data.db             # SQLite 数据库文件（自动生成）
├── .gitignore
├── README.md
└── public/
    ├── index.html      # 问卷页面（含完整跳转逻辑）
    └── admin.html      # 管理后台（查看/导出数据）
```

## API 接口

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/submit` | 提交问卷数据 | 否 |
| GET | `/api/results/count` | 获取回答总数 | 否 |
| GET | `/api/results?pwd=xxx` | 获取所有数据 | 需要密码 |
| GET | `/api/export/csv?pwd=xxx` | 导出 CSV 文件 | 需要密码 |

## 自定义修改

### 修改问卷题目

编辑 `public/index.html` 中的 HTML 结构，修改对应的问题文本和选项值。

### 修改管理密码

```bash
# 启动时指定
ADMIN_PASSWORD=new_password node server.js
```

### 修改端口

```bash
PORT=8080 node server.js
```

## License

MIT

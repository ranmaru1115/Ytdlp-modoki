# Ytdlp-modoki（YouTube 媒体转换 Web 服务）

一个遵循 Google **Material 3 Design System** 的媒体转换 Web 服务，使用运行在 Windows 家用电脑上的 **yt-dlp** 和 **FFmpeg** 执行媒体处理。

前端以部署到 **Vercel** 为前提，而高负载的转换处理和下载处理则在家用电脑上的后端安全地执行和管理。

---

## 主要特性

- **Material 3 UI**：
  - 完整采用 Material 3 的 Typography、Color Scheme、Surface/Elevation、圆角 Shape（包括 Pill 按钮）
  - 根据操作系统设置自动切换 Light / Dark 模式，同时支持手动选择（Light / Dark / System）
  - 移动端优先的响应式设计，即使在智能手机上也可以方便地进行单手操作
- **支持的媒体格式**：
  - **音频**：MP3（128k、192k、256k、320k）、M4A（AAC）、Opus
  - **视频**：MP4（最高画质、1080p、720p、480p）
- **可靠的任务与进度管理**：
  - `queued` → `fetching` → `downloading` → `converting` → `completed`
  - 使用 Progress Indicator 实时显示 yt-dlp 和 FFmpeg 的处理进度（%）
  - 通过 `MAX_CONCURRENT_JOBS` 限制同时执行的任务数量，防止电脑负载过高
- **自动清理**：
  - 转换完成的文件在指定 TTL（`FILE_TTL_MINUTES`，默认为 30 分钟）后自动删除
  - 对于异常终止或中断任务产生的临时文件，由定时调度器自动清理
- **高级安全机制**：
  - 使用 `spawn` 进行完整的数组参数传递，彻底避免通过 Shell 字符串拼接造成的命令注入
  - URL 语法验证和 SSRF 防护（阻止访问本地网络地址）
  - 路径遍历防护（阻止访问临时目录之外的文件）
  - 速率限制、API 身份验证（`API_TOKEN`）以及 CORS 白名单

---

## 系统架构

```text
                    Internet
                       │
                       ▼
              ┌─────────────────┐
              │ Vercel          │
              │ Web Frontend    │
              │ React + Vite    │
              │ (Material 3 UI) │
              └────────┬────────┘
                       │ HTTPS API（Cloudflare Tunnel / 全球 URL）
                       ▼
              ┌─────────────────┐
              │ Windows 家用电脑 │
              │ Node.js Backend │
              └────────┬────────┘
                       │
                 ┌─────┴─────┐
                 ▼           ▼
              yt-dlp       FFmpeg
                 │           │
                 └─────┬─────┘
                       ▼
                    临时文件
                  (backend/temp/)
                       │
                       ▼
                    浏览器下载
```

---

## 安装步骤

### 1. 安装 Node.js

安装 Node.js（推荐 v20 或更高版本，已测试 v24）。

- 官方网站：[https://nodejs.org/](https://nodejs.org/)

确认安装：

```powershell
node -v
npm -v
```

### 2. 设置 yt-dlp

在 Windows 电脑上准备 `yt-dlp.exe`。

- 官方 GitHub Releases：[https://github.com/yt-dlp/yt-dlp/releases](https://github.com/yt-dlp/yt-dlp/releases)
- 将 `yt-dlp.exe` 放置在任意方便的位置，例如 `C:\Users\<用户名>\yt-dlp.exe`，或者放入已添加到 PATH 的目录。

### 3. 设置 FFmpeg

准备 Windows 版本的 FFmpeg。

- 官方发行来源（例如 gyan.dev）：[https://www.gyan.dev/ffmpeg/builds/](https://www.gyan.dev/ffmpeg/builds/)
- 解压后找到 `bin/ffmpeg.exe`。
- 示例：`C:\Users\<用户名>\Downloads\ffmpeg-master-latest-win64-gpl-shared\bin\ffmpeg.exe`，也可以将其添加到系统 PATH。

### 4. 创建 `.env`

#### 后端配置（`backend/.env`）

将 `backend/.env.example` 复制为 `backend/.env`：

```powershell
cp backend/.env.example backend/.env
```

示例内容：

```env
PORT=4000
HOST=0.0.0.0

# 可执行文件路径（根据实际环境进行配置）
YTDLP_PATH=C:\Users\Ranmaru\yt-dlp.exe
FFMPEG_PATH=C:\Users\Ranmaru\Downloads\ffmpeg-master-latest-win64-gpl-shared\ffmpeg-master-latest-win64-gpl-shared\bin\ffmpeg.exe

# 任务与资源管理
MAX_CONCURRENT_JOBS=2
FILE_TTL_MINUTES=30

# API Token（对外公开时建议设置）
API_TOKEN=your-secret-token

# 允许的 CORS 来源（使用逗号分隔）
ALLOWED_ORIGINS=http://localhost:5173,https://your-app.vercel.app
```

#### 前端配置（`frontend/.env`）

将 `frontend/.env.example` 复制为 `frontend/.env`：

```powershell
cp frontend/.env.example frontend/.env
```

示例内容：

```env
# 本地开发时无需设置（使用 Vite Proxy）
# 部署到 Vercel 时：填写家用电脑后端的公开 URL
VITE_API_URL=https://api.yourdomain.com
VITE_API_TOKEN=your-secret-token
```

### 5. 安装依赖

在项目根目录执行：

```powershell
npm install
```

### 6. 启动开发服务器

#### 同时启动后端和前端

```powershell
npm run dev
```

也可以分别启动：

- 后端：`npm run dev:backend`（`http://localhost:4000`）
- 前端：`npm run dev:frontend`（`http://localhost:5173`）

在浏览器中打开 `http://localhost:5173`，即可显示 Material 3 UI。

---

## 7. 部署到 Vercel

前端可以作为静态 SPA 轻松部署到 Vercel。

1. 将代码仓库推送到 GitHub 等 Git 托管平台。
2. 在 [Vercel Dashboard](https://vercel.com/) 中选择 **New Project**，然后导入代码仓库。
3. 部署设置：
   - **Framework Preset**：`Vite`
   - **Root Directory**：`frontend`
   - **Build Command**：`npm run build`
   - **Output Directory**：`dist`
4. **Environment Variables**：
   - `VITE_API_URL`：家用电脑后端的公开 URL（见下文）
   - `VITE_API_TOKEN`：如果设置了后端 `API_TOKEN`，则填写对应 Token
5. 点击 **Deploy** 完成部署。

---

## 8. 连接家用电脑后端

为了让 Vercel 上的前端安全地连接到家用电脑上的后端，推荐使用免费的 **Cloudflare Tunnel** 等服务。这样无需在路由器上进行端口转发。

### 使用 Cloudflare Tunnel 的示例

```powershell
# 下载 cloudflared 并运行
cloudflared tunnel --url http://localhost:4000
```

运行后会获得一个 URL，例如：

`https://xxxxxx.trycloudflare.com`

然后：

1. 将 Vercel 的域名添加到 `backend/.env` 的 `ALLOWED_ORIGINS`
2. 将生成的 URL 设置为 Vercel 环境变量中的 `VITE_API_URL`
3. 或者通过网页右上角的 ⚙️「设置」对话框直接输入 URL，从而立即连接

---

## API 规范

| 方法 | 端点 | 说明 |
| :--- | :--- | :--- |
| `GET` | `/api/health` | 返回服务器运行状态以及 yt-dlp / FFmpeg 版本信息 |
| `POST` | `/api/info` | 获取视频元数据（标题、缩略图、时长等） |
| `POST` | `/api/jobs` | 创建转换任务（`url`、`format`、`quality`） |
| `GET` | `/api/jobs/:id` | 获取任务状态和进度（0–100%） |
| `GET` | `/api/jobs/:id/download` | 提供转换完成的媒体文件下载 |
| `DELETE` | `/api/jobs/:id` | 删除任务及临时文件 |

---

## 许可证

MIT License

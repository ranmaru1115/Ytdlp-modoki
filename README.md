# Ytdlp-modoki (YouTube Media Conversion Web Service)

A media conversion web service that follows Google's **Material 3 Design System** and uses **yt-dlp** & **FFmpeg** running on a Windows home PC.

The frontend is designed for deployment on **Vercel**, while resource-intensive conversion and download processing are securely executed and managed on the home PC backend.

---

## Main Features

- **Material 3-compliant UI**:
  - Full adoption of Material 3 Typography, Color Scheme, Surface/Elevation, and rounded Shapes (including Pill buttons)
  - Automatic Light / Dark mode switching based on the OS settings, with manual selection (Light / Dark / System)
  - Mobile-first responsive design for comfortable one-handed operation on smartphones
- **Supported Media Formats**:
  - **Audio**: MP3 (128k, 192k, 256k, 320k), M4A (AAC), Opus
  - **Video**: MP4 (Best Quality, 1080p, 720p, 480p)
- **Robust Job & Progress Management**:
  - `queued` → `fetching` → `downloading` → `converting` → `completed`
  - Real-time display of yt-dlp and FFmpeg progress (%) using a Progress Indicator
  - `MAX_CONCURRENT_JOBS` limits the number of simultaneous jobs to prevent excessive PC load
- **Automatic Cleanup**:
  - Converted files are automatically deleted after the specified TTL (`FILE_TTL_MINUTES`, 30 minutes by default)
  - Temporary files from abnormal termination or interrupted jobs are automatically removed by a periodic scheduler
- **Advanced Security**:
  - Complete array-based argument passing with `spawn` to eliminate shell-string command injection
  - URL syntax validation and SSRF protection (blocking requests to local networks)
  - Path traversal protection (blocking access to files outside temporary directories)
  - Rate limiting, API authentication (`API_TOKEN`), and CORS allowlisting

---

## System Architecture

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
                       │ HTTPS API (Cloudflare Tunnel / Global URL)
                       ▼
              ┌─────────────────┐
              │ Home Windows PC │
              │ Node.js Backend │
              └────────┬────────┘
                       │
                 ┌─────┴─────┐
                 ▼           ▼
              yt-dlp       FFmpeg
                 │           │
                 └─────┬─────┘
                       ▼
                 Temporary Files
                  (backend/temp/)
                       │
                       ▼
                Browser Download
```

---

## Setup Instructions

### 1. Install Node.js

Install Node.js (v20 or later recommended, v24 tested).

- Official website: [https://nodejs.org/](https://nodejs.org/)

Verify the installation:

```powershell
node -v
npm -v
```

### 2. Set Up yt-dlp

Prepare `yt-dlp.exe` on your Windows PC.

- Official GitHub Releases: [https://github.com/yt-dlp/yt-dlp/releases](https://github.com/yt-dlp/yt-dlp/releases)
- Place `yt-dlp.exe` in any convenient folder, such as `C:\Users\<username>\yt-dlp.exe`, or in a directory included in PATH.

### 3. Set Up FFmpeg

Prepare FFmpeg for Windows.

- Official distribution source (such as gyan.dev): [https://www.gyan.dev/ffmpeg/builds/](https://www.gyan.dev/ffmpeg/builds/)
- After extracting the archive, locate `bin/ffmpeg.exe`.
- Example: `C:\Users\<username>\Downloads\ffmpeg-master-latest-win64-gpl-shared\bin\ffmpeg.exe`, or configure it through the system PATH.

### 4. Create `.env` Files

#### Backend Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```powershell
cp backend/.env.example backend/.env
```

Example contents:

```env
PORT=4000
HOST=0.0.0.0

# Executable paths (configure according to your environment)
YTDLP_PATH=C:\Users\Ranmaru\yt-dlp.exe
FFMPEG_PATH=C:\Users\Ranmaru\Downloads\ffmpeg-master-latest-win64-gpl-shared\ffmpeg-master-latest-win64-gpl-shared\bin\ffmpeg.exe

# Job & resource management
MAX_CONCURRENT_JOBS=2
FILE_TTL_MINUTES=30

# API token (set this to protect the backend when exposed externally)
API_TOKEN=your-secret-token

# Allowed CORS origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,https://your-app.vercel.app
```

#### Frontend Configuration (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

```powershell
cp frontend/.env.example frontend/.env
```

Example contents:

```env
# Not required for local development (Vite proxy is used)
# When deploying to Vercel: specify the public URL of the home PC backend
VITE_API_URL=https://api.yourdomain.com
VITE_API_TOKEN=your-secret-token
```

### 5. Install Dependencies

Run the following command from the project root:

```powershell
npm install
```

### 6. Start the Development Server

#### Start the backend and frontend together

```powershell
npm run dev
```

To start them individually:

- Backend: `npm run dev:backend` (`http://localhost:4000`)
- Frontend: `npm run dev:frontend` (`http://localhost:5173`)

Open `http://localhost:5173` in your browser to display the Material 3 UI.

---

## 7. Deploy to Vercel

The frontend can be easily deployed to Vercel as a static SPA.

1. Push the repository to GitHub or another Git hosting service.
2. Select **New Project** in the [Vercel Dashboard](https://vercel.com/) and import the repository.
3. Deployment settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   - `VITE_API_URL`: Public URL of the home PC backend (see below)
   - `VITE_API_TOKEN`: The backend `API_TOKEN` if configured
5. Click **Deploy** to complete the deployment.

---

## 8. External Connection to the Home PC Backend

To securely connect the Vercel frontend to the backend running on your home PC, using a free service such as **Cloudflare Tunnel** is recommended. This avoids the need for router port forwarding.

### Example using Cloudflare Tunnel

```powershell
# Download cloudflared and run it
cloudflared tunnel --url http://localhost:4000
```

Use the generated URL (for example, `https://xxxxxx.trycloudflare.com`) as follows:

1. Add the Vercel domain to `ALLOWED_ORIGINS` in `backend/.env`
2. Set the generated URL as `VITE_API_URL` in the Vercel environment variables
3. Alternatively, enter the URL directly through the ⚙️ **Settings** dialog in the web interface for immediate connection

---

## API Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Returns server status and yt-dlp / FFmpeg version information |
| `POST` | `/api/info` | Retrieves video metadata (title, thumbnail, duration, etc.) |
| `POST` | `/api/jobs` | Creates a conversion job (`url`, `format`, `quality`) |
| `GET` | `/api/jobs/:id` | Retrieves job status and progress (0–100%) |
| `GET` | `/api/jobs/:id/download` | Serves the converted media file for download |
| `DELETE` | `/api/jobs/:id` | Deletes the job and temporary files |

---

## License

MIT License

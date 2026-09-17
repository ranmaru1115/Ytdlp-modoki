import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// .env を読み込み
dotenv.config();

// デフォルトで検出されたパス
const defaultYtDlp = 'C:\\Users\\Ranmaru\\yt-dlp.exe';
const defaultFfmpeg = 'C:\\Users\\Ranmaru\\Downloads\\ffmpeg-master-latest-win64-gpl-shared\\ffmpeg-master-latest-win64-gpl-shared\\bin\\ffmpeg.exe';

function resolveBinary(envKey: string, detectedFallback: string, systemCommand: string): string {
  if (process.env[envKey]) {
    return process.env[envKey]!;
  }
  if (fs.existsSync(detectedFallback)) {
    return detectedFallback;
  }
  return systemCommand;
}

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  ytdlpPath: resolveBinary('YTDLP_PATH', defaultYtDlp, 'yt-dlp'),
  ffmpegPath: resolveBinary('FFMPEG_PATH', defaultFfmpeg, 'ffmpeg'),
  tempDir: path.resolve(process.cwd(), 'temp'),
  fileTtlMinutes: parseInt(process.env.FILE_TTL_MINUTES || '30', 10),
  maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '2', 10),
  apiToken: process.env.API_TOKEN || '',
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
};

// 一時ディレクトリが存在することを確認
if (!fs.existsSync(config.tempDir)) {
  fs.mkdirSync(config.tempDir, { recursive: true });
}

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { apiRouter } from './routes/api';
import { authenticate } from './middleware/auth';
import { apiLimiter } from './middleware/rateLimit';
import { startCleanupScheduler } from './services/cleaner';

const app = express();

// セキュリティヘッダー
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS 設定
app.use(
  cors({
    origin: (origin, callback) => {
      // 開発環境やサーバー間通信(originなし)は許可
      if (!origin) return callback(null, true);
      if (
        config.allowedOrigins.includes(origin) ||
        config.allowedOrigins.includes('*') ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// リクエストログミドルウェア (機密情報を除外)
app.use((req: Request, _res: Response, next: NextFunction) => {
  const safePath = req.path;
  console.log(`[${new Date().toISOString()}] ${req.method} ${safePath}`);
  next();
});

// レート制限
app.use('/api/', apiLimiter);

// API 認証
app.use('/api/', authenticate);

// API ルーティング
app.use('/api', apiRouter);

// ルートエンドポイント
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Ytdlp-modoki Media Conversion API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      info: 'POST /api/info',
      createJob: 'POST /api/jobs',
      getJob: 'GET /api/jobs/:id',
      download: 'GET /api/jobs/:id/download',
    },
  });
});

// 404 ハンドラ
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'エンドポイントが見つかりません。' });
});

// グローバルエラーハンドラ
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Server Error]:', err.message || err);
  res.status(err.status || 500).json({
    error: err.message || '内部サーバーエラーが発生しました。',
  });
});

// クリーンアップスケジューラー開始
startCleanupScheduler();

// サーバーリッスン
app.listen(config.port, config.host, () => {
  console.log('====================================================');
  console.log(` Ytdlp-modoki Backend Server running!`);
  console.log(` URL: http://${config.host}:${config.port}`);
  console.log(` yt-dlp binary: ${config.ytdlpPath}`);
  console.log(` FFmpeg binary: ${config.ffmpegPath}`);
  console.log(` Temp Directory: ${config.tempDir}`);
  console.log(` File TTL: ${config.fileTtlMinutes} minutes`);
  console.log(` Max Concurrent Jobs: ${config.maxConcurrentJobs}`);
  console.log(` API Auth: ${config.apiToken ? 'Enabled' : 'Disabled (Open)'}`);
  console.log('====================================================');
});

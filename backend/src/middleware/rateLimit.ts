import rateLimit from 'express-rate-limit';

// 一般APIエンドポイント用 (15分間に100リクエスト)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'リクエスト頻度が高すぎます。しばらく時間をおいてから再試行してください。',
  },
});

// 変換ジョブ作成エンドポイント用 (1分間に10回まで)
export const jobCreateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'ジョブ作成リクエストの制限を超えました。少し待ってから再度お試しください。',
  },
});

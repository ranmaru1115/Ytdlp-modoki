import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/**
 * API トークン認証ミドルウェア
 * API_TOKEN が環境変数に設定されている場合のみ検証を行う
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  if (!config.apiToken) {
    return next();
  }

  const tokenHeader = req.headers['x-api-key'];
  const authHeader = req.headers['authorization'];

  let providedToken: string | undefined;

  if (typeof tokenHeader === 'string') {
    providedToken = tokenHeader;
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    providedToken = authHeader.substring(7);
  }

  if (!providedToken || providedToken !== config.apiToken) {
    res.status(401).json({
      error: '認証エラー: 有効な API トークンが提供されていません。',
    });
    return;
  }

  next();
}

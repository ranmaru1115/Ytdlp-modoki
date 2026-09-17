import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { config } from '../config';
import { validateUrl, isPathInsideDir } from '../utils/security';
import { fetchVideoInfo } from '../services/ytdlp';
import { jobQueue } from '../services/jobQueue';
import { jobCreateLimiter } from '../middleware/rateLimit';

const execFileAsync = promisify(execFile);
export const apiRouter = Router();

/**
 * ヘルスチェック & ツールバージョン情報
 */
apiRouter.get('/health', async (_req: Request, res: Response) => {
  let ytdlpVersion = 'unknown';
  let ffmpegVersion = 'unknown';

  try {
    const { stdout } = await execFileAsync(config.ytdlpPath, ['--version']);
    ytdlpVersion = stdout.trim();
  } catch (err) {
    ytdlpVersion = 'not available';
  }

  try {
    const { stdout } = await execFileAsync(config.ffmpegPath, ['-version']);
    ffmpegVersion = stdout.split('\n')[0].trim();
  } catch (err) {
    ffmpegVersion = 'not available';
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ytdlp: {
      path: config.ytdlpPath,
      version: ytdlpVersion,
    },
    ffmpeg: {
      path: config.ffmpegPath,
      version: ffmpegVersion,
    },
    settings: {
      maxConcurrentJobs: config.maxConcurrentJobs,
      fileTtlMinutes: config.fileTtlMinutes,
    },
  });
});

/**
 * 動画メタデータ事前取得
 */
apiRouter.post('/info', async (req: Request, res: Response) => {
  const { url } = req.body;
  const validation = validateUrl(url);

  if (!validation.valid || !validation.url) {
    res.status(400).json({ error: validation.error || '無効なURLです。' });
    return;
  }

  try {
    const metadata = await fetchVideoInfo(validation.url);
    res.json(metadata);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'メタデータの取得に失敗しました。' });
  }
});

/**
 * ジョブ作成
 */
apiRouter.post('/jobs', jobCreateLimiter, async (req: Request, res: Response) => {
  const { url, format, quality } = req.body;
  const validation = validateUrl(url);

  if (!validation.valid || !validation.url) {
    res.status(400).json({ error: validation.error || '無効なURLです。' });
    return;
  }

  const validFormats = ['mp3', 'm4a', 'opus', 'mp4'];
  const targetFormat = format && validFormats.includes(format.toLowerCase())
    ? format.toLowerCase()
    : 'mp3';

  try {
    const job = await jobQueue.addJob({
      url: validation.url,
      format: targetFormat,
      quality: typeof quality === 'string' ? quality : undefined,
    });

    res.status(201).json({
      jobId: job.id,
      status: job.status,
      message: 'ジョブがキューに追加されました。',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'ジョブの作成に失敗しました。' });
  }
});

/**
 * ジョブステータス・進捗取得
 */
apiRouter.get('/jobs/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const job = jobQueue.getJob(id);

  if (!job) {
    res.status(404).json({ error: '指定されたジョブが見つかりません。' });
    return;
  }

  res.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    statusMessage: job.statusMessage,
    filename: job.filename || null,
    fileSize: job.fileSize || null,
    error: job.error || null,
    metadata: job.metadata || null,
    format: job.format,
    quality: job.quality,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    expiresAt: job.expiresAt,
  });
});

/**
 * 変換済みメディアのダウンロード配信
 */
apiRouter.get('/jobs/:id/download', (req: Request, res: Response) => {
  const { id } = req.params;
  const job = jobQueue.getJob(id);

  if (!job) {
    res.status(404).json({ error: '指定されたジョブが見つかりません。' });
    return;
  }

  if (job.status !== 'completed' || !job.filePath) {
    res.status(400).json({ error: 'ファイルの変換がまだ完了していません。' });
    return;
  }

  // パストラバーサル防止チェック
  const resolvedPath = path.resolve(job.filePath);
  if (!isPathInsideDir(resolvedPath, config.tempDir) || !fs.existsSync(resolvedPath)) {
    res.status(404).json({ error: 'ファイルが存在しないか、アクセス権限がありません。' });
    return;
  }

  const downloadFilename = job.filename || path.basename(resolvedPath);
  const encodedFilename = encodeURIComponent(downloadFilename);

  // Content-Disposition で安全なファイル名指定 (RFC 5987 / UTF-8対応)
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${downloadFilename.replace(/[^\x20-\x7E]/g, '_')}"; filename*=UTF-8''${encodedFilename}`
  );

  // Content-Type 判定
  let contentType = 'application/octet-stream';
  if (job.format === 'mp3') contentType = 'audio/mpeg';
  else if (job.format === 'm4a') contentType = 'audio/mp4';
  else if (job.format === 'opus') contentType = 'audio/ogg';
  else if (job.format === 'mp4') contentType = 'video/mp4';

  res.setHeader('Content-Type', contentType);

  const stream = fs.createReadStream(resolvedPath);
  stream.pipe(res);

  stream.on('error', (err) => {
    console.error(`[Download Error] Failed to stream file: ${resolvedPath}`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'ファイルの送信中にエラーが発生しました。' });
    }
  });

  // ダウンロード完了後にファイル削除するオプション (?autoclean=true) もサポート
  if (req.query.autoclean === 'true') {
    res.on('finish', () => {
      console.log(`[Autoclean] Deleting completed job ${job.id} after download`);
      setTimeout(() => {
        jobQueue.deleteJob(job.id);
      }, 5000);
    });
  }
});

/**
 * ジョブキャンセルまたは削除
 */
apiRouter.delete('/jobs/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = jobQueue.deleteJob(id);

  if (!deleted) {
    res.status(404).json({ error: '指定されたジョブが見つかりません。' });
    return;
  }

  res.json({ message: 'ジョブと関連ファイルを削除しました。' });
});

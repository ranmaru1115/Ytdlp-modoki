import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { jobQueue } from './jobQueue';

/**
 * 期限切れジョブおよび孤立一時ファイルをクリーンアップ
 */
export function cleanupExpiredJobsAndFiles(): void {
  const now = Date.now();
  const jobs = jobQueue.getAllJobs();

  // 1. 期限切れジョブのクリーンアップ
  for (const job of jobs) {
    if (job.expiresAt <= now) {
      console.log(`[Job Expired] Cleaning up job ${job.id}`);
      jobQueue.deleteJob(job.id);
    }
  }

  // 2. tempDir 内の古い孤立ファイルをスキャン・削除
  try {
    if (!fs.existsSync(config.tempDir)) return;

    const files = fs.readdirSync(config.tempDir);
    const ttlMs = config.fileTtlMinutes * 60 * 1000;

    for (const file of files) {
      const fullPath = path.join(config.tempDir, file);
      try {
        const stats = fs.statSync(fullPath);
        if (now - stats.mtimeMs > ttlMs) {
          fs.unlinkSync(fullPath);
          console.log(`[Cleaner] Removed orphan/expired temp file: ${file}`);
        }
      } catch (err) {
        console.error(`[Cleaner] Error checking file ${file}:`, err);
      }
    }
  } catch (err) {
    console.error('[Cleaner] Failed to read temp directory:', err);
  }
}

/**
 * 定期クリーンアップタスクの開始
 */
export function startCleanupScheduler(intervalMs = 5 * 60 * 1000): NodeJS.Timeout {
  // 起動時にまず1回実行
  cleanupExpiredJobsAndFiles();

  return setInterval(() => {
    cleanupExpiredJobsAndFiles();
  }, intervalMs);
}

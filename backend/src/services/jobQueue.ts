import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { Job, OutputFormat, CreateJobRequest } from '../types';
import { fetchVideoInfo, downloadSourceMedia } from './ytdlp';
import { convertMedia } from './ffmpeg';
import { sanitizeFilename } from '../utils/security';

class JobQueue {
  private jobs = new Map<string, Job>();
  private queue: string[] = [];
  private runningCount = 0;

  constructor() {
    //
  }

  /**
   * 新規ジョブを作成してキューに追加
   */
  public async addJob(req: CreateJobRequest): Promise<Job> {
    const id = uuidv4();
    const now = Date.now();
    const ttlMs = config.fileTtlMinutes * 60 * 1000;

    const job: Job = {
      id,
      url: req.url,
      format: (req.format || 'mp3') as OutputFormat,
      quality: req.quality || (req.format === 'mp4' ? 'best' : '192'),
      status: 'queued',
      progress: 0,
      statusMessage: 'キュー待機中…',
      createdAt: now,
      updatedAt: now,
      expiresAt: now + ttlMs,
    };

    this.jobs.set(id, job);
    this.queue.push(id);
    console.log(`[Job Created] ID: ${id}, URL: ${req.url}, Format: ${job.format}`);

    // 次のジョブ処理を試みる
    this.processNext();

    return job;
  }

  /**
   * ジョブを取得
   */
  public getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  /**
   * 全ジョブリスト取得（クリーンアップ用）
   */
  public getAllJobs(): Job[] {
    return Array.from(this.jobs.values());
  }

  /**
   * ジョブおよび関連ファイルの削除
   */
  public deleteJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    if (job.filePath && fs.existsSync(job.filePath)) {
      try {
        fs.unlinkSync(job.filePath);
        console.log(`[File Cleaned] Deleted file: ${job.filePath}`);
      } catch (err) {
        console.error(`[Cleanup Error] Failed to delete file: ${job.filePath}`, err);
      }
    }

    this.jobs.delete(id);
    return true;
  }

  /**
   * キューから次のジョブを実行
   */
  private processNext(): void {
    if (this.runningCount >= config.maxConcurrentJobs) {
      return;
    }

    const nextId = this.queue.shift();
    if (!nextId) {
      return;
    }

    const job = this.jobs.get(nextId);
    if (!job) {
      return this.processNext();
    }

    this.runningCount++;
    this.executeJob(job).finally(() => {
      this.runningCount--;
      this.processNext();
    });
  }

  /**
   * ジョブの実行ライフサイクル
   */
  private async executeJob(job: Job): Promise<void> {
    const isAudioOnly = job.format !== 'mp4';
    let sourceFilePath = '';

    try {
      console.log(`[Job Started] ID: ${job.id}`);

      // 1. メタデータ取得 (fetching)
      job.status = 'fetching';
      job.statusMessage = '動画情報を取得しています…';
      job.updatedAt = Date.now();

      const metadata = await fetchVideoInfo(job.url);
      job.metadata = metadata;

      // 2. ソースメディアダウンロード (downloading)
      job.status = 'downloading';
      job.statusMessage = 'ダウンロード中…';
      job.updatedAt = Date.now();

      const sourceTemplate = path.join(config.tempDir, `${job.id}_src.%(ext)s`);
      sourceFilePath = await downloadSourceMedia(
        job.url,
        sourceTemplate,
        isAudioOnly,
        (percent, message) => {
          job.progress = Math.round(percent * 0.7); // 全体の70%をダウンロードに割り当て
          job.statusMessage = `${message} (${Math.round(percent)}%)`;
          job.updatedAt = Date.now();
        }
      );

      // 3. 変換処理 (converting)
      job.status = 'converting';
      job.statusMessage = 'メディア形式を変換中…';
      job.updatedAt = Date.now();

      const safeTitle = sanitizeFilename(metadata.title || 'media');
      const finalFileName = `${safeTitle}.${job.format}`;
      const finalFilePath = path.join(config.tempDir, `${job.id}_${finalFileName}`);

      await convertMedia({
        inputPath: sourceFilePath,
        outputPath: finalFilePath,
        format: job.format,
        quality: job.quality,
        duration: metadata.duration,
        onProgress: (percent, message) => {
          job.progress = 70 + Math.round(percent * 0.3); // 残り30%を変換に割り当て
          job.statusMessage = message;
          job.updatedAt = Date.now();
        },
      });

      // 4. ソース一時ファイルの削除
      if (fs.existsSync(sourceFilePath)) {
        try {
          fs.unlinkSync(sourceFilePath);
        } catch {
          // ignore
        }
      }

      // 5. ジョブ完了
      const stat = fs.statSync(finalFilePath);
      job.status = 'completed';
      job.progress = 100;
      job.statusMessage = '変換が完了しました';
      job.filename = finalFileName;
      job.filePath = finalFilePath;
      job.fileSize = stat.size;
      job.updatedAt = Date.now();

      console.log(`[Job Completed] ID: ${job.id}, File: ${finalFileName}, Size: ${stat.size} bytes`);
    } catch (err: any) {
      console.error(`[Job Failed] ID: ${job.id}, Error:`, err.message || err);
      job.status = 'failed';
      job.error = err.message || '変換処理中にエラーが発生しました。';
      job.statusMessage = job.error;
      job.updatedAt = Date.now();

      // エラー時のクリーンアップ
      if (sourceFilePath && fs.existsSync(sourceFilePath)) {
        try {
          fs.unlinkSync(sourceFilePath);
        } catch {
          // ignore
        }
      }
    }
  }
}

export const jobQueue = new JobQueue();

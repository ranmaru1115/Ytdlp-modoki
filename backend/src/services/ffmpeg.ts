import { spawn } from 'child_process';
import path from 'path';
import { config } from '../config';
import { OutputFormat } from '../types';

interface ConvertOptions {
  inputPath: string;
  outputPath: string;
  format: OutputFormat;
  quality: string;
  duration?: number;
  onProgress?: (percent: number, message: string) => void;
}

/**
 * FFmpeg を使用してメディアファイルを変換
 */
export async function convertMedia({
  inputPath,
  outputPath,
  format,
  quality,
  duration,
  onProgress,
}: ConvertOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const args: string[] = ['-y', '-i', inputPath];

    // フォーマットに応じたコーデックとビットレートの設定
    switch (format) {
      case 'mp3': {
        const bitrate = `${quality || '192'}k`;
        args.push('-vn', '-c:a', 'libmp3lame', '-b:a', bitrate);
        break;
      }
      case 'm4a': {
        const bitrate = `${quality || '192'}k`;
        args.push('-vn', '-c:a', 'aac', '-b:a', bitrate);
        break;
      }
      case 'opus': {
        const bitrate = `${quality || '128'}k`;
        args.push('-vn', '-c:a', 'libopus', '-b:a', bitrate);
        break;
      }
      case 'mp4': {
        // 動画変換: 互換性のため H.264 + AAC にコンテナ調整
        // 高速化のため、すでに h264/aac の場合はコピー、それ以外は再エンコードを試みる
        args.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart');
        break;
      }
      default:
        return reject(new Error(`未対応の出力形式です: ${format}`));
    }

    args.push(outputPath);

    console.log(`[FFmpeg] Running: ${config.ffmpegPath} with args:`, args.slice(0, 5).join(' '), '...');
    const proc = spawn(config.ffmpegPath, args);

    let stderrData = '';

    // FFmpeg は進捗情報を stderr に出力する
    proc.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderrData += text;

      // time=00:01:23.45 のようなタイムコードを抽出して進捗を計算
      if (duration && duration > 0 && onProgress) {
        const timeMatch = text.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
        if (timeMatch) {
          const hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          const seconds = parseFloat(timeMatch[3]);
          const currentTime = hours * 3600 + minutes * 60 + seconds;
          const pct = Math.min(99, Math.round((currentTime / duration) * 100));
          onProgress(pct, `変換中… (${pct}%)`);
        }
      }
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        console.error('[FFmpeg error] exit code:', code, stderrData.slice(-1000));
        return reject(new Error('FFmpeg による変換処理に失敗しました。'));
      }
      resolve();
    });

    proc.on('error', (err) => {
      console.error('[FFmpeg spawn error]:', err);
      reject(new Error(`FFmpegの実行に失敗しました: ${err.message}`));
    });
  });
}

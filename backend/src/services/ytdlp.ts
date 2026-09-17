import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { VideoMetadata } from '../types';

/**
 * 秒数を HH:MM:SS または MM:SS 形式にフォーマット
 */
function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds)) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * yt-dlp を利用して動画メタデータを取得
 */
export async function fetchVideoInfo(url: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const args = [
      '--dump-single-json',
      '--no-playlist',
      '--no-warnings',
      '--no-call-home',
      '--no-check-certificates',
      url,
    ];

    const proc = spawn(config.ytdlpPath, args);

    let stdoutData = '';
    let stderrData = '';

    proc.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    proc.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        console.error('[yt-dlp error] fetchVideoInfo exit code:', code, stderrData.slice(0, 500));
        return reject(new Error('動画情報の取得に失敗しました。URLが正しいか、公開されている動画かご確認ください。'));
      }

      try {
        const json = JSON.parse(stdoutData);
        const metadata: VideoMetadata = {
          id: json.id || 'unknown',
          title: json.title || 'Untitled',
          thumbnail: json.thumbnail || (json.thumbnails && json.thumbnails[0]?.url) || undefined,
          duration: json.duration || 0,
          durationString: formatDuration(json.duration),
          uploader: json.uploader || json.channel || json.creator || 'Unknown Uploader',
          viewCount: json.view_count,
          description: json.description ? json.description.slice(0, 200) : '',
        };
        resolve(metadata);
      } catch (err) {
        console.error('[yt-dlp error] failed to parse JSON:', err);
        reject(new Error('動画情報データの解析に失敗しました。'));
      }
    });

    proc.on('error', (err) => {
      console.error('[yt-dlp spawn error]:', err);
      reject(new Error(`yt-dlpの実行に失敗しました: ${err.message}`));
    });
  });
}

/**
 * yt-dlp を利用してソースメディアをダウンロード
 * @param url ダウンロード対象URL
 * @param outputTemplate 保存先パス (/path/to/source.%(ext)s)
 * @param isAudioOnly 音声のみ取得するか
 * @param onProgress 進捗コールバック (0-100)
 */
export async function downloadSourceMedia(
  url: string,
  outputTemplate: string,
  isAudioOnly: boolean,
  onProgress: (percent: number, rawMessage: string) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    // 形式指定: 音声の場合は最良音声、動画の場合は最良映像+音声
    const formatArg = isAudioOnly ? 'bestaudio/best' : 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';

    const args = [
      '--no-playlist',
      '--no-warnings',
      '--no-check-certificates',
      '--newline',
      '--progress-template',
      '[download] %(progress._percent_str)s',
      '-f',
      formatArg,
      '-o',
      outputTemplate,
      url,
    ];

    console.log(`[yt-dlp] Downloading: ${config.ytdlpPath}`);
    const proc = spawn(config.ytdlpPath, args);

    let stderrData = '';
    const progressRegex = /\[download\]\s+([\d.]+)%/;

    proc.stdout.on('data', (chunk) => {
      const line = chunk.toString();
      const match = line.match(progressRegex);
      if (match) {
        const percent = parseFloat(match[1]);
        if (!isNaN(percent)) {
          onProgress(Math.min(99, percent), 'ダウンロード中…');
        }
      }
    });

    proc.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        console.error('[yt-dlp download error] exit code:', code, stderrData.slice(0, 500));
        return reject(new Error('動画のダウンロードに失敗しました。'));
      }

      // 出力されたファイルを探す
      const dir = path.dirname(outputTemplate);
      const basePrefix = path.basename(outputTemplate).replace('.%(ext)s', '');
      const files = fs.readdirSync(dir);
      const matched = files.find((f) => f.startsWith(basePrefix));

      if (!matched) {
        return reject(new Error('ダウンロードされたファイルが見つかりませんでした。'));
      }

      const downloadedPath = path.join(dir, matched);
      resolve(downloadedPath);
    });

    proc.on('error', (err) => {
      console.error('[yt-dlp download spawn error]:', err);
      reject(new Error(`yt-dlpの起動に失敗しました: ${err.message}`));
    });
  });
}

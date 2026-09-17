export type JobStatus =
  | 'queued'
  | 'fetching'
  | 'downloading'
  | 'converting'
  | 'completed'
  | 'failed'
  | 'expired';

export type OutputFormat = 'mp3' | 'm4a' | 'opus' | 'mp4';

export interface VideoMetadata {
  id: string;
  title: string;
  thumbnail?: string;
  duration?: number;
  durationString?: string;
  uploader?: string;
  viewCount?: number;
  description?: string;
}

export interface Job {
  id: string;
  url: string;
  format: OutputFormat;
  quality: string;
  status: JobStatus;
  progress: number;
  statusMessage?: string;
  filename?: string;
  filePath?: string;
  fileSize?: number;
  error?: string;
  metadata?: VideoMetadata;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

export interface CreateJobRequest {
  url: string;
  format?: OutputFormat;
  quality?: string;
}

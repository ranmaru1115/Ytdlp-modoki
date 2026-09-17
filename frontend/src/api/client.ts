import axios from 'axios';

// API ベースURL: 環境変数 VITE_API_URL または NEXT_PUBLIC_API_URL、未指定時は相対パス (Viteプロキシ / 同一ホスト)
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window as any).__API_URL__ ||
  '';

const apiClient = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL.replace(/\/$/, '')}/api` : '/api',
  timeout: 60000,
});

// API トークンが存在する場合はヘッダーに付与
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ytdlp_api_token') || import.meta.env.VITE_API_TOKEN;
  if (token) {
    config.headers['X-API-Key'] = token;
  }
  return config;
});

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

export interface JobResponse {
  jobId: string;
  status: 'queued' | 'fetching' | 'downloading' | 'converting' | 'completed' | 'failed' | 'expired';
  progress: number;
  statusMessage?: string;
  filename?: string | null;
  fileSize?: number | null;
  error?: string | null;
  metadata?: VideoMetadata | null;
  format?: string;
  quality?: string;
  createdAt?: number;
  updatedAt?: number;
}

export const api = {
  async checkHealth(): Promise<{ status: string; ytdlp: any; ffmpeg: any }> {
    const res = await apiClient.get('/health');
    return res.data;
  },

  async fetchInfo(url: string): Promise<VideoMetadata> {
    const res = await apiClient.post('/info', { url });
    return res.data;
  },

  async createJob(url: string, format: string, quality: string): Promise<{ jobId: string }> {
    const res = await apiClient.post('/jobs', { url, format, quality });
    return res.data;
  },

  async getJob(jobId: string): Promise<JobResponse> {
    const res = await apiClient.get(`/jobs/${jobId}`);
    return res.data;
  },

  getDownloadUrl(jobId: string, autoclean = false): string {
    const base = API_BASE_URL ? `${API_BASE_URL.replace(/\/$/, '')}/api` : '/api';
    return `${base}/jobs/${jobId}/download${autoclean ? '?autoclean=true' : ''}`;
  },
};

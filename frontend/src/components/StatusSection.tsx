import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Button,
  Box,
} from '@mui/material';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { JobResponse, api } from '../api/client';

interface StatusSectionProps {
  job: JobResponse | null;
  onRetry: () => void;
  onReset: () => void;
}

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const StatusSection: React.FC<StatusSectionProps> = ({ job, onRetry, onReset }) => {
  if (!job) return null;

  const isProcessing =
    job.status === 'queued' ||
    job.status === 'fetching' ||
    job.status === 'downloading' ||
    job.status === 'converting';

  const isCompleted = job.status === 'completed';
  const isFailed = job.status === 'failed' || job.status === 'expired';

  const handleDownload = () => {
    const downloadUrl = api.getDownloadUrl(job.jobId);
    window.location.href = downloadUrl;
  };

  return (
    <Card
      sx={{
        mt: 3,
        border: '1px solid',
        borderColor: isFailed
          ? 'error.main'
          : isCompleted
          ? 'primary.main'
          : 'divider',
        backgroundColor: 'background.paper',
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* 処理中状態 */}
        {isProcessing && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {job.statusMessage || '処理を開始しています…'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {job.progress}%
              </Typography>
            </Box>

            <LinearProgress
              variant={job.status === 'fetching' ? 'indeterminate' : 'determinate'}
              value={job.progress}
              sx={{ height: 8, borderRadius: 4 }}
            />

            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              {job.status === 'fetching' && 'YouTubeからメディア情報を取得しています…'}
              {job.status === 'downloading' && 'yt-dlp で最高品質ソースをダウンロード中…'}
              {job.status === 'converting' && 'FFmpeg で指定形式へエンコード変換中…'}
              {job.status === 'queued' && 'キュー待機中です。まもなく処理が開始されます…'}
            </Typography>
          </Box>
        )}

        {/* 完了状態 */}
        {isCompleted && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', textAlign: 'center' }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: 'rgba(46, 125, 50, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2e7d32',
              }}
            >
              <CheckCircleRoundedIcon sx={{ fontSize: 32 }} />
            </Box>

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                変換が完了しました
              </Typography>
              {job.filename && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, wordBreak: 'break-all' }}>
                  {job.filename} {job.fileSize ? `(${formatBytes(job.fileSize)})` : ''}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, mt: 1, width: '100%', maxWidth: 360, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                startIcon={<DownloadRoundedIcon />}
                onClick={handleDownload}
                sx={{ borderRadius: 3, py: 1.2 }}
              >
                ダウンロード
              </Button>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={onReset}
                sx={{ borderRadius: 3, py: 1.2 }}
              >
                別の動画を変換
              </Button>
            </Box>
          </Box>
        )}

        {/* エラー状態 */}
        {isFailed && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', textAlign: 'center' }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: 'rgba(211, 47, 47, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d32f2f',
              }}
            >
              <ErrorOutlineRoundedIcon sx={{ fontSize: 32 }} />
            </Box>

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                変換できませんでした
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {job.error || 'URLが正しいか確認してください。'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<RefreshRoundedIcon />}
                onClick={onRetry}
                sx={{ borderRadius: 3, px: 3 }}
              >
                再試行
              </Button>
              <Button
                variant="text"
                onClick={onReset}
                sx={{ borderRadius: 3, px: 2 }}
              >
                リセット
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

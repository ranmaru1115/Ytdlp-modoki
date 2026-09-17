import React, { useState, useEffect, useRef } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Container,
  Typography,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  useMediaQuery,
  Paper,
} from '@mui/material';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import ContentPasteRoundedIcon from '@mui/icons-material/ContentPasteRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';

import { getM3Theme, ThemeMode } from './theme/m3Theme';
import { Header } from './components/Header';
import { MediaInfoCard } from './components/MediaInfoCard';
import { StatusSection } from './components/StatusSection';
import { SettingsDialog } from './components/SettingsDialog';
import { api, VideoMetadata, JobResponse } from './api/client';

export const App: React.FC = () => {
  // テーマ管理 (Light / Dark / System)
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('ytdlp_theme_mode') as ThemeMode) || 'system';
  });

  const isDark = themeMode === 'system' ? prefersDarkMode : themeMode === 'dark';
  const theme = React.useMemo(() => getM3Theme(isDark), [isDark]);

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem('ytdlp_theme_mode', mode);
  };

  // サーバー状態
  const [serverOnline, setServerOnline] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // フォーム状態
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('mp3');
  const [quality, setQuality] = useState('192');

  // メディア情報
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);

  // 変換ジョブ状態
  const [currentJob, setCurrentJob] = useState<JobResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // トースト通知
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'error' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // 初期化 & サーバー死活監視
  const checkServer = async () => {
    try {
      const res = await api.checkHealth();
      setServerOnline(res.status === 'ok');
    } catch {
      setServerOnline(false);
    }
  };

  useEffect(() => {
    checkServer();
    const interval = setInterval(checkServer, 15000);
    return () => clearInterval(interval);
  }, []);

  // ポーリングのクリーンアップ
  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, []);

  // URL変更時にメタデータを事前取得 (自動またはフォーカスアウト時)
  const handleFetchInfo = async (targetUrl = url) => {
    const trimmed = targetUrl.trim();
    if (!trimmed || !trimmed.startsWith('http')) return;

    setIsLoadingInfo(true);
    try {
      const info = await api.fetchInfo(trimmed);
      setMetadata(info);
    } catch (err: any) {
      console.warn('Metadata fetch error:', err.message);
      // メタデータ取得失敗時はサイレントにスルー（ジョブ作成時に再試行されるため）
    } finally {
      setIsLoadingInfo(false);
    }
  };

  // ペースト処理
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        handleFetchInfo(text);
      }
    } catch {
      setToast({
        open: true,
        message: 'クリップボードの読み取りを許可してください。',
        severity: 'info',
      });
    }
  };

  // ジョブポーリング
  const startPolling = (jobId: string) => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);

    const poll = async () => {
      try {
        const job = await api.getJob(jobId);
        setCurrentJob(job);

        // 完了またはエラー時はポーリング終了
        if (job.status === 'completed' || job.status === 'failed' || job.status === 'expired') {
          if (pollingTimerRef.current) {
            clearInterval(pollingTimerRef.current);
            pollingTimerRef.current = null;
          }
          if (job.status === 'completed') {
            setToast({
              open: true,
              message: 'メディアの変換が完了しました！',
              severity: 'success',
            });
          }
        }
      } catch (err: any) {
        console.error('Polling error:', err);
      }
    };

    // 直ちに1回実行後、1.2秒間隔でポーリング
    poll();
    pollingTimerRef.current = setInterval(poll, 1200);
  };

  // 変換開始
  const handleConvert = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setToast({
        open: true,
        message: 'URLを入力してください。',
        severity: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createJob(trimmed, format, quality);
      setCurrentJob({
        jobId: res.jobId,
        status: 'queued',
        progress: 0,
        statusMessage: '変換ジョブを開始しています…',
        metadata: metadata,
      });
      startPolling(res.jobId);
    } catch (err: any) {
      setToast({
        open: true,
        message: err.response?.data?.error || err.message || 'ジョブの開始に失敗しました。',
        severity: 'error',
      });
      setCurrentJob({
        jobId: 'failed',
        status: 'failed',
        progress: 0,
        error: err.response?.data?.error || err.message || '変換を開始できませんでした。',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // リセット
  const handleReset = () => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    setCurrentJob(null);
  };

  // フォーマット切り替え時のクオリティ初期値設定
  const handleFormatChange = (newFormat: string) => {
    setFormat(newFormat);
    if (newFormat === 'mp4') {
      setQuality('best');
    } else if (newFormat === 'opus') {
      setQuality('128');
    } else {
      setQuality('192');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        <Header
          themeMode={themeMode}
          onThemeChange={handleThemeChange}
          serverOnline={serverOnline}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <Container
          maxWidth="sm"
          sx={{
            py: { xs: 3, sm: 5 },
            px: { xs: 2, sm: 3 },
            flex: '1 0 auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* メインカード */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            {/* タイトル部 */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 500,
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                  color: 'text.primary',
                }}
              >
                メディアを変換
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.8 }}
              >
                YouTube等の動画を高音質音声や動画へ変換します
              </Typography>
            </Box>

            {/* 入力フォーム */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* URL入力 */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.8, color: 'text.primary' }}>
                  URL
                </Typography>
                <TextField
                  fullWidth
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={() => handleFetchInfo()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleFetchInfo();
                    }
                  }}
                  variant="outlined"
                  aria-label="動画URL入力"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {isLoadingInfo ? (
                          <CircularProgress size={20} sx={{ mr: 0.5 }} />
                        ) : url ? (
                          <IconButton
                            onClick={() => {
                              setUrl('');
                              setMetadata(null);
                            }}
                            size="small"
                            aria-label="URLクリア"
                          >
                            <ClearRoundedIcon fontSize="small" />
                          </IconButton>
                        ) : (
                          <IconButton onClick={handlePaste} size="small" aria-label="URL貼り付け" title="貼り付け">
                            <ContentPasteRoundedIcon fontSize="small" />
                          </IconButton>
                        )}
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* メタデータプレビューカード */}
              {metadata && <MediaInfoCard metadata={metadata} />}

              {/* 形式選択 */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.8, color: 'text.primary' }}>
                  形式
                </Typography>
                <FormControl fullWidth size="medium">
                  <Select
                    value={format}
                    onChange={(e) => handleFormatChange(e.target.value)}
                    aria-label="形式選択"
                  >
                    <MenuItem value="mp3">MP3 (音声 - 汎用・高互換)</MenuItem>
                    <MenuItem value="m4a">M4A (音声 - AAC 高音質)</MenuItem>
                    <MenuItem value="opus">Opus (音声 - 次世代・超高圧縮)</MenuItem>
                    <MenuItem value="mp4">MP4 (動画 - 映像 + 音声)</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* 音質 / 画質選択 */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.8, color: 'text.primary' }}>
                  {format === 'mp4' ? '画質' : '音質'}
                </Typography>
                <FormControl fullWidth size="medium">
                  <Select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    aria-label="音質または画質選択"
                  >
                    {format === 'mp4' ? (
                      [
                        <MenuItem key="best" value="best">最高画質 (利用可能な最大)</MenuItem>,
                        <MenuItem key="1080" value="1080">1080p (Full HD)</MenuItem>,
                        <MenuItem key="720" value="720">720p (HD)</MenuItem>,
                        <MenuItem key="480" value="480">480p (標準)</MenuItem>,
                      ]
                    ) : (
                      [
                        <MenuItem key="128" value="128">128 kbps (軽量)</MenuItem>,
                        <MenuItem key="192" value="192">192 kbps (標準・推奨)</MenuItem>,
                        <MenuItem key="256" value="256">256 kbps (高音質)</MenuItem>,
                        <MenuItem key="320" value="320">320 kbps (最高音質)</MenuItem>,
                      ]
                    )}
                  </Select>
                </FormControl>
              </Box>

              {/* 変換するボタン */}
              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                onClick={handleConvert}
                disabled={isSubmitting || (currentJob !== null && (currentJob.status === 'downloading' || currentJob.status === 'converting' || currentJob.status === 'fetching'))}
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <PlayArrowRoundedIcon />}
                sx={{
                  py: 1.4,
                  fontSize: '1rem',
                  borderRadius: 3,
                  mt: 1,
                }}
              >
                {isSubmitting ? 'リクエスト送信中…' : '変換する'}
              </Button>
            </Box>

            {/* ジョブ状態表示セクション */}
            <StatusSection
              job={currentJob}
              onRetry={handleConvert}
              onReset={handleReset}
            />
          </Paper>

          {/* フッター */}
          <Box sx={{ mt: 'auto', pt: 4, pb: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Powered by yt-dlp & FFmpeg • Material 3 Design
            </Typography>
          </Box>
        </Container>

        {/* トースト通知 */}
        <Snackbar
          open={toast.open}
          autoHideDuration={4000}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={toast.severity}
            onClose={() => setToast((prev) => ({ ...prev, open: false }))}
            sx={{ borderRadius: 3, width: '100%' }}
          >
            {toast.message}
          </Alert>
        </Snackbar>

        {/* 設定ダイアログ */}
        <SettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onSave={() => checkServer()}
        />
      </Box>
    </ThemeProvider>
  );
};

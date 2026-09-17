import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onClose,
  onSave,
}) => {
  const [apiUrl, setApiUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    if (open) {
      setApiUrl(localStorage.getItem('ytdlp_custom_api_url') || '');
      setApiToken(localStorage.getItem('ytdlp_api_token') || '');
      setSavedMessage(false);
    }
  }, [open]);

  const handleSave = () => {
    if (apiUrl.trim()) {
      localStorage.setItem('ytdlp_custom_api_url', apiUrl.trim());
      (window as any).__API_URL__ = apiUrl.trim();
    } else {
      localStorage.removeItem('ytdlp_custom_api_url');
      delete (window as any).__API_URL__;
    }

    if (apiToken.trim()) {
      localStorage.setItem('ytdlp_api_token', apiToken.trim());
    } else {
      localStorage.removeItem('ytdlp_api_token');
    }

    setSavedMessage(true);
    setTimeout(() => {
      onSave();
      onClose();
    }, 600);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 1,
          backgroundColor: 'background.paper',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>接続設定</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Vercelなどの外部から自宅PCのバックエンドに接続する場合は、公開URLやトンネルURL（Cloudflare Tunnel等）を入力してください。
        </Typography>

        {savedMessage && (
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            設定を保存しました。
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="バックエンド API URL"
            placeholder="例: http://localhost:4000 または https://api.yourdomain.com"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            fullWidth
            size="small"
            helperText="空欄の場合はビルド時環境変数またはローカルプロキシを使用します"
          />

          <TextField
            label="API トークン (任意)"
            placeholder="サーバーの API_TOKEN"
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            fullWidth
            size="small"
            helperText="サーバー側で API_TOKEN を設定している場合に入力"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="text" sx={{ borderRadius: 3 }}>
          キャンセル
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary" sx={{ borderRadius: 3, px: 3 }}>
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  Box,
  Chip,
} from '@mui/material';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import SettingsBrightnessRoundedIcon from '@mui/icons-material/SettingsBrightnessRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { ThemeMode } from '../theme/m3Theme';

interface HeaderProps {
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  serverOnline: boolean;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  themeMode,
  onThemeChange,
  serverOnline,
  onOpenSettings,
}) => {
  const cycleTheme = () => {
    if (themeMode === 'system') onThemeChange('light');
    else if (themeMode === 'light') onThemeChange('dark');
    else onThemeChange('system');
  };

  const getThemeIcon = () => {
    if (themeMode === 'light') return <LightModeRoundedIcon />;
    if (themeMode === 'dark') return <DarkModeRoundedIcon />;
    return <SettingsBrightnessRoundedIcon />;
  };

  const getThemeLabel = () => {
    if (themeMode === 'light') return 'ライトモード';
    if (themeMode === 'dark') return 'ダークモード';
    return 'システム連動';
  };

  return (
    <AppBar
      position="static"
      color="transparent"
      elevation={0}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              backgroundColor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.contrastText',
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>
              smart_display
            </span>
          </Box>
          <Typography
            variant="h6"
            component="div"
            sx={{ fontWeight: 600, letterSpacing: -0.2 }}
          >
            Ytdlp-modoki
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={serverOnline ? 'バックエンド接続中 (正常)' : 'バックエンド未接続'}>
            <Chip
              size="small"
              icon={
                serverOnline ? (
                  <CheckCircleRoundedIcon sx={{ fontSize: '14px !important', color: '#2e7d32 !important' }} />
                ) : (
                  <ErrorOutlineRoundedIcon sx={{ fontSize: '14px !important', color: '#d32f2f !important' }} />
                )
              }
              label={serverOnline ? 'Online' : 'Offline'}
              sx={{
                height: 26,
                fontWeight: 500,
                fontSize: '0.75rem',
                backgroundColor: serverOnline ? 'rgba(46, 125, 50, 0.1)' : 'rgba(211, 47, 47, 0.1)',
                color: serverOnline ? '#2e7d32' : '#d32f2f',
                border: 'none',
              }}
            />
          </Tooltip>

          <Tooltip title={`テーマ切替 (${getThemeLabel()})`}>
            <IconButton onClick={cycleTheme} color="inherit" aria-label="テーマ切替" size="medium">
              {getThemeIcon()}
            </IconButton>
          </Tooltip>

          <Tooltip title="設定 (API URL / トークン)">
            <IconButton onClick={onOpenSettings} color="inherit" aria-label="設定" size="medium">
              <SettingsRoundedIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

import { createTheme, ThemeOptions } from '@mui/material/styles';

export type ThemeMode = 'light' | 'dark' | 'system';

// Material 3 トークン定義
export const m3Colors = {
  light: {
    primary: '#6750A4',
    onPrimary: '#FFFFFF',
    primaryContainer: '#EADDFF',
    onPrimaryContainer: '#21005D',
    secondary: '#625B71',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E8DEF8',
    onSecondaryContainer: '#1D192B',
    tertiary: '#7D5260',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FFD8E4',
    onTertiaryContainer: '#31111D',
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    background: '#FEF7FF',
    onBackground: '#1D1B20',
    surface: '#FEF7FF',
    onSurface: '#1D1B20',
    surfaceVariant: '#E7E0EC',
    onSurfaceVariant: '#49454F',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F7F2FA',
    surfaceContainer: '#F3EDF7',
    surfaceContainerHigh: '#ECE6F0',
    surfaceContainerHighest: '#E6E0E9',
    outline: '#79747E',
    outlineVariant: '#CAC4D0',
  },
  dark: {
    primary: '#D0BCFF',
    onPrimary: '#381E72',
    primaryContainer: '#4F378B',
    onPrimaryContainer: '#EADDFF',
    secondary: '#CCC2DC',
    onSecondary: '#332D41',
    secondaryContainer: '#4A4458',
    onSecondaryContainer: '#E8DEF8',
    tertiary: '#EFB8C8',
    onTertiary: '#492532',
    tertiaryContainer: '#633B48',
    onTertiaryContainer: '#FFD8E4',
    error: '#FFB4AB',
    onError: '#690005',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',
    background: '#141218',
    onBackground: '#E6E0E9',
    surface: '#141218',
    onSurface: '#E6E0E9',
    surfaceVariant: '#49454F',
    onSurfaceVariant: '#CAC4D0',
    surfaceContainerLowest: '#0F0D13',
    surfaceContainerLow: '#1D1B20',
    surfaceContainer: '#211F26',
    surfaceContainerHigh: '#2B2930',
    surfaceContainerHighest: '#36343B',
    outline: '#938F99',
    outlineVariant: '#49454F',
  },
};

export function getM3Theme(isDark: boolean) {
  const palette = isDark ? m3Colors.dark : m3Colors.light;

  const options: ThemeOptions = {
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: palette.primary,
        contrastText: palette.onPrimary,
      },
      secondary: {
        main: palette.secondary,
        contrastText: palette.onSecondary,
      },
      error: {
        main: palette.error,
        contrastText: palette.onError,
      },
      background: {
        default: palette.background,
        paper: palette.surfaceContainer,
      },
      text: {
        primary: palette.onSurface,
        secondary: palette.onSurfaceVariant,
      },
      divider: palette.outlineVariant,
    },
    typography: {
      fontFamily: '"Roboto", "Google Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h1: {
        fontSize: '2.25rem', // Headline Large
        lineHeight: 1.25,
        fontWeight: 400,
        letterSpacing: 0,
      },
      h2: {
        fontSize: '1.75rem', // Headline Medium
        lineHeight: 1.3,
        fontWeight: 400,
      },
      h3: {
        fontSize: '1.5rem', // Headline Small
        lineHeight: 1.33,
        fontWeight: 400,
      },
      h6: {
        fontSize: '1.125rem', // Title Medium
        fontWeight: 500,
        lineHeight: 1.4,
      },
      body1: {
        fontSize: '1rem', // Body Large
        lineHeight: 1.5,
        letterSpacing: 0.5,
      },
      body2: {
        fontSize: '0.875rem', // Body Medium
        lineHeight: 1.43,
        letterSpacing: 0.25,
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
        letterSpacing: 0.1,
      },
    },
    shape: {
      borderRadius: 16, // Material 3 rounded standard
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 24, // M3 Pill Button
            padding: '10px 24px',
            fontSize: '0.875rem',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          containedPrimary: {
            backgroundColor: palette.primary,
            color: palette.onPrimary,
            '&:hover': {
              backgroundColor: isDark ? '#B69DF8' : '#573D96',
            },
          },
          outlined: {
            borderColor: palette.outline,
            borderRadius: 24,
            '&:hover': {
              borderColor: palette.primary,
              backgroundColor: isDark ? 'rgba(208, 188, 255, 0.08)' : 'rgba(103, 80, 164, 0.08)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            backgroundColor: palette.surfaceContainerLow,
            border: `1px solid ${palette.outlineVariant}`,
            boxShadow: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: palette.outlineVariant,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: palette.outline,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: palette.primary,
              borderWidth: 2,
            },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            height: 8,
            backgroundColor: palette.surfaceContainerHighest,
          },
          bar: {
            borderRadius: 8,
            backgroundColor: palette.primary,
          },
        },
      },
    },
  };

  return createTheme(options);
}

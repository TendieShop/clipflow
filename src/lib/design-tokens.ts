/**
 * Design Tokens - Centralized CSS variables as TypeScript
 * 
 * Usage: Import tokens and use in components:
 *   import { colors, spacing } from '@/lib/design-tokens';
 *   style={{ backgroundColor: colors.bg.primary }}
 * 
 * CSS variables are auto-generated during build.
 */

// Color tokens (dark theme default for Tauri/desktop)
export const colors = {
  bg: {
    primary: '#0a0a0a',
    secondary: '#1a1a1a',
    tertiary: '#2a2a2a',
  },
  accent: {
    primary: '#3b82f6',
    hover: '#2563eb',
    muted: 'rgba(59, 130, 246, 0.1)',
  },
  text: {
    primary: '#ffffff',
    secondary: '#a1a1aa',
    muted: '#71717a',
  },
  status: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  border: {
    default: '#2a2a2a',
    hover: '#3a3a3a',
    active: '#4a4a4a',
  },
};

// Spacing tokens
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
};

// Border radius tokens
export const radius = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  full: '9999px',
};

// Typography tokens
export const typography = {
  fontFamily: {
    sans: 'system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, monospace',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

// Export all as CSS variables string (for injection)
export function getCSSVariables(): string {
  return `
    :root {
      --bg-primary: ${colors.bg.primary};
      --bg-secondary: ${colors.bg.secondary};
      --bg-tertiary: ${colors.bg.tertiary};
      --accent: ${colors.accent.primary};
      --accent-hover: ${colors.accent.hover};
      --accent-muted: ${colors.accent.muted};
      --text-primary: ${colors.text.primary};
      --text-secondary: ${colors.text.secondary};
      --text-muted: ${colors.text.muted};
      --success: ${colors.status.success};
      --warning: ${colors.status.warning};
      --error: ${colors.status.error};
      --info: ${colors.status.info};
      --border-default: ${colors.border.default};
      --border-hover: ${colors.border.hover};
      --border-active: ${colors.border.active};
      --radius-sm: ${radius.sm};
      --radius-md: ${radius.md};
      --radius-lg: ${radius.lg};
      --radius-full: ${radius.full};
    }
  `.trim();
}

export default {
  colors,
  spacing,
  radius,
  typography,
  getCSSVariables,
};

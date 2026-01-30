/**
 * Design Tokens - ClipFlow Design System
 * 
 * Centralized CSS variables as TypeScript
 * Policy: DESIGN_SYSTEM_POLICY.md
 * 
 * Usage: Import tokens and use in components:
 *   import { colors, spacing } from '@/lib/design-tokens';
 *   style={{ backgroundColor: colors.bg.primary }}
 * 
 * CSS variables are auto-generated during build.
 */

// ============================================
// COLOR SYSTEM
// ============================================

export const colors = {
  // Background hierarchy
  bg: {
    primary: '#09090b',    // App background (warm black)
    secondary: '#18181b',  // Card backgrounds
    tertiary: '#27272a',   // Elevated surfaces
    elevated: '#3f3f46',   // Pop-out elements
  },
  
  // Accent colors (Indigo-based)
  accent: {
    primary: '#6366f1',    // Primary actions
    hover: '#818cf8',      // Hover state
    muted: 'rgba(99, 102, 241, 0.1)',
    glow: 'rgba(99, 102, 241, 0.15)',
  },
  
  // Text hierarchy
  text: {
    primary: '#f4f4f5',    // Primary text (not pure white)
    secondary: '#a1a1aa',  // Secondary text
    muted: '#71717a',      // Disabled/hint text
    inverse: '#18181b',    // Text on accent background
  },
  
  // Status colors
  status: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#6366f1',
  },
  
  // Border hierarchy
  border: {
    subtle: '#27272a',     // Default borders
    medium: '#3f3f46',     // Hover states
    strong: '#52525b',     // Active states
    accent: '#6366f1',     // Focus states
  },
};

// ============================================
// TYPOGRAPHY SYSTEM
// ============================================

export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace',
  },
  
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
  },
};

// ============================================
// SPACING SYSTEM
// ============================================

export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
};

// ============================================
// BORDER RADIUS
// ============================================

export const radius = {
  sm: '0.375rem',   // 6px - Small elements (tags, badges)
  md: '0.5rem',     // 8px - Buttons, inputs
  lg: '0.75rem',    // 12px - Cards, dialogs
  xl: '1rem',       // 16px - Large containers
  full: '9999px',   // Pills, avatars
};

// ============================================
// ELEVATION SYSTEM (Shadows)
// ============================================

export const elevation = {
  low: '0 1px 2px rgba(0, 0, 0, 0.3)',
  medium: '0 4px 6px rgba(0, 0, 0, 0.4)',
  high: '0 10px 15px rgba(0, 0, 0, 0.5)',
  glow: '0 0 20px rgba(99, 102, 241, 0.15)',
};

// ============================================
// TRANSITIONS
// ============================================

export const transitions = {
  fast: '0.15s ease',
  normal: '0.2s ease',
  slow: '0.3s ease',
};

// ============================================
// Z-INDEX SCALE
// ============================================

export const zIndex = {
  dropdown: 100,
  sticky: 200,
  modal: 300,
  popover: 400,
  tooltip: 500,
};

// ============================================
// ANIMATIONS
// ============================================

export const animations = {
  fadeIn: 'fadeIn 0.2s ease',
  fadeOut: 'fadeOut 0.2s ease',
  slideUp: 'slideUp 0.3s ease',
  slideDown: 'slideDown 0.3s ease',
  scaleIn: 'scaleIn 0.2s ease',
  pulse: 'pulse 2s infinite',
};

// Keyframes (for CSS injection)
export const keyframes = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  @keyframes slideUp {
    from { transform: translateY(10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes slideDown {
    from { transform: translateY(-10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

// ============================================
// CSS VARIABLES GENERATION
// ============================================

export function getCSSVariables(): string {
  return `
    :root {
      /* Colors - Background */
      --bg-primary: ${colors.bg.primary};
      --bg-secondary: ${colors.bg.secondary};
      --bg-tertiary: ${colors.bg.tertiary};
      --bg-elevated: ${colors.bg.elevated};
      
      /* Colors - Accent */
      --accent: ${colors.accent.primary};
      --accent-hover: ${colors.accent.hover};
      --accent-muted: ${colors.accent.muted};
      --accent-glow: ${colors.accent.glow};
      
      /* Colors - Text */
      --text-primary: ${colors.text.primary};
      --text-secondary: ${colors.text.secondary};
      --text-muted: ${colors.text.muted};
      --text-inverse: ${colors.text.inverse};
      
      /* Colors - Status */
      --success: ${colors.status.success};
      --warning: ${colors.status.warning};
      --error: ${colors.status.error};
      --info: ${colors.status.info};
      
      /* Colors - Borders */
      --border-subtle: ${colors.border.subtle};
      --border-medium: ${colors.border.medium};
      --border-strong: ${colors.border.strong};
      --border-accent: ${colors.border.accent};
      
      /* Typography */
      --font-sans: ${typography.fontFamily.sans};
      --font-mono: ${typography.fontFamily.mono};
      --text-xs: ${typography.fontSize.xs};
      --text-sm: ${typography.fontSize.sm};
      --text-base: ${typography.fontSize.base};
      --text-lg: ${typography.fontSize.lg};
      --text-xl: ${typography.fontSize.xl};
      --text-2xl: ${typography.fontSize['2xl']};
      --text-3xl: ${typography.fontSize['3xl']};
      
      /* Spacing */
      --space-xs: ${spacing.xs};
      --space-sm: ${spacing.sm};
      --space-md: ${spacing.md};
      --space-lg: ${spacing.lg};
      --space-xl: ${spacing.xl};
      --space-2xl: ${spacing['2xl']};
      
      /* Border Radius */
      --radius-sm: ${radius.sm};
      --radius-md: ${radius.md};
      --radius-lg: ${radius.lg};
      --radius-xl: ${radius.xl};
      --radius-full: ${radius.full};
      
      /* Elevation */
      --shadow-low: ${elevation.low};
      --shadow-medium: ${elevation.medium};
      --shadow-high: ${elevation.high};
      --shadow-glow: ${elevation.glow};
      
      /* Transitions */
      --transition-fast: ${transitions.fast};
      --transition-normal: ${transitions.normal};
      --transition-slow: ${transitions.slow};
      
      /* Z-Index */
      --z-dropdown: ${zIndex.dropdown};
      --z-sticky: ${zIndex.sticky};
      --z-modal: ${zIndex.modal};
      --z-popover: ${zIndex.popover};
      --z-tooltip: ${zIndex.tooltip};
    }
    
    /* Animations */
    ${keyframes}
    
    /* Global styles */
    * {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    body {
      background: var(--bg-primary);
      color: var(--text-primary);
      font-family: var(--font-sans);
    }
    
    ::selection {
      background: var(--accent-muted);
    }
  `.trim();
}

// ============================================
// EXPORTS
// ============================================

export default {
  colors,
  typography,
  spacing,
  radius,
  elevation,
  transitions,
  zIndex,
  animations,
  getCSSVariables,
};

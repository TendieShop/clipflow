# ClipFlow Design System Policy

**Effective Date:** January 30, 2026  
**Policy Owner:** Steward  
**Enforcement:** All PRs must pass design token validation

---

## Purpose

This policy establishes design system standards for ClipFlow to ensure a consistent, beautiful, and professional user interface. All new code and refactoring must adhere to these guidelines.

---

## Core Principles

### 1. Visual Hierarchy
- Clear distinction between primary, secondary, and tertiary elements
- Accent colors used sparingly for focus states
- Text hierarchy: primary → secondary → muted

### 2. Depth & Dimension
- Use shadows to create elevation
- Use backdrop blur for overlays
- Subtle hover states with lift effect

### 3. Consistency
- All design tokens defined in one place (`design-tokens.ts`)
- Components use tokens, not hardcoded values
- Spacing, colors, and typography are systematic

### 4. Polish
- Smooth transitions on all interactive elements
- Visual feedback on user actions
- Professional, modern aesthetic

---

## Design Tokens

### Color System

```typescript
colors = {
  bg: {
    primary: '#09090b',    // App background
    secondary: '#18181b',  // Card backgrounds
    tertiary: '#27272a',   // Elevated surfaces
    elevated: '#3f3f46',   // Pop-out elements
  },
  accent: {
    primary: '#6366f1',    // Primary actions (Indigo)
    hover: '#818cf8',      // Hover state
    muted: 'rgba(99, 102, 241, 0.1)',
    glow: 'rgba(99, 102, 241, 0.15)',
  },
  text: {
    primary: '#f4f4f5',    // Primary text
    secondary: '#a1a1aa',  // Secondary text
    muted: '#71717a',      // Disabled/hint text
    inverse: '#18181b',    // Text on accent
  },
  status: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#6366f1',
  },
  border: {
    subtle: '#27272a',
    medium: '#3f3f46',
    strong: '#52525b',
    accent: '#6366f1',
  },
}
```

### Typography System

```typescript
typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'JetBrains Mono, ui-monospace, monospace',
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
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
  },
}
```

### Spacing System

```typescript
spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
}
```

### Border Radius

```typescript
radius = {
  sm: '0.375rem',  // Small elements
  md: '0.5rem',    // Buttons, inputs
  lg: '0.75rem',   // Cards, dialogs
  xl: '1rem',      // Large dialogs
  full: '9999px',  // Pills, badges
}
```

### Elevation System

```typescript
elevation = {
  low: '0 1px 2px rgba(0, 0, 0, 0.3)',
  medium: '0 4px 6px rgba(0, 0, 0, 0.4)',
  high: '0 10px 15px rgba(0, 0, 0, 0.5)',
  glow: '0 0 20px rgba(99, 102, 241, 0.15)',
}
```

### Transitions

```typescript
transitions = {
  fast: '0.15s ease',
  normal: '0.2s ease',
  slow: '0.3s ease',
}
```

---

## Component Standards

### Buttons

```typescript
// Secondary (default)
button.secondary = {
  bg: 'var(--bg-tertiary)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
  padding: '0.625rem 1.25rem',
  transition: 'var(--transition-normal)',
}

// Primary
button.primary = {
  bg: 'var(--accent-primary)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  padding: '0.625rem 1.25rem',
  boxShadow: 'var(--elevation-glow)',
  transition: 'var(--transition-normal)',
}

// Hover state
button:hover = {
  transform: 'translateY(-1px)',
  boxShadow: 'var(--elevation-medium)',
}
```

### Cards

```typescript
card = {
  bg: 'var(--bg-secondary)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: '1.5rem',
  transition: 'var(--transition-normal)',
}

card:hover = {
  borderColor: 'var(--border-medium)',
  boxShadow: 'var(--elevation-medium)',
}
```

### Inputs

```typescript
input = {
  bg: 'var(--bg-primary)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
  padding: '0.625rem 0.875rem',
  transition: 'var(--transition-normal)',
}

input:focus = {
  borderColor: 'var(--accent-primary)',
  boxShadow: '0 0 0 3px var(--accent-muted)',
  outline: 'none',
}
```

### Dialogs

```typescript
dialog.overlay = {
  bg: 'rgba(0, 0, 0, 0.7)',
  backdropFilter: 'blur(4px)',
}

dialog.content = {
  bg: 'var(--bg-secondary)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-xl)',
  boxShadow: 'var(--elevation-high)',
}
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Update design tokens
- [ ] Add typography tokens
- [ ] Add elevation system
- [ ] Add transition system

### Phase 2: Components
- [ ] Redesign buttons
- [ ] Redesign cards
- [ ] Redesign inputs
- [ ] Redesign dialogs
- [ ] Add badges component

### Phase 3: Polish
- [ ] Add animations
- [ ] Add hover states
- [ ] Add backdrop blur
- [ ] Add focus states

### Phase 4: Validation
- [ ] Add design token linting
- [ ] Add visual regression tests
- [ ] Document all components

---

## Enforcement

### Code Review Requirements
All PRs must:
1. ✅ Use design tokens for all colors, spacing, typography
2. ✅ Include hover/focus states for interactive elements
3. ✅ Pass linting (no hardcoded values)
4. ✅ Pass visual regression tests

### Validation Commands

```bash
# Check for hardcoded values
npm run lint:design

# Run visual regression tests
npm run test:visual

# Full design validation
npm run validate:design
```

---

## References

- **Inspiration:** Linear, Obsidian, Vercel, Framer
- **Figma Community:** Video Editor App UI UX Design Kit
- **Documentation:** `CLIPFLOW_UI_IMPROVEMENTS.md`

---

**Policy created:** January 30, 2026  
**Next review:** February 15, 2026

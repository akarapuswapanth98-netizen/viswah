// VISWAH Design Tokens — Authoritative source for JS usage
// CSS variables in index.css are authoritative for CSS usage.
// Both share the same values.

export const colors = {
  ink: "#0C0A14",
  surface: "#161222",
  surfaceHover: "#1E1832",
  elevated: "#241E38",
  floating: "#2A2344",

  saffron: "#E8A838",
  saffronMuted: "#C4893A",
  saffronDim: "#9A6B2A",
  raga: "#C77DBA",
  ragaMuted: "#9A5E90",
  teal: "#5BA8A0",
  tealMuted: "#478A83",

  text: "#F0EBE3",
  textSecondary: "#A89FB8",
  textMuted: "#8075A0",
  textInverse: "#0C0A14",

  success: "#6DBF73",
  error: "#D46A6A",
  warning: "#D4A84A",
  info: "#5B8EC7",

  border: "rgba(240, 235, 227, 0.06)",
  borderHover: "rgba(240, 235, 227, 0.12)",
  borderFocus: "rgba(232, 168, 56, 0.4)",
  borderAccent: "rgba(232, 168, 56, 0.2)",
};

export const shadows = {
  sm: "0 1px 3px rgba(12, 10, 20, 0.4)",
  md: "0 4px 16px rgba(12, 10, 20, 0.5)",
  lg: "0 8px 40px rgba(12, 10, 20, 0.6)",
  xl: "0 16px 64px rgba(12, 10, 20, 0.7)",
  inner: "inset 0 1px 2px rgba(0,0,0,0.3)",
  glow: "0 0 40px rgba(232, 168, 56, 0.08)",
};

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const spacing = {
  0: 0,
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
};

export const typography = {
  fontSans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontMono: "'JetBrains Mono', monospace",

  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  md: "1.125rem",
  lg: "1.25rem",
  xl: "1.5rem",
  "2xl": "2rem",
  "3xl": "2.5rem",
  "4xl": "3rem",

  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  display: 800,

  tight: 1.2,
  body: 1.5,
  relaxed: 1.7,
};

export const transitions = {
  fast: "120ms ease-out",
  base: "200ms ease-out",
  slow: "400ms ease-out",
  spring: "300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
};

export const layout = {
  maxWidth: 1200,
  sidebarWidth: 260,
  headerHeight: 64,
};

// Derived style helpers for inline styles
export const card = (overrides = {}) => ({
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.lg,
  padding: spacing[6],
  transition: `border-color ${transitions.base}, box-shadow ${transitions.base}`,
  ...overrides,
});

export const input = (overrides = {}) => ({
  background: colors.ink,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.md,
  color: colors.text,
  padding: `${spacing[3]} ${spacing[4]}`,
  fontSize: typography.sm,
  fontFamily: typography.fontSans,
  outline: "none",
  transition: `border-color ${transitions.base}`,
  width: "100%",
  boxSizing: "border-box",
  ...overrides,
});

export const btn = (variant = "primary", overrides = {}) => {
  const base = {
    border: "none",
    borderRadius: radii.md,
    padding: `${spacing[3]} ${spacing[5]}`,
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    cursor: "pointer",
    transition: `all ${transitions.base}`,
    fontFamily: typography.fontSans,
    minHeight: 44,
  };
  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${colors.saffron}, ${colors.saffronMuted})`,
      color: colors.textInverse,
      boxShadow: "0 2px 12px rgba(232, 168, 56, 0.2)",
    },
    secondary: {
      background: colors.surface,
      color: colors.text,
      border: `1px solid ${colors.border}`,
    },
    ghost: {
      background: "transparent",
      color: colors.textSecondary,
    },
    danger: {
      background: colors.error,
      color: "#fff",
    },
  };
  return { ...base, ...variants[variant], ...overrides };
};

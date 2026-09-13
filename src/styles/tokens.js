// VISWAH Design Tokens — Human-designed, immersive, musical
// Concert hall warmth meets spatial depth

export const colors = {
  // Core — deep, warm, immersive
  ink: "#0C0A14",           // deepest background (near-black with warmth)
  surface: "#161222",       // base surface
  surfaceHover: "#1E1832",  // hover
  elevated: "#241E38",      // cards, elevated panels
  floating: "#2A2344",      // floating elements, modals

  // Accent — restrained warmth
  saffron: "#E8A838",       // primary (warm gold)
  saffronMuted: "#C4893A",
  saffronDim: "#9A6B2A",
  raga: "#C77DBA",          // secondary (muted violet)
  ragaMuted: "#9A5E90",
  teal: "#5BA8A0",          // tertiary (copper patina)
  tealMuted: "#478A83",

  // Text
  textPrimary: "#F0EBE3",   // warm white
  textSecondary: "#A89FB8", // muted lavender
  textMuted: "#6B6080",     // very muted

  // Semantic
  success: "#6DBF73",
  error: "#D46A6A",
  warning: "#D4A84A",
  info: "#5B8EC7",

  // Borders
  border: "rgba(240, 235, 227, 0.06)",
  borderHover: "rgba(240, 235, 227, 0.12)",
  borderFocus: "rgba(232, 168, 56, 0.4)",
  borderAccent: "rgba(232, 168, 56, 0.2)",
};

export const depth = {
  // CSS transform values for 3D depth
  flat: { transform: "translateZ(0)" },
  lifted: { transform: "translateZ(20px)" },
  floating: { transform: "translateZ(40px)" },
  elevated: { transform: "translateZ(60px)" },

  // Perspective containers
  perspective: { perspective: "1200px" },
  perspectiveDeep: { perspective: "800px" },

  // Z-index layers
  zBase: 1,
  zLifted: 10,
  zFloating: 20,
  zOverlay: 50,
  zModal: 100,
  zToast: 200,
};

export const surfaces = {
  // Surface levels with depth shadows
  base: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 14,
  },
  raised: {
    background: colors.elevated,
    border: `1px solid ${colors.border}`,
    borderRadius: 14,
    boxShadow: "0 4px 20px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)",
  },
  floating: {
    background: colors.floating,
    border: `1px solid ${colors.borderHover}`,
    borderRadius: 16,
    boxShadow: "0 8px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)",
  },
  glass: {
    background: "rgba(22, 18, 34, 0.8)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: `1px solid ${colors.border}`,
    borderRadius: 14,
  },
  glassHover: {
    background: "rgba(30, 24, 50, 0.85)",
    border: `1px solid ${colors.borderHover}`,
  },
};

export const glow = {
  // Subtle ambient glows — not neon, more like warm lamplight
  saffron: "0 0 40px rgba(232, 168, 56, 0.08)",
  raga: "0 0 40px rgba(199, 125, 186, 0.08)",
  teal: "0 0 40px rgba(91, 168, 160, 0.08)",
  saffronIntense: "0 0 60px rgba(232, 168, 56, 0.15), 0 0 20px rgba(232, 168, 56, 0.1)",
  ragaIntense: "0 0 60px rgba(199, 125, 186, 0.15), 0 0 20px rgba(199, 125, 186, 0.1)",

  // Instrument-inspired
  pianoKey: "0 2px 8px rgba(0,0,0,0.4), 0 0 12px rgba(232, 168, 56, 0.06)",
  stringVibration: "0 0 30px rgba(199, 125, 186, 0.12)",
};

export const typography = {
  fontSans: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
  fontDisplay: "'Playfair Display', 'Georgia', serif",

  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  md: "1.125rem",
  lg: "1.25rem",
  xl: "1.5rem",
  "2xl": "2rem",
  "3xl": "2.5rem",
  "4xl": "3rem",
  "5xl": "3.75rem",

  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  display: 800,

  tight: 1.2,
  body: 1.5,
  relaxed: 1.7,
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

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  "2xl": 24,
  full: 9999,
};

export const shadows = {
  sm: "0 1px 3px rgba(12, 10, 20, 0.4)",
  md: "0 4px 16px rgba(12, 10, 20, 0.5)",
  lg: "0 8px 40px rgba(12, 10, 20, 0.6)",
  xl: "0 16px 64px rgba(12, 10, 20, 0.7)",
  inner: "inset 0 1px 2px rgba(0,0,0,0.3)",
};

export const transitions = {
  fast: "120ms ease-out",
  base: "200ms ease-out",
  slow: "400ms ease-out",
  slower: "600ms ease-out",
  spring: "300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
  gentle: "500ms cubic-bezier(0.25, 0.1, 0.25, 1)",
};

export const layout = {
  maxWidth: 1200,
  sidebarWidth: 260,
  headerHeight: 64,
  cardMinHeight: 120,
  contentPadding: 40,
};

// Derived style helpers
export const card = (overrides = {}) => ({
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.lg,
  padding: spacing[6],
  transition: `border-color ${transitions.base}, box-shadow ${transitions.base}`,
  ...overrides,
});

export const cardHover = {
  borderColor: colors.borderHover,
  boxShadow: shadows.md,
};

export const input = (overrides = {}) => ({
  background: colors.ink,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.md,
  color: colors.textPrimary,
  padding: `${spacing[3]} ${spacing[4]}`,
  fontSize: typography.sm,
  fontFamily: typography.fontSans,
  outline: "none",
  transition: `border-color ${transitions.base}, box-shadow ${transitions.base}`,
  width: "100%",
  boxSizing: "border-box",
  ...overrides,
});

export const btn = (variant = "primary", overrides = {}) => {
  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${colors.saffron}, ${colors.saffronMuted})`,
      color: colors.ink,
      fontWeight: typography.semibold,
      boxShadow: "0 2px 12px rgba(232, 168, 56, 0.2)",
    },
    secondary: {
      background: colors.surface,
      color: colors.textPrimary,
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
  return {
    border: "none",
    borderRadius: radii.md,
    padding: `${spacing[3]} ${spacing[5]}`,
    fontSize: typography.sm,
    fontWeight: typography.medium,
    cursor: "pointer",
    transition: `all ${transitions.base}`,
    fontFamily: typography.fontSans,
    ...variants[variant],
    ...overrides,
  };
};

// 3D ambient background patterns
export const ambient = {
  // Radial gradient for ambient lighting
  studioLight: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(232, 168, 56, 0.06), transparent)`,
  ragaLight: `radial-gradient(ellipse 60% 40% at 80% 20%, rgba(199, 125, 186, 0.05), transparent)`,
  tealLight: `radial-gradient(ellipse 60% 40% at 20% 80%, rgba(91, 168, 160, 0.04), transparent)`,
  combined: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(232, 168, 56, 0.06), transparent), radial-gradient(ellipse 60% 40% at 80% 20%, rgba(199, 125, 186, 0.04), transparent), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(91, 168, 160, 0.03), transparent)`,
};

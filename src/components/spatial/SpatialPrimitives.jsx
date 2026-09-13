import { useState, useCallback } from "react";
import { colors, shadows, transitions, radii, depth } from "../../styles/tokens";

export function DepthCard({
  children,
  variant = "base", // base | raised | floating | glass
  hover = true,
  onClick,
  onKeyDown,
  style = {},
  className,
  ...props
}) {
  const [hovered, setHovered] = useState(false);

  const surfaces = {
    base: {
      background: colors.surface,
      border: `1px solid ${colors.border}`,
    },
    raised: {
      background: colors.elevated,
      border: `1px solid ${colors.border}`,
      boxShadow: shadows.md,
    },
    floating: {
      background: colors.floating,
      border: `1px solid ${colors.borderHover}`,
      boxShadow: shadows.lg,
    },
    glass: {
      background: "rgba(22, 18, 34, 0.7)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: `1px solid ${colors.border}`,
    },
  };

  const baseStyle = {
    borderRadius: radii.lg,
    padding: "24px",
    transition: `transform ${transitions.base}, box-shadow ${transitions.base}, border-color ${transitions.base}`,
    cursor: onClick ? "pointer" : "default",
    transform: hovered && hover ? "translateY(-4px) translateZ(10px)" : "translateZ(0)",
    ...surfaces[variant],
    ...(hovered && hover ? {
      borderColor: colors.borderHover,
      boxShadow: shadows.lg,
    } : {}),
    ...style,
  };

  return (
    <div
      className={className}
      style={baseStyle}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

export function FloatingPanel({
  children,
  depth: depthLevel = "lifted",
  style = {},
  className,
  ...props
}) {
  const depthStyles = {
    flat: { transform: "translateZ(0)" },
    lifted: { transform: "translateZ(20px)", boxShadow: shadows.md },
    elevated: { transform: "translateZ(40px)", boxShadow: shadows.lg },
  };

  return (
    <div
      className={className}
      style={{
        background: colors.floating,
        border: `1px solid ${colors.borderHover}`,
        borderRadius: radii.xl,
        padding: "28px",
        ...depthStyles[depthLevel],
        transition: `transform ${transitions.slow}`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function AmbientBackground({ children, variant = "studio", style = {} }) {
  const gradients = {
    studio: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(232, 168, 56, 0.06), transparent)`,
    raga: `radial-gradient(ellipse 60% 40% at 80% 20%, rgba(199, 125, 186, 0.05), transparent)`,
    teal: `radial-gradient(ellipse 60% 40% at 20% 80%, rgba(91, 168, 160, 0.04), transparent)`,
    combined: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(232, 168, 56, 0.06), transparent), radial-gradient(ellipse 60% 40% at 80% 20%, rgba(199, 125, 186, 0.04), transparent), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(91, 168, 160, 0.03), transparent)`,
    login: `radial-gradient(ellipse 100% 60% at 50% -10%, rgba(232, 168, 56, 0.08), transparent 70%), radial-gradient(ellipse 50% 50% at 80% 60%, rgba(199, 125, 186, 0.05), transparent 70%), radial-gradient(ellipse 40% 40% at 15% 75%, rgba(91, 168, 160, 0.04), transparent 70%)`,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `${gradients[variant]}, ${colors.ink}`,
        position: "relative",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SpatialButton({
  children,
  variant = "primary", // primary | secondary | ghost | instrument
  size = "md", // sm | md | lg
  onClick,
  disabled,
  style = {},
  className,
  ...props
}) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const sizes = {
    sm: { padding: "8px 16px", fontSize: 13 },
    md: { padding: "12px 24px", fontSize: 14 },
    lg: { padding: "16px 32px", fontSize: 16 },
  };

  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${colors.saffron}, ${colors.saffronMuted})`,
      color: colors.ink,
      fontWeight: 600,
      boxShadow: hovered ? "0 4px 20px rgba(232, 168, 56, 0.3)" : "0 2px 12px rgba(232, 168, 56, 0.15)",
    },
    secondary: {
      background: colors.surface,
      color: colors.textPrimary,
      border: `1px solid ${colors.border}`,
      boxShadow: hovered ? shadows.md : "none",
    },
    ghost: {
      background: "transparent",
      color: colors.textSecondary,
    },
    instrument: {
      background: `linear-gradient(180deg, ${colors.elevated}, ${colors.surface})`,
      color: colors.textPrimary,
      border: `1px solid ${colors.borderHover}`,
      boxShadow: pressed
        ? "inset 0 2px 4px rgba(0,0,0,0.3)"
        : "0 4px 12px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)",
    },
  };

  return (
    <button
      className={className}
      style={{
        border: "none",
        borderRadius: radii.md,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: `all ${transitions.base}`,
        fontFamily: typography?.fontSans || "'Inter', sans-serif",
        transform: pressed ? "translateY(1px)" : "translateY(0)",
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      {...props}
    >
      {children}
    </button>
  );
}

export function MusicalProgress({ value = 0, color = "saffron", height = 6, style = {} }) {
  const colorMap = {
    saffron: `linear-gradient(90deg, ${colors.saffronDim}, ${colors.saffron})`,
    teal: `linear-gradient(90deg, ${colors.tealMuted}, ${colors.teal})`,
    raga: `linear-gradient(90deg, ${colors.ragaMuted}, ${colors.raga})`,
    success: `linear-gradient(90deg, #4a9e50, ${colors.success})`,
  };

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        borderRadius: height,
        height,
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          height: "100%",
          background: colorMap[color] || colorMap.saffron,
          borderRadius: height,
          transition: "width 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)",
          boxShadow: value > 0 ? `0 0 8px rgba(232, 168, 56, 0.2)` : "none",
        }}
      />
    </div>
  );
}

export function InstrumentKnob({ value = 0, onChange, label, min = 0, max = 100, size = 48, style = {} }) {
  const angle = ((value - min) / (max - min)) * 270 - 135;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, ...style }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `linear-gradient(180deg, ${colors.elevated}, ${colors.surface})`,
          border: `2px solid ${colors.borderHover}`,
          position: "relative",
          cursor: "pointer",
          boxShadow: `inset 0 2px 4px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 2,
            height: size * 0.35,
            background: colors.saffron,
            borderRadius: 1,
            transformOrigin: "bottom center",
            transform: `translate(-50%, -100%) rotate(${angle}deg)`,
            transition: "transform 0.1s ease-out",
          }}
        />
      </div>
      {label && (
        <span style={{ fontSize: 10, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>
          {label}
        </span>
      )}
    </div>
  );
}

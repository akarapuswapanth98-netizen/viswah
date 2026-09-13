import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useAudioFeedback } from "../hooks/useAudioFeedback";

const COLORS = {
  ink: "#0C0A14",
  surface: "#161222",
  elevated: "#241E38",
  floating: "#2A2344",
  saffron: "#E8A838",
  saffronMuted: "#C4893A",
  raga: "#C77DBA",
  teal: "#5BA8A0",
  text: "#F0EBE3",
  textSecondary: "#A89FB8",
  textMuted: "#6B6080",
  border: "rgba(240, 235, 227, 0.08)",
  borderHover: "rgba(240, 235, 227, 0.15)",
  error: "#D46A6A",
};

// Floating musical notation particles
function FloatingNotes() {
  const notes = ["♩", "♪", "♫", "♬", "𝄞", "𝄢"];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {notes.map((note, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            fontSize: 14 + (i % 3) * 6,
            color: `rgba(232, 168, 56, ${0.06 + (i % 3) * 0.03})`,
            left: `${10 + i * 14}%`,
            top: `${15 + (i * 13) % 60}%`,
            animation: `float ${4 + i * 0.8}s ease-in-out infinite`,
            animationDelay: `${i * 0.7}s`,
            transform: `rotate(${-15 + i * 12}deg)`,
          }}
        >
          {note}
        </span>
      ))}
    </div>
  );
}

// Ambient waveform visualization
function AmbientWaveform() {
  return (
    <div style={{
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 120,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      gap: 3,
      padding: "0 10%",
      pointerEvents: "none",
      zIndex: 0,
      opacity: 0.15,
    }}>
      {Array.from({ length: 40 }, (_, i) => {
        const h = 8 + Math.sin(i * 0.4) * 20 + Math.cos(i * 0.2) * 15;
        return (
          <div
            key={i}
            style={{
              width: 2,
              height: h,
              background: `linear-gradient(to top, ${COLORS.saffron}, transparent)`,
              borderRadius: 1,
              animation: `waveform ${2 + (i % 5) * 0.3}s ease-in-out infinite`,
              animationDelay: `${i * 0.05}s`,
              transformOrigin: "bottom",
            }}
          />
        );
      })}
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const { login, continueAsGuest } = useAuth();
  const { toast } = useToast();
  const { buttonClick } = useAudioFeedback();
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  const validate = () => {
    if (!email) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(email)) return "Enter a valid email";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    buttonClick();
    const v = validate();
    if (v) { setError(v); return; }
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/home");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    buttonClick();
    continueAsGuest();
    navigate("/home");
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: COLORS.ink,
      position: "relative",
      overflow: "hidden",
      padding: "20px",
    }}>
      {/* Ambient lighting layers */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: `
          radial-gradient(ellipse 100% 60% at 50% -10%, rgba(232, 168, 56, 0.07), transparent 70%),
          radial-gradient(ellipse 50% 50% at 80% 60%, rgba(199, 125, 186, 0.04), transparent 70%),
          radial-gradient(ellipse 40% 40% at 15% 75%, rgba(91, 168, 160, 0.03), transparent 70%)
        `,
        zIndex: 0,
      }} />

      <FloatingNotes />
      <AmbientWaveform />

      {/* Studio environment - subtle grid lines */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(232, 168, 56, 0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(232, 168, 56, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        zIndex: 0,
      }} />

      {/* Login panel */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          position: "relative",
          zIndex: 10,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
        }}
      >
        {/* Panel with integrated depth */}
        <div style={{
          background: "rgba(22, 18, 34, 0.85)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: `1px solid rgba(232, 168, 56, 0.1)`,
          borderRadius: 20,
          padding: "44px 36px",
          boxShadow: `
            0 24px 80px rgba(0, 0, 0, 0.5),
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(232, 168, 56, 0.08)
          `,
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Top accent line */}
          <div style={{
            position: "absolute",
            top: 0,
            left: "10%",
            right: "10%",
            height: 1,
            background: `linear-gradient(90deg, transparent, ${COLORS.saffron}40, transparent)`,
          }} />

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: `linear-gradient(135deg, ${COLORS.saffron}20, ${COLORS.raga}15)`,
              border: `1px solid ${COLORS.saffron}25`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: 24,
            }}>
              ♪
            </div>
            <h1 style={{
              fontSize: 32,
              fontWeight: 800,
              margin: "0 0 8px",
              letterSpacing: 3,
            }}>
              <span style={{ color: COLORS.saffron }}>VIS</span>
              <span style={{ color: COLORS.teal }}>WAH</span>
            </h1>
            <p style={{
              color: COLORS.textMuted,
              fontSize: 14,
              letterSpacing: 0.5,
            }}>
              Enter the music studio
            </p>
          </div>

          {error && (
            <div role="alert" style={{
              background: "rgba(212, 106, 106, 0.12)",
              border: `1px solid rgba(212, 106, 106, 0.25)`,
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 20,
              color: COLORS.error,
              fontSize: 13,
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="login-email" style={{
                display: "block",
                color: COLORS.textSecondary,
                fontSize: 12,
                marginBottom: 8,
                fontWeight: 500,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}>Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  padding: "13px 16px",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 10,
                  color: COLORS.text,
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = COLORS.saffron + "60";
                  e.target.style.boxShadow = "0 0 0 3px rgba(232, 168, 56, 0.08)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = COLORS.border;
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div style={{ marginBottom: 24, position: "relative" }}>
              <label htmlFor="login-password" style={{
                display: "block",
                color: COLORS.textSecondary,
                fontSize: 12,
                marginBottom: 8,
                fontWeight: 500,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}>Password</label>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                style={{
                  width: "100%",
                  padding: "13px 44px 13px 16px",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 10,
                  color: COLORS.text,
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = COLORS.saffron + "60";
                  e.target.style.boxShadow = "0 0 0 3px rgba(232, 168, 56, 0.08)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = COLORS.border;
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 12,
                  top: 38,
                  background: "none",
                  border: "none",
                  color: COLORS.textMuted,
                  cursor: "pointer",
                  fontSize: 16,
                  padding: 4,
                }}
              >{showPassword ? "🙈" : "👁"}</button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 0",
                background: loading
                  ? COLORS.saffronMuted
                  : `linear-gradient(135deg, ${COLORS.saffron}, ${COLORS.saffronMuted})`,
                color: COLORS.ink,
                border: "none",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                boxShadow: loading ? "none" : "0 4px 16px rgba(232, 168, 56, 0.2)",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <button
            onClick={handleGuest}
            style={{
              width: "100%",
              padding: "12px 0",
              marginTop: 14,
              background: "transparent",
              color: COLORS.teal,
              border: `1px solid rgba(91, 168, 160, 0.25)`,
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Continue as Guest
          </button>

          <p style={{
            textAlign: "center",
            marginTop: 24,
            color: COLORS.textMuted,
            fontSize: 13,
          }}>
            Don&apos;t have an account?{" "}
            <Link to="/register" style={{
              color: COLORS.saffron,
              textDecoration: "none",
              fontWeight: 500,
            }}>Sign up</Link>
          </p>
        </div>

        {/* Bottom ambient glow */}
        <div style={{
          position: "absolute",
          bottom: -20,
          left: "20%",
          right: "20%",
          height: 40,
          background: `radial-gradient(ellipse, rgba(232, 168, 56, 0.1), transparent)`,
          filter: "blur(20px)",
          pointerEvents: "none",
        }} />
      </div>
    </div>
  );
}

import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { useAudioFeedback } from '../hooks/useAudioFeedback';

const C = {
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
  textMuted: "#8075A0",
  border: "rgba(240, 235, 227, 0.06)",
  borderHover: "rgba(240, 235, 227, 0.12)",
  borderActive: "rgba(232, 168, 56, 0.2)",
};

const navItems = [
  { to: '/home', label: 'Home', icon: '🏠' },
  { to: '/practice', label: 'Practice Studio', icon: '🎵' },
  { to: '/courses', label: 'Courses', icon: '📚' },
  { to: '/profile', label: 'Profile', icon: '👤' },
  { to: '/progress', label: 'Progress', icon: '🏆' },
  { to: '/gamification', label: 'Gamification', icon: '🎮' },
  { to: '/community', label: 'Community', icon: '🌍' },
];

const musicTools = [
  { to: '/vocal-guru', label: 'Vocal Guru', icon: '🎤', accent: C.saffron },
  { to: '/speech-analysis', label: 'Speech Analysis', icon: '🗣', accent: C.teal },
  { to: '/lyrics', label: 'Lyrics', icon: '✍', accent: C.raga },
  { to: '/metronome', label: 'Metronome', icon: '⏱', accent: C.saffronMuted },
  { to: '/piano', label: 'Piano', icon: '🎹', accent: C.teal },
  { to: '/drums', label: 'Drums', icon: '🥁', accent: C.raga },
];

const indianMusic = [
  { to: '/ragas', label: 'Ragas', icon: '🎵', accent: C.saffron },
  { to: '/talas', label: 'Talas', icon: '🪘', accent: C.raga },
  { to: '/sargam', label: 'Sargam', icon: '🎼', accent: C.teal },
];

const worldMusicItems = [
  { to: '/world-music', label: 'World Music', icon: '🌍', accent: C.teal },
  { to: '/world-music/compare', label: 'Compare', icon: '⚖', accent: C.teal },
];

const musicLabItems = [
  { to: '/music-lab/notes', label: 'Note Recognition', icon: '👂', accent: C.saffron },
  { to: '/music-lab/intervals', label: 'Intervals', icon: '🎵', accent: C.teal },
  { to: '/music-lab/rhythm', label: 'Rhythm', icon: '🥁', accent: C.raga },
  { to: '/music-lab/melody', label: 'Melody', icon: '🎼', accent: C.saffron },
  { to: '/music-lab/memory', label: 'Memory', icon: '🧠', accent: C.raga },
  { to: '/music-lab/world', label: 'World Listening', icon: '🌍', accent: C.teal },
];

const aiItems = [
  { to: '/ai-coach', label: 'AI Coach', icon: '🎯', accent: C.saffron },
  { to: '/ai-lessons', label: 'AI Lessons', icon: '🤖', accent: C.saffron },
];

const accountItems = [
  { to: '/pricing', label: 'Pricing', icon: '💎', accent: C.saffron },
  { to: '/subscription', label: 'Subscription', icon: '⭐', accent: C.teal },
];

function NavLinkItem({ item, onClose }) {
  const [hovered, setHovered] = useState(false);
  const { navChime } = useAudioFeedback();

  return (
    <NavLink
      to={item.to}
      onClick={(e) => { navChime(); onClose?.(e); }}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 10,
        textDecoration: "none",
        color: isActive ? C.text : C.textSecondary,
        fontSize: 14,
        fontWeight: isActive ? 600 : 500,
        transition: "all 0.2s ease-out",
        marginBottom: 2,
        background: isActive
          ? `linear-gradient(135deg, rgba(232, 168, 56, 0.1), rgba(232, 168, 56, 0.04))`
          : hovered
            ? "rgba(255,255,255,0.04)"
            : "transparent",
        border: isActive
          ? `1px solid ${C.borderActive}`
          : "1px solid transparent",
        boxShadow: isActive
          ? "inset 0 1px 0 rgba(232, 168, 56, 0.08), 0 2px 8px rgba(0,0,0,0.15)"
          : "none",
        transform: hovered && !isActive ? "translateX(2px)" : "translateX(0)",
      })}
      end={item.to === '/'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{
        fontSize: 17,
        width: 24,
        textAlign: "center",
        flexShrink: 0,
        filter: hovered ? "brightness(1.2)" : "none",
        transition: "filter 0.2s",
      }}>{item.icon}</span>
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAuthenticated, isGuest } = useAuth();
  const [planName, setPlanName] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      import('../api/subscriptionApi').then(({ default: api }) => {
        api.getSubscription().then((sub) => {
          setPlanName(sub.plan_name || sub.plan_id);
        }).catch(() => {});
      });
    }
  }, [isAuthenticated]);

  return (
    <>
      <aside aria-label="Main navigation" style={{
        width: 260,
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(180deg, rgba(12, 10, 20, 0.97), rgba(22, 18, 34, 0.97))`,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: `1px solid ${C.border}`,
        zIndex: 100,
        overflowY: "auto",
        overflowX: "hidden",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        scrollbarWidth: "thin",
        scrollbarColor: `${C.borderHover} transparent`,
      }}>
        {/* Ambient top glow */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 120,
          background: "radial-gradient(ellipse 120% 100% at 50% -20%, rgba(232, 168, 56, 0.06), transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }} />

        {/* Logo */}
        <div style={{
          padding: "24px 20px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "relative",
          zIndex: 1,
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${C.saffron}20, ${C.raga}15)`,
            border: `1px solid ${C.saffron}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            boxShadow: `0 0 16px rgba(232, 168, 56, 0.08)`,
          }}>♪</div>
          <span style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: 2,
          }}>
            <span style={{ color: C.saffron }}>VIS</span>
            <span style={{ color: C.teal }}>WAH</span>
          </span>
        </div>

        {/* Nav */}
        <nav aria-label="Sidebar navigation" style={{ flex: 1, position: "relative", zIndex: 1 }}>
          {/* Main nav */}
          <div style={{ padding: "16px 12px 8px" }}>
            {navItems.map((item) => (
              <NavLinkItem key={item.to} item={item} onClose={onClose} />
            ))}
          </div>

          <div style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${C.borderHover}, transparent)`,
            margin: "4px 20px",
          }} />

          {/* Music Tools */}
          <div style={{ padding: "12px 12px 8px" }}>
            <h3 style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              color: C.textMuted,
              padding: "0 12px",
              marginBottom: 8,
              margin: 0,
            }}>Music Tools</h3>
            {musicTools.map((item) => (
              <NavLinkItem key={item.to} item={item} onClose={onClose} />
            ))}
          </div>

          <div style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${C.borderHover}, transparent)`,
            margin: "4px 20px",
          }} />

          {/* Indian Music */}
          <div style={{ padding: "12px 12px 8px" }}>
            <h3 style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              color: C.textMuted,
              padding: "0 12px",
              marginBottom: 8,
              margin: 0,
            }}>Indian Classical</h3>
            {indianMusic.map((item) => (
              <NavLinkItem key={item.to} item={item} onClose={onClose} />
            ))}
          </div>

          <div style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${C.borderHover}, transparent)`,
            margin: "4px 20px",
          }} />

          {/* World Music */}
          <div style={{ padding: "12px 12px 8px" }}>
            <h3 style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              color: C.textMuted,
              padding: "0 12px",
              marginBottom: 8,
              margin: 0,
            }}>Explore</h3>
            {worldMusicItems.map((item) => (
              <NavLinkItem key={item.to} item={item} onClose={onClose} />
            ))}
          </div>

          <div style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${C.borderHover}, transparent)`,
            margin: "4px 20px",
          }} />

          {/* Music Lab */}
          <div style={{ padding: "12px 12px 8px" }}>
            <h3 style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              color: C.textMuted,
              padding: "0 12px",
              marginBottom: 8,
              margin: 0,
            }}>Music Lab</h3>
            {musicLabItems.map((item) => (
              <NavLinkItem key={item.to} item={item} onClose={onClose} />
            ))}
          </div>

          <div style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${C.borderHover}, transparent)`,
            margin: "4px 20px",
          }} />

          {/* AI */}
          <div style={{ padding: "12px 12px 8px" }}>
            <h3 style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              color: C.textMuted,
              padding: "0 12px",
              marginBottom: 8,
              margin: 0,
            }}>AI</h3>
            {aiItems.map((item) => (
              <NavLinkItem key={item.to} item={item} onClose={onClose} />
            ))}
          </div>

          <div style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${C.borderHover}, transparent)`,
            margin: "4px 20px",
          }} />

          {/* Account */}
          <div style={{ padding: "12px 12px 8px" }}>
            <h3 style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              color: C.textMuted,
              padding: "0 12px",
              marginBottom: 8,
              margin: 0,
            }}>Account</h3>
            {accountItems.map((item) => (
              <NavLinkItem key={item.to} item={item} onClose={onClose} />
            ))}
          </div>
        </nav>

        {/* User section */}
        {isAuthenticated && user && (
          <Link to="/profile" style={{
            marginTop: "auto",
            padding: "16px 20px",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            textDecoration: "none",
            transition: "background 0.2s",
            position: "relative",
            zIndex: 1,
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.saffron}30, ${C.raga}20)`,
              border: `1px solid ${C.saffron}25`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.text,
              fontSize: 14,
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div style={{
                color: C.text,
                fontSize: 14,
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>{user.username}</div>
              <div style={{ color: C.textMuted, fontSize: 12 }}>{planName || "Member"}</div>
            </div>
          </Link>
        )}

        {isGuest && (
          <Link to="/login" style={{
            marginTop: "auto",
            padding: "16px 20px",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            textDecoration: "none",
            position: "relative",
            zIndex: 1,
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: `${C.teal}15`,
              border: `1px solid ${C.teal}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.textMuted,
              fontSize: 14,
              fontWeight: 700,
              flexShrink: 0,
            }}>?</div>
            <div>
              <div style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>Guest User</div>
              <div style={{ color: C.textMuted, fontSize: 12 }}>Sign in to track progress</div>
            </div>
          </Link>
        )}
      </aside>
    </>
  );
}

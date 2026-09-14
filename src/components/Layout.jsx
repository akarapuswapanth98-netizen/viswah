import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Toast from './ui/Toast';
import { useToast } from '../context/ToastContext';

const layoutStyle = {
  display: 'flex',
  minHeight: '100vh',
  background: '#0F0F23',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  overflowX: 'hidden',
};

const sidebarDesktopStyle = {
  width: '260px',
  flexShrink: 0,
};

const mainContentStyle = {
  flex: 1,
  minHeight: '100vh',
  overflow: 'auto',
  minWidth: 0,
};

const headerStyle = {
  display: 'none',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  background: 'linear-gradient(180deg, rgba(15,15,35,0.98), rgba(15,15,35,0.95))',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderBottom: '1px solid rgba(255,255,255,0.12)',
  position: 'sticky',
  top: 0,
  zIndex: 50,
};

const hamburgerStyle = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '8px',
  padding: '8px 10px',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  alignItems: 'center',
  justifyContent: 'center',
};

const hamburgerLineStyle = {
  width: '20px',
  height: '2px',
  background: '#FFFFFF',
  borderRadius: '1px',
  transition: 'all 0.2s ease',
};

const logoMobileStyle = {
  fontSize: '18px',
  fontWeight: 800,
  background: 'linear-gradient(135deg, #6C63FF, #00FF88)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  letterSpacing: '2px',
};

const mobileSidebarStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '260px',
  height: '100vh',
  zIndex: 200,
  transform: 'translateX(-100%)',
  transition: 'transform 0.3s ease',
};

const mobileSidebarOpenStyle = {
  ...mobileSidebarStyle,
  transform: 'translateX(0)',
};

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.6)',
  zIndex: 199,
  opacity: 0,
  pointerEvents: 'none',
  transition: 'opacity 0.3s ease',
};

const overlayOpenStyle = {
  ...overlayStyle,
  opacity: 1,
  pointerEvents: 'auto',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toasts, removeToast } = useToast();

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e) => {
        if (e.key === 'Escape') setSidebarOpen(false);
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [sidebarOpen]);

  return (
    <div style={layoutStyle}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .layout-main-content {
          margin-left: 260px;
        }
        @media (max-width: 768px) {
          .layout-sidebar-desktop { display: none !important; }
          .layout-main-content { margin-left: 0 !important; }
          .layout-mobile-header { display: flex !important; }
        }
        .skip-link {
          position: absolute;
          top: -100px;
          left: 0;
          background: #E8A838;
          color: #0C0A14;
          padding: 12px 24px;
          z-index: 9999;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          border-radius: 0 0 8px 0;
          transition: top 0.2s;
        }
        .skip-link:focus {
          top: 0;
        }
      `}</style>

      <a href="#main-content" className="skip-link">Skip to main content</a>

      <div className="layout-sidebar-desktop" style={sidebarDesktopStyle}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div
        className="layout-mobile-header"
        style={headerStyle}
      >
        <button
          style={hamburgerStyle}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle navigation menu"
        >
          <span style={hamburgerLineStyle} />
          <span style={hamburgerLineStyle} />
          <span style={hamburgerLineStyle} />
        </button>
        <span style={logoMobileStyle}>VISWAH</span>
        <div style={{ width: '36px' }} />
      </div>

      <div
        style={sidebarOpen ? mobileSidebarOpenStyle : mobileSidebarStyle}
        className="layout-mobile-sidebar"
      >
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div
        style={sidebarOpen ? overlayOpenStyle : overlayStyle}
        onClick={() => setSidebarOpen(false)}
        className="layout-overlay"
      />

      <main id="main-content" style={mainContentStyle} className="layout-main-content">
        <Outlet />
      </main>

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

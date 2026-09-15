import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Toast from './ui/Toast';
import { useToast } from '../context/ToastContext';
import C from './ui/colors';

const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= MOBILE_BREAKPOINT : false
  );
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener('resize', check);
    check();
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

const layoutStyle = {
  display: 'flex',
  minHeight: '100vh',
  background: C.ink,
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  overflowX: 'hidden',
};

const hamburgerStyle = {
  background: C.surfaceTint,
  border: `1px solid ${C.glassBorder}`,
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
  background: C.text,
  borderRadius: '1px',
  transition: 'all 0.2s ease',
};

const logoMobileStyle = {
  fontSize: '18px',
  fontWeight: 800,
  background: `linear-gradient(135deg, ${C.primary}, ${C.teal})`,
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
  const isMobile = useIsMobile();

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

  useEffect(() => {
    if (!isMobile && sidebarOpen) setSidebarOpen(false);
  }, [isMobile, sidebarOpen]);

  const sidebarDesktopStyle = isMobile
    ? { display: 'none' }
    : { width: '260px', flexShrink: 0 };

  const mainContentStyle = {
    flex: 1,
    minHeight: '100vh',
    overflow: 'auto',
    minWidth: 0,
    marginLeft: isMobile ? 0 : 260,
  };

  const headerStyle = {
    display: isMobile ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    background: `linear-gradient(180deg, ${C.ink}f8, ${C.ink}f0)`,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: `1px solid ${C.glassBorder}`,
    position: 'sticky',
    top: 0,
    zIndex: 50,
  };

  return (
    <div style={layoutStyle}>
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

import { useEffect, useState } from 'react';

const colors = {
  primary: '#6C63FF',
  secondary: '#4ECDC4',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  background: '#0F0F23',
  glassBorder: 'rgba(255,255,255,0.12)',
  text: '#FFFFFF',
  mutedText: '#6B6B8D',
};

const toastKeyframes = `
@keyframes toast-slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes toast-slide-out {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}
@keyframes toast-progress {
  from { width: 100%; }
  to { width: 0%; }
}
`;

const iconMap = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  const style = document.createElement('style');
  style.textContent = toastKeyframes;
  document.head.appendChild(style);
  stylesInjected = true;
}

function ToastItem({ toast, onRemove }) {
  const { id, type = 'info', message, duration = 5000, onClose } = toast;
  const [isRemoving, setIsRemoving] = useState(false);

  const typeColors = {
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.primary,
  };

  const accentColor = typeColors[type] || typeColors.info;

  const handleClose = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove?.(id);
      onClose?.();
    }, 300);
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(15, 15, 35, 0.98), rgba(20, 20, 45, 0.98))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${colors.glassBorder}`,
        borderLeft: `4px solid ${accentColor}`,
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        animation: isRemoving
          ? 'toast-slide-out 0.3s ease-in forwards'
          : 'toast-slide-in 0.3s ease-out',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        overflow: 'hidden',
      }}
      role="alert"
      aria-live="assertive"
    >
      <div style={{
        width: '24px', height: '24px', borderRadius: '50%',
        background: `${accentColor}20`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: accentColor, fontSize: '14px',
        fontWeight: 700, flexShrink: 0,
      }} aria-hidden="true">
        {iconMap[type] || iconMap.info}
      </div>
      <div style={{
        color: colors.text, fontSize: '14px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        lineHeight: 1.5, flex: 1,
      }}>{message}</div>
      <button
        style={{
          background: 'transparent', border: 'none', color: colors.mutedText,
          cursor: 'pointer', padding: '4px', fontSize: '16px', lineHeight: 1, flexShrink: 0,
        }}
        onClick={handleClose}
        aria-label="Dismiss notification"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClose();
          }
        }}
      >
        ×
      </button>
      {duration > 0 && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, height: '2px',
          background: accentColor,
          animation: `toast-progress ${duration}ms linear forwards`,
          width: '100%',
        }} />
      )}
    </div>
  );
}

function ToastContainer({ toasts, onRemove }) {
  useEffect(() => {
    injectStyles();
  }, []);

  return (
    <div style={{
      position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: '12px',
      maxWidth: '400px', width: 'calc(100% - 40px)',
    }} aria-live="polite" aria-label="Notifications">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

function Toast({ toasts, onRemove }) {
  return <ToastContainer toasts={toasts} onRemove={onRemove} />;
}

export default Toast;

import { useEffect, useRef, useCallback } from 'react';
import Button from './Button';

const colors = {
  primary: '#6C63FF',
  secondary: '#4ECDC4',
  error: '#FF3B30',
  warning: '#FF9500',
  text: '#FFFFFF',
  mutedText: '#6B6B8D',
  glassBorder: 'rgba(255,255,255,0.12)',
};

const dialogKeyframes = `
@keyframes dialog-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes dialog-scale-in {
  from { opacity: 0; transform: scale(0.9) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
`;

let dialogStylesInjected = false;
function injectDialogStyles() {
  if (dialogStylesInjected) return;
  const style = document.createElement('style');
  style.textContent = dialogKeyframes;
  document.head.appendChild(style);
  dialogStylesInjected = true;
}

function getFocusable(container) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
}

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  icon,
  className = '',
  style = {},
  ...props
}) {
  const dialogRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    injectDialogStyles();
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && !loading) {
      (onCancel || onClose)?.();
      return;
    }
    if (e.key === 'Tab' && dialogRef.current) {
      const focusable = getFocusable(dialogRef.current);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }, [loading, onCancel, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    const timer = setTimeout(() => dialogRef.current?.focus(), 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleCancel = () => {
    if (!loading) {
      (onCancel || onClose)?.();
    }
  };

  const handleConfirm = () => {
    if (!loading) {
      onConfirm?.();
    }
  };

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 10000, animation: 'dialog-fade-in 0.2s ease-out',
        padding: '20px',
      }}
      onClick={handleCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div
        ref={dialogRef}
        style={{
          background: 'linear-gradient(135deg, rgba(15, 15, 35, 0.98), rgba(20, 20, 45, 0.98))',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${colors.glassBorder}`, borderRadius: '20px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          animation: 'dialog-scale-in 0.3s ease-out', outline: 'none',
          maxWidth: '420px', width: '90%', ...style,
        }}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        {...props}
      >
        <div style={{ padding: '32px', textAlign: 'center' }}>
          {icon && (
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: variant === 'danger' ? `${colors.error}15` : variant === 'warning' ? `${colors.warning}15` : `${colors.primary}15`,
              border: `1px solid ${variant === 'danger' ? `${colors.error}30` : variant === 'warning' ? `${colors.warning}30` : `${colors.primary}30`}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: '28px',
              color: variant === 'danger' ? colors.error : variant === 'warning' ? colors.warning : colors.primary,
            }} aria-hidden="true">
              {icon}
            </div>
          )}
          <h2 id="confirm-dialog-title" style={{
            margin: 0, marginBottom: '12px', fontSize: '18px', fontWeight: 700,
            color: colors.text,
          }}>{title}</h2>
          <p id="confirm-dialog-message" style={{
            margin: 0, fontSize: '14px', color: colors.mutedText, lineHeight: 1.6,
          }}>{message}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
            <Button variant="secondary" onClick={handleCancel} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button variant={variant === 'danger' ? 'danger' : variant} onClick={handleConfirm} loading={loading}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;

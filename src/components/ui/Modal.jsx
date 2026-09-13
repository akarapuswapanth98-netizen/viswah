import { useEffect, useRef, useCallback } from 'react';

const colors = {
  surface: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.12)',
  text: '#FFFFFF',
  secondaryText: '#B0B0CC',
};

let modalStylesInjected = false;
function injectModalStyles() {
  if (modalStylesInjected) return;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes modal-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes modal-slide-in { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
  `;
  document.head.appendChild(style);
  modalStylesInjected = true;
}

function getFocusable(container) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
}

function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlay = true,
  closeOnEscape = true,
  className = '',
  style = {},
  ...props
}) {
  injectModalStyles();

  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  const sizes = {
    sm: { maxWidth: '400px', width: '90%' },
    md: { maxWidth: '560px', width: '90%' },
    lg: { maxWidth: '720px', width: '95%' },
    xl: { maxWidth: '900px', width: '95%' },
  };

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && closeOnEscape && isOpen) {
      onClose?.();
      return;
    }
    if (e.key === 'Tab' && isOpen && modalRef.current) {
      const focusable = getFocusable(modalRef.current);
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
  }, [closeOnEscape, isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      modalRef.current?.focus();
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'modal-fade-in 0.2s ease-out', padding: '20px' }}
      onClick={closeOnOverlay ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabIndex={-1}
    >
      <div
        ref={modalRef}
        style={{ background: 'linear-gradient(135deg, rgba(15, 15, 35, 0.98), rgba(20, 20, 45, 0.98))', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${colors.glassBorder}`, borderRadius: '20px', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)', animation: 'modal-slide-in 0.3s ease-out', outline: 'none', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', ...sizes[size], ...style }}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${colors.glassBorder}`, flexShrink: 0 }}>
          {title && <h2 id="modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: colors.text }}>{title}</h2>}
          {showCloseButton && (
            <button
              style={{ background: colors.surface, border: `1px solid ${colors.glassBorder}`, borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: colors.text, fontSize: '18px', transition: 'all 0.2s ease', flexShrink: 0 }}
              onClick={onClose}
              aria-label="Close modal"
            >
              ✕
            </button>
          )}
        </div>
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, color: colors.secondaryText, fontSize: '14px', lineHeight: 1.6 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;

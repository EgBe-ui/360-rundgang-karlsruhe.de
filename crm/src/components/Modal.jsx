import { useEffect, useCallback } from 'preact/hooks';

export function Modal({ title, onClose, children, footer, className }) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div class="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div class={`modal${className ? ' ' + className : ''}`} role="dialog" aria-modal="true">
        <div class="modal-header">
          <span>{title}</span>
          <button class="btn-icon" onClick={onClose} aria-label="Schliessen">✕</button>
        </div>
        <div class="modal-body">{children}</div>
        {footer && <div class="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

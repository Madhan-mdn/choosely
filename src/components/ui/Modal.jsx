import React, { useEffect, useRef } from 'react';
import { Icon } from './Icon';

/**
 * Accessible Modal dialog with Escape key handling, safe backdrop click dismissal,
 * optional footer slot, and Studio Animations support.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer = null,
  maxWidth = 'max-w-md',
  headerBadge = null,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (onClose) onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const focusable = dialogRef.current.querySelector(
        'input, select, textarea, button:not([data-modal-close])'
      );
      if (focusable) {
        focusable.focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const animationsDisabled =
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-animations') === 'false';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-dialog-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidth} mx-auto my-auto max-h-[90vh] overflow-y-auto ${
          animationsDisabled ? '' : 'animate-modal-rise'
        } bg-surface-container-lowest text-on-surface rounded-xl hairline-border shadow-xl p-5 flex flex-col space-y-4`}
      >
        <div className="flex items-center justify-between pb-3 hairline-b">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-container"></span>
            <h2
              id="modal-dialog-title"
              className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight"
            >
              {title}
            </h2>
            {headerBadge}
          </div>
          <button
            type="button"
            data-modal-close="true"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-md text-secondary hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="text-on-surface">{children}</div>

        {footer && (
          <div className="pt-3 hairline-t flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;

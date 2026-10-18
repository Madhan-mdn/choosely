import React from 'react';
import { Icon } from './Icon';

/**
 * Floating Toast notification for immediate user feedback.
 */
export function Toast({ toast, onDismiss }) {
  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-[70] max-w-sm animate-modal-rise"
    >
      <div
        className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 hairline-border ${
          isError
            ? 'bg-error-container text-on-error-container border-error/40'
            : 'bg-surface-container-lowest text-on-surface'
        }`}
      >
        <span
          className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
            isError
              ? 'bg-error text-on-error'
              : 'bg-primary-container text-on-primary'
          }`}
        >
          <Icon name={isError ? 'warning' : 'check_circle'} size={15} />
        </span>
        <span className="font-label-md text-label-md font-medium flex-1">
          {toast.message}
        </span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="p-1 rounded text-secondary hover:text-on-surface transition-colors cursor-pointer"
        >
          <Icon name="close" size={14} />
        </button>
      </div>
    </div>
  );
}

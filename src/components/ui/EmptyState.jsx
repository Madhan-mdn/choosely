import React from 'react';
import { Icon } from './Icon';
import { Button } from './Button';

/**
 * Reusable EmptyState component for empty categories, options, history, or favorites.
 */
export function EmptyState({
  icon = 'info',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div
      className={`p-8 bg-surface-container-lowest rounded-xl hairline-border flex flex-col items-center justify-center text-center space-y-3 ${className}`}
    >
      <div className="w-10 h-10 rounded-lg bg-surface-container-low hairline-border flex items-center justify-center text-primary-container">
        <Icon name={icon} size={20} />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
          {title}
        </h3>
        {description && (
          <p className="font-body-sm text-body-sm text-secondary leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actionLabel && onAction && (
        <div className="pt-1">
          <Button variant="primary" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

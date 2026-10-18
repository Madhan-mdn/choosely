import React from 'react';
import { Icon } from './Icon';

/**
 * Reusable Button component supporting primary, secondary, subtle, ghost, and danger variants.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon = null,
  className = '',
  type = 'button',
  disabled = false,
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-label-md text-label-md rounded-lg transition-all duration-150 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-container focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none';

  const variantClasses = {
    primary:
      'bg-primary-container text-on-primary font-semibold hover:bg-primary-hover shadow-sm',
    secondary:
      'bg-surface-container-lowest text-on-surface hairline-border hover:bg-surface-container-low font-medium',
    subtle:
      'bg-surface-container text-primary hover:bg-surface-container-high font-semibold',
    ghost:
      'bg-transparent text-secondary hover:bg-surface-container hover:text-on-surface font-medium',
    danger:
      'bg-surface-container-lowest border border-error/45 text-error hover:bg-error-container/30 font-semibold',
    dangerSolid:
      'bg-error text-on-error hover:opacity-90 font-semibold shadow-sm',
  };

  const sizeClasses = {
    sm: 'h-[32px] px-2.5 text-label-sm',
    md: 'h-[38px] px-3.5 text-label-md',
    lg: 'h-[44px] px-5 text-headline-sm font-semibold',
  };

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
      {...props}
    >
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
    </button>
  );
}

export default Button;

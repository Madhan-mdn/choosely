import React from 'react';
import { Icon } from './Icon';

/**
 * Accessible Select dropdown component with optional primary and secondary labels.
 */
export function Select({
  id,
  label,
  rightLabel,
  value,
  onChange,
  options = [],
  placeholder,
  className = '',
  selectClassName = '',
  disabled = false,
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {(label || rightLabel) && (
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={id}
              className="font-label-md text-label-md text-on-surface font-medium"
            >
              {label}
            </label>
          )}
          {rightLabel && (
            <span className="font-label-sm text-label-sm text-secondary">
              {rightLabel}
            </span>
          )}
        </div>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full h-[38px] px-3 pr-9 bg-surface-container-lowest hairline-border rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors appearance-none cursor-pointer disabled:opacity-50 ${selectClassName}`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-secondary">
          <Icon name="expand_more" size={16} />
        </div>
      </div>
    </div>
  );
}

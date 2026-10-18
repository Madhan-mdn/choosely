import React from 'react';
import { Icon } from '../ui/Icon';
import { DECISION_MODES, normalizeModeKey } from '../../utils/decisionAlgorithms';

const METHOD_LIST = [
  DECISION_MODES.random,
  DECISION_MODES.weighted,
  DECISION_MODES.spin,
  DECISION_MODES.elimination,
];

export function DecisionMethodSelector({
  value = 'random',
  onChange,
  showHelper = true,
  label = 'Method Algorithm',
}) {
  const activeKey = normalizeModeKey(value);
  const activeMeta = DECISION_MODES[activeKey] || DECISION_MODES.random;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">
          {label}
        </span>
        <span className="font-label-sm text-label-sm text-primary flex items-center gap-1">
          <Icon name="info" size={13} />
          <span>{activeMeta.badge}</span>
        </span>
      </div>

      {/* 2x2 Segmented Control Grid */}
      <div
        role="radiogroup"
        aria-label={label}
        className="grid grid-cols-2 gap-1.5 p-1 bg-surface-container-low rounded-lg hairline-border"
      >
        {METHOD_LIST.map((method) => {
          const isSelected = activeKey === method.id;
          return (
            <button
              key={method.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(method.id)}
              className={`py-2 px-2.5 rounded-md text-center font-label-md text-label-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'font-semibold bg-surface-container-lowest text-primary shadow-sm hairline-border'
                  : 'text-secondary hover:text-on-surface font-medium'
              }`}
            >
              <Icon
                name={method.icon}
                size={15}
                className={isSelected ? 'text-primary' : 'text-secondary'}
              />
              <span className="truncate">{method.label}</span>
            </button>
          );
        })}
      </div>

      {showHelper && (
        <div className="flex items-start gap-2 px-3 py-2 bg-surface-container-lowest rounded-lg hairline-border text-on-surface-variant font-body-sm text-body-sm">
          <Icon
            name="insights"
            size={15}
            className="text-primary-container mt-0.5 shrink-0"
          />
          <span>
            <strong className="font-semibold text-on-surface">
              {activeMeta.label}:
            </strong>{' '}
            {activeMeta.description}
          </span>
        </div>
      )}
    </div>
  );
}

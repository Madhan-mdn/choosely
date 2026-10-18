import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Icon } from '../ui/Icon';
import {
  calculateWheelRotationForWinner,
  calculateOptionPercentage,
} from '../../utils/decisionAlgorithms';
import { useAppState } from '../../context/AppStateContext';

/**
 * Light & Dark wheel segment color palettes:
 * Forest greens, sage, warm slate, and charcoal surfaces.
 */
const LIGHT_WHEEL_PALETTE = [
  { bg: '#1B4D3E', text: '#FFFFFF' }, // Forest Pine
  { bg: '#E8ECE9', text: '#191C1E' }, // Sandstone
  { bg: '#376757', text: '#FFFFFF' }, // Deep Sage
  { bg: '#D6DFDB', text: '#191C1E' }, // Muted Sage
  { bg: '#2E3935', text: '#EDEFE9' }, // Charcoal Forest
  { bg: '#E3E6DF', text: '#191C1E' }, // Olive Sandstone
  { bg: '#8ABDA9', text: '#002117' }, // Soft Mint Pine
  { bg: '#C9D4CE', text: '#191C1E' }, // Slate Cream
];

const DARK_WHEEL_PALETTE = [
  { bg: '#286B52', text: '#F0F3F1' }, // Forest Accent
  { bg: '#262F2B', text: '#F0F3F1' }, // Elevated Charcoal
  { bg: '#1E523F', text: '#E2F1EB' }, // Deep Pine
  { bg: '#2E3934', text: '#D5DFDA' }, // Slate Sage
  { bg: '#347F63', text: '#FFFFFF' }, // Emerald Sage
  { bg: '#202825', text: '#C4D0CA' }, // Deep Slate
  { bg: '#3B5249', text: '#F0F3F1' }, // Muted Forest
  { bg: '#2B3631', text: '#DCE5E0' }, // Charcoal Mist
];

/**
 * High-DPI Canvas SpinWheel component.
 * Pre-determines or accepts a target `winner` and rotates smoothly so the
 * winning slice stops directly under the 12 o'clock pointer.
 */
export function SpinWheel({
  options = [],
  preselectedWinner = null,
  autoStart = false,
  shouldAnimate = true,
  onSpinComplete,
  onRequestSpin,
  size = 330,
  showTelemetry = true,
}) {
  const { isDark, showToast } = useAppState();
  const canvasRef = useRef(null);
  const rotationRef = useRef(0);
  const animFrameRef = useRef(null);
  const onSpinCompleteRef = useRef(onSpinComplete);
  const onRequestSpinRef = useRef(onRequestSpin);

  useEffect(() => {
    onSpinCompleteRef.current = onSpinComplete;
    onRequestSpinRef.current = onRequestSpin;
  }, [onSpinComplete, onRequestSpin]);

  const [isSpinning, setIsSpinning] = useState(false);
  const [rpm, setRpm] = useState(0);
  const [currentWinner, setCurrentWinner] = useState(preselectedWinner);

  // Draw the wheel on the HTML5 Canvas at `angleDeg` clockwise rotation
  const drawWheelAtAngle = useCallback(
    (angleDeg) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const displaySize = size;
      if (
        canvas.width !== displaySize * dpr ||
        canvas.height !== displaySize * dpr
      ) {
        canvas.width = displaySize * dpr;
        canvas.height = displaySize * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, displaySize, displaySize);

      const centerX = displaySize / 2;
      const centerY = displaySize / 2;
      const radius = displaySize / 2 - 8;

      if (!options || options.length === 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#262F2B' : '#ECEEF0';
        ctx.fill();
        ctx.strokeStyle = isDark ? '#35413B' : '#C0C9C3';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = isDark ? '#A8B2AD' : '#595F63';
        ctx.font = '600 13px Manrope, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Add options to spin', centerX, centerY);
        ctx.restore();
        return;
      }

      const numSegments = options.length;
      const segRad = (Math.PI * 2) / numSegments;
      // Start at 12 o'clock (-Math.PI / 2) plus current clockwise rotation in radians
      const baseAngleRad = -Math.PI / 2 + (angleDeg * Math.PI) / 180;
      const activePalette = isDark
        ? DARK_WHEEL_PALETTE
        : LIGHT_WHEEL_PALETTE;

      for (let i = 0; i < numSegments; i++) {
        const startAngle = baseAngleRad + i * segRad;
        const endAngle = startAngle + segRad;
        const palette = activePalette[i % activePalette.length];

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = palette.bg;
        ctx.fill();

        ctx.strokeStyle = isDark ? '#141816' : '#FFFFFF';
        ctx.lineWidth = 1.75;
        ctx.stroke();

        // Draw radial option label
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + segRad / 2);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = palette.text;
        ctx.font = '600 12px Manrope, sans-serif';

        const pct = calculateOptionPercentage(options[i], options);
        let rawLabel = options[i].name || '';
        if (rawLabel.length > 15) {
          rawLabel = `${rawLabel.substring(0, 13)}…`;
        }
        const labelWithPct =
          numSegments <= 8 ? `${rawLabel} (${pct}%)` : rawLabel;

        ctx.fillText(labelWithPct, radius - 16, 0);
        ctx.restore();
      }

      // Crisp outer architectural ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = isDark ? '#35413B' : '#C0C9C3';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    },
    [options, size, isDark]
  );

  // Redraw whenever options, size, or theme changes
  useEffect(() => {
    drawWheelAtAngle(rotationRef.current);
  }, [drawWheelAtAngle]);

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const spinToWinner = useCallback(
    (winnerObj, instant = false) => {
      if (!options || options.length === 0) return;
      if (isSpinning) return;

      const targetWinner =
        winnerObj || options[Math.floor(Math.random() * options.length)];
      const winnerIdx = Math.max(
        0,
        options.findIndex((o) => o.id === targetWinner.id)
      );

      setCurrentWinner(targetWinner);

      const startAngle = rotationRef.current;
      const targetAngle = calculateWheelRotationForWinner(
        startAngle,
        winnerIdx,
        options.length
      );

      if (!shouldAnimate || instant) {
        rotationRef.current = targetAngle;
        drawWheelAtAngle(targetAngle);
        setRpm(0);
        setIsSpinning(false);
        if (onSpinCompleteRef.current) {
          onSpinCompleteRef.current(targetWinner);
        }
        return;
      }

      setIsSpinning(true);
      const durationMs = 3000;
      const startTime = performance.now();

      const animateStep = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        // Cubic ease-out curve for realistic mechanical wheel deceleration
        const eased = 1 - Math.pow(1 - progress, 3.6);
        const currentDeg = startAngle + (targetAngle - startAngle) * eased;

        rotationRef.current = currentDeg;
        drawWheelAtAngle(currentDeg);

        const remainingRatio = Math.max(0, 1 - progress);
        setRpm(Math.round(remainingRatio * 240));

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animateStep);
        } else {
          rotationRef.current = targetAngle;
          drawWheelAtAngle(targetAngle);
          setRpm(0);
          setIsSpinning(false);
          if (onSpinCompleteRef.current) {
            onSpinCompleteRef.current(targetWinner);
          }
        }
      };

      animFrameRef.current = requestAnimationFrame(animateStep);
    },
    [options, isSpinning, shouldAnimate, drawWheelAtAngle]
  );

  // Trigger auto-spin when mounted in modal mode (`autoStart = true`)
  useEffect(() => {
    if (autoStart && preselectedWinner && options.length > 0) {
      spinToWinner(preselectedWinner, !shouldAnimate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, preselectedWinner?.id]);

  const handleHubClick = () => {
    if (isSpinning) return;
    if (!options || options.length === 0) {
      if (onRequestSpinRef.current) {
        onRequestSpinRef.current(!shouldAnimate);
      } else {
        showToast('Please add at least one option to spin the wheel.', 'error');
      }
      return;
    }
    if (onRequestSpinRef.current) {
      const nextWinner = onRequestSpinRef.current(!shouldAnimate);
      if (nextWinner) {
        spinToWinner(nextWinner, !shouldAnimate);
      }
    } else {
      spinToWinner(null, !shouldAnimate);
    }
  };

  const handleInstantPick = () => {
    if (isSpinning) return;
    if (!options || options.length === 0) {
      if (onRequestSpinRef.current) {
        onRequestSpinRef.current(true);
      } else {
        showToast('Please add at least one option to spin the wheel.', 'error');
      }
      return;
    }
    if (onRequestSpinRef.current) {
      const nextWinner = onRequestSpinRef.current(true);
      if (nextWinner) {
        spinToWinner(nextWinner, true);
      }
    } else {
      spinToWinner(null, true);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Wheel Stage Container */}
      <div
        className="relative flex items-center justify-center select-none my-2"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {/* Top Downward Pointer Indicator at 12 o'clock */}
        <div
          aria-hidden="true"
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center drop-shadow-sm"
        >
          <div
            className="w-4 h-6 bg-primary-container"
            style={{ clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)' }}
          ></div>
          <div className="w-2 h-2 rounded-full bg-surface-container-lowest -mt-5 border border-primary-container"></div>
        </div>

        {/* Outer Architectural Rim */}
        <div className="absolute inset-0 rounded-full border-4 border-surface-container-high pointer-events-none"></div>

        {/* High-DPI Wheel Canvas */}
        <canvas
          ref={canvasRef}
          style={{ width: `${size}px`, height: `${size}px` }}
          className="rounded-full"
          aria-label="Decision Spin Wheel"
        />

        {/* Central Interactive 'SPIN' Hub Button */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <button
            type="button"
            onClick={handleHubClick}
            disabled={isSpinning}
            aria-label="Spin the wheel"
            className="pointer-events-auto w-20 h-20 rounded-full bg-surface-container-lowest border-4 border-surface-container-high shadow-md hover:border-primary-container flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all group cursor-pointer disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary-container"
          >
            <span className="font-label-md text-label-md font-bold text-primary group-hover:text-primary-container tracking-wider uppercase">
              {isSpinning ? 'SPIN...' : 'SPIN'}
            </span>
            <span className="text-[9px] font-mono font-medium text-secondary bg-surface-container px-1.5 py-0.5 rounded hairline-border">
              {isSpinning
                ? `${rpm}rpm`
                : shouldAnimate
                ? 'SPIN'
                : 'INSTANT'}
            </span>
          </button>
        </div>
      </div>

      {/* Reduced Motion & Telemetry Bar */}
      {showTelemetry && (
        <div className="w-full mt-3 pt-3 hairline-t flex flex-wrap items-center justify-between gap-2 font-label-sm text-label-sm text-secondary">
          <div className="flex items-center gap-2.5">
            <span className="font-mono tabular-nums">
              Mode:{' '}
              <strong className="text-on-surface font-semibold">
                {shouldAnimate ? 'Animated Spin' : 'Instant Resolution'}
              </strong>
            </span>
            <span className="text-outline-variant">•</span>
            <span className="font-mono tabular-nums">
              Velocity:{' '}
              <strong className="text-on-surface font-semibold">{rpm} rpm</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleInstantPick}
            disabled={isSpinning}
            className="text-primary hover:underline flex items-center gap-1 font-semibold cursor-pointer disabled:opacity-50"
          >
            <Icon name="bolt" size={13} />
            <span>Instant Pick</span>
          </button>
        </div>
      )}

      {/* Screen-reader live announcement */}
      <div className="sr-only" aria-live="polite">
        {currentWinner && !isSpinning
          ? `Selected winner: ${currentWinner.name}`
          : ''}
      </div>
    </div>
  );
}

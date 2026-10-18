/**
 * Decision Engine Algorithms for Choosely
 * Separates random, weighted, wheel rotation, and elimination logic from UI components.
 */

export const DECISION_MODES = {
  random: {
    id: 'random',
    label: 'Random Pick',
    shortLabel: 'Random Pick',
    historyLabel: 'Random Pick',
    badge: 'Uniform Probability',
    description: 'Every participating option has an equal statistical probability of selection.',
    icon: 'shuffle',
  },
  weighted: {
    id: 'weighted',
    label: 'Weighted Decision',
    shortLabel: 'Weighted',
    historyLabel: 'Weighted',
    badge: 'Statistical Weighting',
    description: 'Options with higher weight values have a proportionally higher likelihood of winning.',
    icon: 'pie_chart',
  },
  spin: {
    id: 'spin',
    label: 'Spin Wheel',
    shortLabel: 'Spin Wheel',
    historyLabel: 'Spin Wheel',
    badge: 'Deterministic Wheel',
    description: 'Visual radial wheel that spins and lands directly on the selected contender.',
    icon: 'adjust',
  },
  elimination: {
    id: 'elimination',
    label: 'Elimination Mode',
    shortLabel: 'Elimination',
    historyLabel: 'Elimination Mode',
    badge: 'Progressive Bracket',
    description: 'Removes contenders round-by-round until the final selection remains standing.',
    icon: 'remove_circle_outline',
  },
};

export function normalizeModeKey(modeString) {
  if (!modeString) return 'random';
  const lower = String(modeString).toLowerCase().trim();
  if (lower === 'random' || lower === 'random pick') return 'random';
  if (lower === 'weighted' || lower === 'weighted decision') return 'weighted';
  if (lower === 'spin' || lower === 'spin wheel') return 'spin';
  if (lower === 'elimination' || lower === 'elimination mode') return 'elimination';
  return 'random';
}

export function getModeDisplayLabel(modeKeyOrLabel) {
  const key = normalizeModeKey(modeKeyOrLabel);
  return DECISION_MODES[key]?.label || 'Random Pick';
}

export function getModeHistoryLabel(modeKey) {
  const key = normalizeModeKey(modeKey);
  return DECISION_MODES[key]?.historyLabel || 'Random Pick';
}

/**
 * Generates a short readable seed identifier for display transparency
 */
export function generateSeedHash() {
  const hex = Math.floor(0x1000 + Math.random() * 0xefff)
    .toString(16)
    .toUpperCase();
  const suffix = Math.floor(10 + Math.random() * 89);
  return `#${hex}-${suffix}`;
}

/**
 * Calculates total positive weight across options
 */
export function calculateTotalWeight(options = []) {
  if (!Array.isArray(options) || options.length === 0) return 0;
  return options.reduce((sum, opt) => {
    const w = parseInt(opt?.weight, 10);
    const validWeight = !Number.isNaN(w) && w > 0 ? w : 1;
    return sum + validWeight;
  }, 0);
}

/**
 * Calculates percentage share (0-100) for a single option within an option list
 */
export function calculateOptionPercentage(option, options = []) {
  const total = calculateTotalWeight(options);
  if (total <= 0) return 0;
  const w = parseInt(option?.weight, 10);
  const validWeight = !Number.isNaN(w) && w > 0 ? w : 1;
  return Math.round((validWeight / total) * 100);
}

/**
 * Uniform Random Selection
 * Every eligible option has an equal 1/N chance of being chosen.
 */
export function selectRandomOption(options = []) {
  if (!Array.isArray(options) || options.length === 0) {
    return null;
  }
  const index = Math.floor(Math.random() * options.length);
  const winner = options[index];
  const probabilityPercent = Math.round((1 / options.length) * 100);
  return {
    winner,
    winnerIndex: index,
    probabilityPercent,
    totalWeight: options.length,
    seedHash: generateSeedHash(),
  };
}

/**
 * Cumulative Weighted Selection
 * 1. Validates available options and weights.
 * 2. Calculates total positive weight.
 * 3. Generates random value in [0, totalWeight).
 * 4. Traverses cumulative weights to pick the winning option.
 */
export function selectWeightedOption(options = []) {
  if (!Array.isArray(options) || options.length === 0) {
    return null;
  }

  const sanitized = options.map((opt) => {
    const parsed = parseInt(opt?.weight, 10);
    const weight = !Number.isNaN(parsed) && parsed > 0 ? Math.min(100, parsed) : 1;
    return { option: opt, weight };
  });

  const totalWeight = sanitized.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) {
    return selectRandomOption(options);
  }

  const randomVal = Math.random() * totalWeight;
  let cumulative = 0;

  for (let i = 0; i < sanitized.length; i++) {
    cumulative += sanitized[i].weight;
    if (randomVal <= cumulative) {
      const winner = sanitized[i].option;
      const probabilityPercent = Math.round((sanitized[i].weight / totalWeight) * 100);
      return {
        winner,
        winnerIndex: i,
        probabilityPercent,
        totalWeight,
        seedHash: generateSeedHash(),
      };
    }
  }

  const lastIdx = sanitized.length - 1;
  return {
    winner: sanitized[lastIdx].option,
    winnerIndex: lastIdx,
    probabilityPercent: Math.round((sanitized[lastIdx].weight / totalWeight) * 100),
    totalWeight,
    seedHash: generateSeedHash(),
  };
}

/**
 * Unified decision runner for any mode ('random' | 'weighted' | 'spin' | 'elimination')
 */
export function runDecisionAlgorithm(options = [], mode = 'random') {
  const normalizedMode = normalizeModeKey(mode);
  if (normalizedMode === 'weighted') {
    return selectWeightedOption(options);
  }
  return selectRandomOption(options);
}

/**
 * Calculates target rotation (in degrees) for the Spin Wheel so that
 * the segment at `winnerIndex` lands directly under the top pointer (0 deg / 12 o'clock).
 *
 * When segment `i` is drawn starting from 12 o'clock clockwise:
 * Segment `i` spans `[i * segDeg, (i + 1) * segDeg]`.
 * Its center is at `centerDeg = (i + 0.5) * segDeg`.
 * Rotating the wheel clockwise by `R` degrees moves `centerDeg` to `(centerDeg + R) % 360`.
 * For the segment center to align with the top pointer at `0` (360) degrees:
 * `(centerDeg + R) % 360 === 0`  =>  `R % 360 === (360 - centerDeg) % 360`.
 */
export function calculateWheelRotationForWinner(currentRotationDeg, winnerIndex, totalSegments) {
  if (totalSegments <= 0) return currentRotationDeg;
  const segDeg = 360 / totalSegments;
  const segmentCenterDeg = (winnerIndex + 0.5) * segDeg;

  // Add slight jitter within the middle 50% of the winning slice so it feels natural
  const jitterRange = segDeg * 0.35;
  const jitter = (Math.random() - 0.5) * jitterRange;

  const desiredMod = (360 - segmentCenterDeg + jitter + 360) % 360;
  const currentMod = ((currentRotationDeg % 360) + 360) % 360;
  let deltaMod = (desiredMod - currentMod + 360) % 360;

  // Spin 5 to 7 full revolutions plus the alignment angle
  const extraTurns = (5 + Math.floor(Math.random() * 3)) * 360;
  return currentRotationDeg + extraTurns + deltaMod;
}

/**
 * Generates an ordered elimination sequence of non-winner option IDs
 * so that each round removes one contender until only `winnerId` remains.
 */
export function buildEliminationOrder(options = [], winnerId) {
  const nonWinners = options.filter((o) => o.id !== winnerId).map((o) => o.id);
  // Fisher-Yates shuffle on non-winners
  for (let i = nonWinners.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = nonWinners[i];
    nonWinners[i] = nonWinners[j];
    nonWinners[j] = temp;
  }
  return nonWinners;
}

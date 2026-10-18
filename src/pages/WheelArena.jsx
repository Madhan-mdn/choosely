import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { SpinWheel } from '../components/decisions/SpinWheel';
import { EliminationView } from '../components/decisions/EliminationView';
import {
  runDecisionAlgorithm,
  calculateOptionPercentage,
} from '../utils/decisionAlgorithms';
import { useAppState } from '../context/AppStateContext';

const SWATCH_COLORS = [
  '#1B4D3E',
  '#376757',
  '#8ABDA9',
  '#DBE0E5',
  '#C2C7CC',
  '#404945',
];

/**
 * Interactive Decision Arena Page (/wheel) supporting both Spin Wheel
 * and Elimination Bracket modes.
 */
export function WheelArena() {
  const navigate = useNavigate();
  const {
    categories,
    optionsMap,
    selectedCategoryId,
    setSelectedCategoryId,
    shouldAnimate,
    setAnimationsEnabled,
    addOption,
    equalizeCategoryWeights,
    shuffleCategoryOptions,
    activeDecision,
    presentDecisionResult,
    openExistingResultInModal,
    isOptionFavorited,
    toggleFavorite,
    showToast,
  } = useAppState();

  const [arenaMode, setArenaMode] = useState('spin'); // 'spin' | 'elimination'
  const [excludedOptionIds, setExcludedOptionIds] = useState({});
  const [quickOptionInput, setQuickOptionInput] = useState('');
  const [quickOptionError, setQuickOptionError] = useState('');
  const pendingDecisionRef = useRef(null);

  const activeCategory = useMemo(
    () =>
      categories.find((c) => c.id === selectedCategoryId) ||
      categories[0] ||
      null,
    [categories, selectedCategoryId]
  );

  const allCategoryOptions = useMemo(
    () => (activeCategory ? optionsMap[activeCategory.id] || [] : []),
    [activeCategory, optionsMap]
  );

  // Participating options (checked in the Participating Contenders list)
  const participatingOptions = useMemo(
    () => allCategoryOptions.filter((o) => !excludedOptionIds[o.id]),
    [allCategoryOptions, excludedOptionIds]
  );

  // Reset excluded IDs when switching categories
  useEffect(() => {
    setExcludedOptionIds({});
    pendingDecisionRef.current = null;
  }, [activeCategory?.id]);

  const toggleOptionParticipation = (optId) => {
    setExcludedOptionIds((prev) => ({
      ...prev,
      [optId]: !prev[optId],
    }));
  };

  // Pre-select a winner using the decision algorithm when the user clicks SPIN
  const handleRequestWheelSpin = () => {
    if (!activeCategory) {
      showToast('Please select or create a category first.', 'error');
      return null;
    }
    if (participatingOptions.length === 0) {
      showToast(
        allCategoryOptions.length === 0
          ? 'Please add at least one option to this category before spinning.'
          : 'Please check at least one participating contender before spinning.',
        'error'
      );
      return null;
    }

    const clonedOptions = JSON.parse(JSON.stringify(participatingOptions));
    const outcome = runDecisionAlgorithm(clonedOptions, 'spin');
    if (!outcome || !outcome.winner) {
      showToast('Unable to compute a winning option.', 'error');
      return null;
    }

    const now = new Date();
    const payload = {
      runId: `arena-spin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      categoryId: activeCategory.id,
      categoryName: activeCategory.name,
      mode: 'spin',
      options: clonedOptions,
      winner: outcome.winner,
      winnerIndex: outcome.winnerIndex,
      probabilityPercent: calculateOptionPercentage(
        outcome.winner,
        clonedOptions
      ),
      seedHash: outcome.seedHash,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].substring(0, 5),
    };
    pendingDecisionRef.current = payload;
    return outcome.winner;
  };

  const handleWheelSpinComplete = (winnerObj) => {
    const pending = pendingDecisionRef.current;
    pendingDecisionRef.current = null;

    if (pending && (!winnerObj || pending.winner.id === winnerObj.id)) {
      presentDecisionResult(pending, { openModal: true });
      return;
    }

    if (winnerObj && activeCategory && participatingOptions.length > 0) {
      const now = new Date();
      const clonedOptions = JSON.parse(JSON.stringify(participatingOptions));
      const fallbackPayload = {
        runId: `arena-spin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        categoryId: activeCategory.id,
        categoryName: activeCategory.name,
        mode: 'spin',
        options: clonedOptions,
        winner: winnerObj,
        winnerIndex: Math.max(
          0,
          clonedOptions.findIndex((o) => o.id === winnerObj.id)
        ),
        probabilityPercent: calculateOptionPercentage(
          winnerObj,
          clonedOptions
        ),
        seedHash: '#8F9A-40',
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0].substring(0, 5),
      };
      presentDecisionResult(fallbackPayload, { openModal: true });
    }
  };

  const handleEliminationComplete = (winnerObj, meta = {}) => {
    if (!winnerObj || !activeCategory || participatingOptions.length === 0) {
      return;
    }
    const now = new Date();
    const clonedOptions = JSON.parse(JSON.stringify(participatingOptions));
    const payload = {
      runId:
        meta.runId ||
        `arena-elim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      categoryId: activeCategory.id,
      categoryName: activeCategory.name,
      mode: 'elimination',
      options: clonedOptions,
      winner: winnerObj,
      winnerIndex: Math.max(
        0,
        clonedOptions.findIndex((o) => o.id === winnerObj.id)
      ),
      probabilityPercent: calculateOptionPercentage(
        winnerObj,
        clonedOptions
      ),
      seedHash: meta.seedHash || '#ELIM-01',
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].substring(0, 5),
    };
    presentDecisionResult(payload, { openModal: true });
  };

  const handleQuickAddOption = (e) => {
    e.preventDefault();
    if (!activeCategory) return;
    const res = addOption(activeCategory.id, quickOptionInput, 1);
    if (!res.ok) {
      setQuickOptionError(res.error);
      return;
    }
    setQuickOptionInput('');
    setQuickOptionError('');
  };

  const displayedResult = activeDecision;
  const isResultFav = displayedResult
    ? isOptionFavorited(
        displayedResult.categoryName,
        displayedResult.winner?.name
      )
    : false;

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumbs & Page Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 hairline-b">
        <div>
          <nav className="flex items-center gap-2 font-label-sm text-label-sm text-secondary mb-1">
            <button
              type="button"
              onClick={() => navigate('/generator')}
              className="hover:text-primary flex items-center gap-1 cursor-pointer"
            >
              <Icon name="arrow_back" size={13} />
              <span>Back to Generator</span>
            </button>
            <Icon name="chevron_right" size={12} />
            <span className="text-on-surface font-semibold">
              Interactive Arenas
            </span>
          </nav>
          <h1 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
            Interactive Decision Arena
          </h1>
          <p className="font-body-md text-body-md text-secondary mt-0.5">
            Visual resolution through deterministic wheel physics or progressive elimination brackets.
          </p>
        </div>

        {/* Segmented Mode Switcher */}
        <div className="inline-flex items-center p-1 bg-surface-container hairline-border rounded-lg shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setArenaMode('spin')}
            className={`px-3.5 py-1.5 rounded-md font-label-md text-label-md flex items-center gap-2 transition-all cursor-pointer ${
              arenaMode === 'spin'
                ? 'bg-surface-container-lowest text-primary font-semibold shadow-xs hairline-border'
                : 'text-secondary hover:text-on-surface font-medium'
            }`}
          >
            <Icon name="incomplete_circle" size={16} />
            <span>Spin Wheel Arena</span>
            {arenaMode === 'spin' && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setArenaMode('elimination')}
            className={`px-3.5 py-1.5 rounded-md font-label-md text-label-md flex items-center gap-2 transition-all cursor-pointer ${
              arenaMode === 'elimination'
                ? 'bg-surface-container-lowest text-primary font-semibold shadow-xs hairline-border'
                : 'text-secondary hover:text-on-surface font-medium'
            }`}
          >
            <Icon name="swords" size={16} />
            <span>Elimination Bracket</span>
            {arenaMode === 'elimination' && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
            )}
          </button>
        </div>
      </section>

      {/* Dual-Pane Evaluation Grid (7:5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Visual Arena + Live Winning Result Banner (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {arenaMode === 'spin' ? (
            <div className="bg-surface-container-lowest hairline-border rounded-xl p-5 sm:p-6 flex flex-col items-center">
              {/* Card Header Utilities */}
              <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-4 hairline-b mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-primary-container text-on-primary">
                    {activeCategory ? activeCategory.name : 'No Category'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-secondary tabular-nums">
                    {participatingOptions.length} Options Active
                  </span>
                </div>

                {/* Animation / Reduced Motion Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={shouldAnimate}
                  onClick={() => setAnimationsEnabled(!shouldAnimate)}
                  className="flex items-center gap-2 font-label-sm text-label-sm text-secondary hover:text-on-surface cursor-pointer"
                >
                  <Icon name="speed" size={15} />
                  <span>Studio Animations</span>
                  <span
                    className={`w-8 h-4.5 rounded-full p-0.5 transition-colors flex items-center ${
                      shouldAnimate
                        ? 'bg-primary-container justify-end'
                        : 'bg-surface-container-highest justify-start'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
                  </span>
                </button>
              </div>

              {/* Spin Wheel Stage */}
              <SpinWheel
                options={participatingOptions}
                shouldAnimate={shouldAnimate}
                size={330}
                showTelemetry={true}
                onRequestSpin={handleRequestWheelSpin}
                onSpinComplete={handleWheelSpinComplete}
              />

              {participatingOptions.length === 0 && (
                <div
                  role="alert"
                  className="w-full mt-3 p-3 rounded-lg bg-surface-container hairline-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-secondary"
                >
                  <span>
                    {allCategoryOptions.length === 0
                      ? 'No options in this category yet. Add at least one contender in the panel to spin the wheel.'
                      : 'All contenders are currently unchecked. Select at least one contender to run a decision.'}
                  </span>
                  {allCategoryOptions.length > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setExcludedOptionIds({})}
                    >
                      Enable All
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface-container-lowest hairline-border rounded-xl p-5 sm:p-6">
              <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-4 hairline-b mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-primary-container text-on-primary">
                    {activeCategory ? activeCategory.name : 'No Category'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-secondary tabular-nums">
                    {participatingOptions.length} Options Active
                  </span>
                </div>

                {/* Animation / Reduced Motion Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={shouldAnimate}
                  onClick={() => setAnimationsEnabled(!shouldAnimate)}
                  className="flex items-center gap-2 font-label-sm text-label-sm text-secondary hover:text-on-surface cursor-pointer"
                >
                  <Icon name="speed" size={15} />
                  <span>Studio Animations</span>
                  <span
                    className={`w-8 h-4.5 rounded-full p-0.5 transition-colors flex items-center ${
                      shouldAnimate
                        ? 'bg-primary-container justify-end'
                        : 'bg-surface-container-highest justify-start'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
                  </span>
                </button>
              </div>

              <EliminationView
                categoryName={activeCategory?.name || 'Elimination Bracket'}
                options={participatingOptions}
                autoRun={false}
                shouldAnimate={shouldAnimate}
                onComplete={handleEliminationComplete}
                onBackToGenerator={() => navigate('/generator')}
              />
            </div>
          )}

          {/* Live Winning Resolution Banner Card */}
          {displayedResult && (
            <section
              id="result-box"
              className="bg-surface-container-lowest hairline-border rounded-xl p-5 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0 border border-primary-container/20">
                    <Icon name="trophy" size={20} filled={true} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
                        Winning Resolution
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-container text-on-surface-variant hairline-border">
                        100% Deterministic Match
                      </span>
                    </div>
                    <h2
                      id="winner-text"
                      className="font-headline-md text-headline-md text-on-surface font-bold mt-0.5 flex items-center gap-1.5"
                    >
                      <span>{displayedResult.winner?.name}</span>
                      <Icon
                        name="verified"
                        size={18}
                        filled={true}
                        className="text-primary"
                      />
                    </h2>
                    <p className="font-body-sm text-body-sm text-secondary mt-1">
                      Category:{' '}
                      <strong className="text-on-surface">
                        {displayedResult.categoryName}
                      </strong>{' '}
                      • Weight share: {displayedResult.probabilityPercent}% • Seed{' '}
                      <span className="font-mono">{displayedResult.seedHash}</span>
                    </p>
                  </div>
                </div>

                {/* Result Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      toggleFavorite(
                        displayedResult.categoryName,
                        displayedResult.winner?.name
                      )
                    }
                  >
                    <Icon
                      name="star"
                      size={15}
                      filled={isResultFav}
                      className={
                        isResultFav ? 'text-primary-container' : 'text-secondary'
                      }
                    />
                    <span>{isResultFav ? 'Saved' : 'Save to Favorites'}</span>
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openExistingResultInModal(displayedResult)}
                  >
                    <span>Details</span>
                    <Icon name="arrow_forward" size={14} />
                  </Button>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: Participating Contenders & Arena Controls (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <section className="bg-surface-container-lowest hairline-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 hairline-b">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Participating Contenders
                </h2>
                <p className="font-label-sm text-label-sm text-secondary">
                  {participatingOptions.length} of {allCategoryOptions.length}{' '}
                  selected for arena
                </p>
              </div>
              {activeCategory && allCategoryOptions.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => equalizeCategoryWeights(activeCategory.id)}
                    className="px-2.5 py-1 font-label-sm text-label-sm bg-surface-container-low hover:bg-surface-container text-on-surface-variant rounded hairline-border transition-colors cursor-pointer"
                  >
                    Equalize
                  </button>
                  <button
                    type="button"
                    onClick={() => shuffleCategoryOptions(activeCategory.id)}
                    className="px-2.5 py-1 font-label-sm text-label-sm bg-surface-container-low hover:bg-surface-container text-on-surface-variant rounded hairline-border transition-colors cursor-pointer"
                  >
                    Shuffle
                  </button>
                </div>
              )}
            </div>

            {/* Category Switcher inside Arena */}
            <Select
              id="arena-category-select"
              label="Active Category"
              value={activeCategory?.id || ''}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              options={categories.map((c) => ({
                value: c.id,
                label: `${c.name} (${(optionsMap[c.id] || []).length} options)`,
              }))}
            />

            {/* Contender Checklist */}
            {allCategoryOptions.length === 0 ? (
              <div className="py-6 text-center font-body-sm text-body-sm text-secondary">
                No options in this category yet. Add options below!
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-surface-container max-h-[320px] overflow-y-auto pr-0.5">
                {allCategoryOptions.map((opt, idx) => {
                  const isChecked = !excludedOptionIds[opt.id];
                  const pct = calculateOptionPercentage(opt, allCategoryOptions);
                  const swatch = SWATCH_COLORS[idx % SWATCH_COLORS.length];

                  return (
                    <label
                      key={opt.id}
                      className="py-2.5 px-1 flex items-center justify-between hover:bg-surface-container-low/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOptionParticipation(opt.id)}
                          className="w-4 h-4 rounded text-primary-container border-outline focus:ring-primary-container cursor-pointer"
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: swatch }}
                        ></span>
                        <span
                          className={`font-body-sm text-body-sm font-medium truncate ${
                            isChecked
                              ? 'text-on-surface'
                              : 'text-secondary line-through'
                          }`}
                        >
                          {opt.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-20 bg-surface-container rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-primary-container h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                        <span className="font-label-sm text-label-sm font-semibold text-on-surface w-9 text-right font-mono tabular-nums">
                          {pct}%
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Quick Add Contender Input */}
            <form
              onSubmit={handleQuickAddOption}
              className="pt-3 hairline-t space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={quickOptionInput}
                  onChange={(e) => {
                    setQuickOptionInput(e.target.value);
                    if (quickOptionError) setQuickOptionError('');
                  }}
                  placeholder="Add custom contender..."
                  className="flex-1 h-9 px-3 font-body-sm text-body-sm bg-surface-container-low hairline-border rounded-lg text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary-container"
                />
                <Button type="submit" variant="secondary" size="sm" className="h-9">
                  <Icon name="add" size={15} />
                  <span>Add</span>
                </Button>
              </div>
              {quickOptionError && (
                <p role="alert" className="font-label-sm text-label-sm text-error">
                  {quickOptionError}
                </p>
              )}
            </form>
          </section>

          {/* Mode Cross-Switch Card */}
          <section className="bg-surface-container-lowest hairline-border rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon
                  name={arenaMode === 'spin' ? 'swords' : 'incomplete_circle'}
                  size={18}
                  className="text-primary-container"
                />
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  {arenaMode === 'spin'
                    ? 'Elimination Bracket Mode'
                    : 'Spin Wheel Mode'}
                </h3>
              </div>
              <span className="font-label-sm text-label-sm text-secondary">
                {participatingOptions.length} contenders ready
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary">
              {arenaMode === 'spin'
                ? 'Prefer narrowing down options round-by-round? Switch to the Elimination Bracket view.'
                : 'Prefer a radial spin? Switch back to the Spin Wheel Arena.'}
            </p>
            <Button
              variant="subtle"
              size="md"
              onClick={() =>
                setArenaMode(arenaMode === 'spin' ? 'elimination' : 'spin')
              }
            >
              <span>
                Switch to{' '}
                {arenaMode === 'spin'
                  ? 'Elimination Bracket'
                  : 'Spin Wheel Arena'}
              </span>
              <Icon name="arrow_forward" size={15} />
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}

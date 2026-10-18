import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { CategorySelector } from '../components/decisions/CategorySelector';
import { OptionEditor } from '../components/decisions/OptionEditor';
import { DecisionMethodSelector } from '../components/decisions/DecisionMethodSelector';
import { getModeDisplayLabel } from '../utils/decisionAlgorithms';
import { useAppState } from '../context/AppStateContext';

/**
 * Decision Generator page:
 * Provides active workspace category pills, full Category CRUD panel,
 * OptionEditor with relative weights, 2x2 Method Algorithm selector,
 * Generate Decision CTA, and Latest Resolution card.
 */
export function Generator() {
  const navigate = useNavigate();
  const {
    categories,
    optionsMap,
    selectedCategoryId,
    selectedMethod,
    setSelectedMethod,
    activeDecision,
    triggerDecision,
    isOptionFavorited,
    toggleFavorite,
    openExistingResultInModal,
    showToast,
  } = useAppState();

  const [runError, setRunError] = useState('');

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const currentOptions = selectedCategoryId
    ? optionsMap[selectedCategoryId] || []
    : [];

  const handleGenerateDecision = useCallback(() => {
    setRunError('');
    if (!selectedCategoryId || !selectedCategory) {
      setRunError('Please select or create a category first.');
      return;
    }
    if (currentOptions.length === 0) {
      setRunError(
        'Please add at least one option to generate a decision.'
      );
      return;
    }

    const res = triggerDecision({
      categoryId: selectedCategoryId,
      mode: selectedMethod,
      openModal: true,
    });
    if (!res.ok && res.error) {
      setRunError(res.error);
    }
  }, [
    selectedCategoryId,
    selectedCategory,
    currentOptions.length,
    selectedMethod,
    triggerDecision,
  ]);

  // Clear runError when category or options change
  useEffect(() => {
    setRunError('');
  }, [selectedCategoryId, currentOptions.length, selectedMethod]);

  // Support Ctrl+Enter shortcut to generate decision
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGenerateDecision();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGenerateDecision]);

  const handleShareLatest = async () => {
    if (!activeDecision) return;
    const text = `Choosely Resolution: ${activeDecision.winner.name} (${activeDecision.categoryName} • ${getModeDisplayLabel(activeDecision.mode)})`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Resolution copied to clipboard.');
    } catch {
      showToast('Resolution copied.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header Banner */}
      <section className="rounded-xl bg-surface-container-low p-4 hairline-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-container-lowest hairline-border flex items-center justify-center text-primary-container shrink-0 mt-0.5">
            <Icon name="auto_awesome" size={18} />
          </div>
          <div>
            <h1 className="font-headline-sm text-headline-sm font-semibold text-primary tracking-tight">
              Decision Generator
            </h1>
            <p className="font-body-sm text-body-sm text-secondary mt-0.5 leading-snug">
              Add your options, adjust weights if needed, and pick a method to resolve your choice.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/wheel')}
          >
            <Icon name="incomplete_circle" size={15} />
            <span>Open Wheel & Arena</span>
          </Button>
        </div>
      </section>

      {/* Active Workspace Category Pills Bar */}
      <CategorySelector variant="pills" />

      {/* Main 2-Column Generator Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Full Category Management Panel (4 Cols on Desktop) */}
        <div className="lg:col-span-4">
          <CategorySelector variant="panel" />
        </div>

        {/* Right Column: Option Editor, Method Selector, CTA & Latest Resolution (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Option Management Card */}
          <section className="bg-surface-container-lowest rounded-xl hairline-border p-5 space-y-4">
            <div className="flex items-center justify-between hairline-b pb-3.5">
              <div>
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block">
                  Contender Pool
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  {selectedCategory
                    ? `${selectedCategory.name} Options`
                    : 'Select a Category'}
                </h2>
              </div>
              {selectedCategory && (
                <span className="px-2.5 py-1 rounded-full bg-surface-container font-label-sm text-label-sm text-secondary tabular-nums">
                  {currentOptions.length}{' '}
                  {currentOptions.length === 1 ? 'contender' : 'contenders'}
                </span>
              )}
            </div>

            <OptionEditor
              categoryId={selectedCategoryId}
              showWeightsAlways={true}
            />
          </section>

          {/* Decision Method Selector & Primary Generate Action */}
          <section className="bg-surface-container-lowest rounded-xl hairline-border p-5 space-y-5">
            <DecisionMethodSelector
              value={selectedMethod}
              onChange={setSelectedMethod}
              showHelper={true}
              label="Method Algorithm"
            />

            <div className="space-y-2 pt-1">
              <button
                type="button"
                id="generateDecisionBtn"
                onClick={handleGenerateDecision}
                className="w-full py-3.5 px-4 bg-primary-container text-on-primary font-headline-sm text-headline-sm font-semibold rounded-lg hover:bg-primary active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Icon name="bolt" size={20} />
                <span>Generate Decision</span>
                <span className="hidden sm:inline-block ml-1 text-xs font-normal opacity-80">
                  (Ctrl+Enter)
                </span>
              </button>

              {runError && (
                <p
                  role="alert"
                  id="generatorRunError"
                  className="font-label-md text-label-md text-error text-center pt-1"
                >
                  {runError}
                </p>
              )}
            </div>
          </section>

          {/* Latest Resolution Card */}
          {activeDecision && (
            <section className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">
                  Latest Resolution
                </span>
                <span className="font-label-sm text-label-sm text-secondary font-mono">
                  {activeDecision.time || 'Just now'}
                </span>
              </div>

              <div className="bg-surface-container-lowest rounded-xl hairline-border p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                    <span>Selected Result</span>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        toggleFavorite(
                          activeDecision.categoryName,
                          activeDecision.winner.name
                        )
                      }
                      aria-label="Bookmark this outcome"
                      title="Save to Favorites"
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        isOptionFavorited(
                          activeDecision.categoryName,
                          activeDecision.winner.name
                        )
                          ? 'text-primary-container accent-soft-bg'
                          : 'text-secondary hover:text-primary hover:bg-surface-container'
                      }`}
                    >
                      <Icon
                        name="bookmark"
                        size={18}
                        filled={isOptionFavorited(
                          activeDecision.categoryName,
                          activeDecision.winner.name
                        )}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={handleShareLatest}
                      aria-label="Copy resolution"
                      title="Copy resolution to clipboard"
                      className="p-1.5 rounded text-secondary hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      <Icon name="share" size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-headline-md text-headline-md font-bold text-primary tracking-tight">
                    {activeDecision.winner.name}
                  </p>
                  <p className="font-body-sm text-body-sm text-secondary">
                    Category:{' '}
                    <strong className="text-on-surface font-medium">
                      {activeDecision.categoryName}
                    </strong>{' '}
                    • Determined via {getModeDisplayLabel(activeDecision.mode)} (
                    {activeDecision.probabilityPercent}% weight).
                  </p>
                </div>

                <div className="my-3.5 hairline-t"></div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button
                    variant="secondary"
                    size="md"
                    className="flex-1"
                    onClick={handleGenerateDecision}
                  >
                    <Icon name="refresh" size={16} className="text-secondary" />
                    <span>Generate Another</span>
                  </Button>
                  <Button
                    variant="subtle"
                    size="md"
                    onClick={() => openExistingResultInModal(activeDecision)}
                  >
                    <Icon name="check_circle" size={16} />
                    <span>Inspect Modal</span>
                  </Button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

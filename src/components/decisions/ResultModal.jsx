import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { SpinWheel } from './SpinWheel';
import { EliminationView } from './EliminationView';
import { getModeDisplayLabel } from '../../utils/decisionAlgorithms';
import { useAppState } from '../../context/AppStateContext';

/**
 * Global ResultModal component for displaying animated wheel/elimination stages
 * and the concluded decision outcome.
 */
export function ResultModal() {
  const navigate = useNavigate();
  const {
    activeDecision,
    resultModalOpen,
    resultModalStage,
    closeResultModal,
    completeModalAnimationAndShowResult,
    triggerDecision,
    isOptionFavorited,
    toggleFavorite,
    shouldAnimate,
    showToast,
  } = useAppState();

  const [copiedFeedback, setCopiedFeedback] = useState(false);

  if (!resultModalOpen || !activeDecision) return null;

  const {
    categoryId,
    categoryName,
    mode,
    options,
    winner,
    probabilityPercent,
    seedHash,
  } = activeDecision;

  const modeDisplay = getModeDisplayLabel(mode);
  const isFavorited = isOptionFavorited(categoryName, winner?.name);

  const handleGenerateAgain = () => {
    triggerDecision({
      categoryId: categoryId && categoryId !== 'custom' && categoryId !== 'history-view' ? categoryId : undefined,
      categoryNameOverride: categoryName,
      mode,
      customOptions: options,
      openModal: true,
    });
  };

  const handleCopyResult = async () => {
    const textToCopy = `Choosely Result:\nCategory: ${categoryName}\nMode: ${modeDisplay}\nSelected Option: ${winner.name}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedFeedback(true);
      showToast('Result copied to clipboard.');
      setTimeout(() => setCopiedFeedback(false), 1800);
    } catch {
      showToast('Copied result summary.');
    }
  };

  const handleViewInHistory = () => {
    closeResultModal();
    navigate('/history');
  };

  const modalTitle =
    resultModalStage === 'wheel'
      ? 'Spinning the Wheel'
      : resultModalStage === 'elimination'
      ? 'Elimination Mode'
      : 'Decision Concluded';

  return (
    <Modal
      isOpen={resultModalOpen}
      onClose={closeResultModal}
      title={modalTitle}
      maxWidth={resultModalStage === 'result' ? 'max-w-md' : 'max-w-lg'}
    >
      {/* Stage 1: Spin Wheel Animation */}
      {resultModalStage === 'wheel' && (
        <div className="space-y-3 py-1">
          <SpinWheel
            key={activeDecision.runId}
            options={options}
            preselectedWinner={winner}
            autoStart={true}
            shouldAnimate={shouldAnimate}
            size={300}
            showTelemetry={true}
            onSpinComplete={() => {
              if (!shouldAnimate) {
                completeModalAnimationAndShowResult();
                return;
              }
              setTimeout(() => {
                completeModalAnimationAndShowResult();
              }, 550);
            }}
          />
          <div className="flex justify-center pt-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={completeModalAnimationAndShowResult}
            >
              Skip to Final Selection
            </Button>
          </div>
        </div>
      )}

      {/* Stage 2: Elimination Animation */}
      {resultModalStage === 'elimination' && (
        <div className="space-y-3">
          <EliminationView
            key={activeDecision.runId}
            categoryName={categoryName}
            options={options}
            preselectedWinner={winner}
            autoRun={true}
            shouldAnimate={shouldAnimate}
            onComplete={() => {
              completeModalAnimationAndShowResult();
            }}
          />
          <div className="flex justify-end pt-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={completeModalAnimationAndShowResult}
            >
              Skip to Result
            </Button>
          </div>
        </div>
      )}

      {/* Stage 3: Final Result Display */}
      {resultModalStage === 'result' && (
        <div className="space-y-4">
          {/* Winner Focal Card */}
          <div className="relative bg-surface rounded-lg border-2 border-primary-container p-5 flex flex-col items-center text-center space-y-2.5 shadow-sm overflow-hidden">
            {/* Subtle accent badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-label-sm font-semibold tracking-wide uppercase">
              <Icon name="trophy" size={14} filled={true} />
              <span>Final Selection</span>
            </div>

            <div className="space-y-1 pt-0.5">
              <h3
                id="winnerTitleDisplay"
                className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight break-words"
              >
                {winner?.name}
              </h3>
              <p className="font-body-sm text-body-sm text-secondary">
                {mode === 'weighted'
                  ? `Selected via weighted probability (${probabilityPercent}% favorability weight)`
                  : mode === 'elimination'
                  ? `Unanimous outcome after ${Math.max(1, (options?.length || 2) - 1)} elimination rounds`
                  : mode === 'spin'
                  ? `Resolved via deterministic wheel spin (${seedHash})`
                  : `Uniform random selection (${probabilityPercent}% equal probability)`}
              </p>
            </div>

            {/* Metadata summary strip */}
            <div className="w-full pt-3 mt-1 hairline-t grid grid-cols-2 gap-3 text-left">
              <div>
                <span className="block font-label-sm text-[10px] uppercase text-secondary font-medium">
                  Category
                </span>
                <span className="font-label-md text-label-md text-on-surface font-semibold truncate block">
                  {categoryName}
                </span>
              </div>
              <div>
                <span className="block font-label-sm text-[10px] uppercase text-secondary font-medium">
                  Method
                </span>
                <span className="font-label-md text-label-md text-on-surface font-semibold truncate block">
                  {modeDisplay}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Action Cluster */}
          <div className="space-y-2 pt-1">
            {/* Primary Action: Make Another Decision */}
            <Button
              variant="primary"
              size="md"
              className="w-full h-10"
              onClick={handleGenerateAgain}
            >
              <Icon name="refresh" size={17} />
              <span>Make Another Decision</span>
            </Button>

            {/* Secondary Split Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => toggleFavorite(categoryName, winner?.name)}
                className={`h-9 px-2 rounded-lg font-label-sm text-label-sm font-medium flex items-center justify-center gap-1.5 hairline-border transition-all cursor-pointer active:scale-[0.98] ${
                  isFavorited
                    ? 'accent-soft-bg text-primary-container border-primary-container/30 font-semibold'
                    : 'bg-surface text-on-surface hover:bg-surface-container'
                }`}
              >
                <Icon
                  name="star"
                  size={15}
                  filled={isFavorited}
                  className={isFavorited ? 'text-primary-container' : 'text-secondary'}
                />
                <span>{isFavorited ? 'Saved' : 'Favorite'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyResult}
                className="h-9 px-2 bg-surface hairline-border rounded-lg font-label-sm text-label-sm text-on-surface font-medium flex items-center justify-center gap-1.5 hover:bg-surface-container active:scale-[0.98] transition-all cursor-pointer"
              >
                <Icon name="content_copy" size={14} className="text-secondary" />
                <span>{copiedFeedback ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleViewInHistory}
                className="h-9 px-2 bg-surface hairline-border rounded-lg font-label-sm text-label-sm text-on-surface font-medium flex items-center justify-center gap-1.5 hover:bg-surface-container active:scale-[0.98] transition-all cursor-pointer"
              >
                <Icon name="history" size={15} className="text-secondary" />
                <span>History</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

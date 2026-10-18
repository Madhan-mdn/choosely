import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { Icon, getCategoryIconName } from '../ui/Icon';
import { Button } from '../ui/Button';
import {
  buildEliminationOrder,
  runDecisionAlgorithm,
} from '../../utils/decisionAlgorithms';

/**
 * EliminationView component for progressive round-by-round elimination brackets.
 * Displays eligible options, round progress bar, eliminated contenders with round tags,
 * standing contenders, and supports both animated round-by-round elimination
 * and instant resolution when Studio Animations are disabled.
 */
export function EliminationView({
  categoryName = 'Decision Session',
  options = [],
  preselectedWinner = null,
  autoRun = true,
  shouldAnimate = true,
  onComplete,
  onRestart,
  onBackToGenerator,
}) {
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const completedNotifiedRef = useRef(false);

  const [winner, setWinner] = useState(null);
  const [seedHash, setSeedHash] = useState('#ELIM-01');
  const [tournamentRunId, setTournamentRunId] = useState('');
  const [eliminationOrder, setEliminationOrder] = useState([]);
  const [eliminatedStepCount, setEliminatedStepCount] = useState(0);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  const optionsSignature = useMemo(
    () => (options || []).map((o) => o.id).join('|'),
    [options]
  );

  // Derive eliminatedMap (optionId -> roundNumber) from eliminationOrder and eliminatedStepCount
  const eliminatedMap = useMemo(() => {
    const map = {};
    const limit = Math.min(eliminatedStepCount, eliminationOrder.length);
    for (let i = 0; i < limit; i++) {
      map[eliminationOrder[i]] = i + 1;
    }
    return map;
  }, [eliminationOrder, eliminatedStepCount]);

  const totalInitial = options.length;
  const totalRounds = Math.max(1, totalInitial - 1);
  const eliminatedCount = Object.keys(eliminatedMap).length;
  const remainingCount = Math.max(
    hasCompleted && totalInitial > 0 ? 1 : 0,
    totalInitial - eliminatedCount
  );
  const currentRound = Math.min(totalRounds, eliminatedCount + 1);
  const isFinished = hasCompleted && totalInitial > 0;
  const progressPercent = isFinished
    ? 100
    : totalRounds > 0
    ? Math.min(100, Math.round((eliminatedCount / totalRounds) * 100))
    : 100;

  // Initialize or reset the tournament bracket
  const initTournament = useCallback(
    (targetWinnerObj, startAuto = false) => {
      if (!options || options.length === 0) {
        setWinner(null);
        setEliminationOrder([]);
        setEliminatedStepCount(0);
        setIsAutoRunning(false);
        setHasCompleted(false);
        completedNotifiedRef.current = false;
        return;
      }

      let chosenWinner = targetWinnerObj;
      let chosenSeedHash = '#ELIM-01';
      if (!chosenWinner || !options.some((o) => o.id === chosenWinner.id)) {
        const outcome = runDecisionAlgorithm(options, 'elimination');
        chosenWinner = outcome?.winner || options[0];
        chosenSeedHash = outcome?.seedHash || '#ELIM-01';
      }

      const order = buildEliminationOrder(options, chosenWinner.id);
      const newRunId = `arena-elim-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 6)}`;

      setWinner(chosenWinner);
      setSeedHash(chosenSeedHash);
      setTournamentRunId(newRunId);
      setEliminationOrder(order);

      if (startAuto && (!shouldAnimate || order.length === 0)) {
        completedNotifiedRef.current = true;
        setEliminatedStepCount(order.length);
        setIsAutoRunning(false);
        setHasCompleted(true);
        if (onCompleteRef.current) {
          onCompleteRef.current(chosenWinner, {
            runId: newRunId,
            seedHash: chosenSeedHash,
          });
        }
      } else {
        completedNotifiedRef.current = false;
        setEliminatedStepCount(0);
        setHasCompleted(false);
        setIsAutoRunning(Boolean(startAuto && shouldAnimate));
      }
    },
    [options, shouldAnimate]
  );

  // Re-initialize whenever the preselected winner or participating options list changes
  useEffect(() => {
    initTournament(preselectedWinner, autoRun);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedWinner?.id, optionsSignature]);

  // Instantly eliminate all non-winners and report completion
  const resolveAllInstantly = useCallback(() => {
    if (!options || options.length === 0 || !winner) return;
    setEliminatedStepCount(eliminationOrder.length);
    setIsAutoRunning(false);
    setHasCompleted(true);
    if (!completedNotifiedRef.current) {
      completedNotifiedRef.current = true;
      if (onCompleteRef.current) {
        onCompleteRef.current(winner, {
          runId: tournamentRunId,
          seedHash,
        });
      }
    }
  }, [options, winner, eliminationOrder.length, tournamentRunId, seedHash]);

  // Progressive round-by-round timer when `isAutoRunning` is active
  useEffect(() => {
    if (!isAutoRunning || hasCompleted) return;
    if (!shouldAnimate || eliminationOrder.length === 0) {
      resolveAllInstantly();
      return;
    }

    if (eliminatedStepCount < eliminationOrder.length) {
      const timer = setTimeout(() => {
        setEliminatedStepCount((prev) => {
          const next = prev + 1;
          if (next >= eliminationOrder.length) {
            setIsAutoRunning(false);
            setHasCompleted(true);
          }
          return next;
        });
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsAutoRunning(false);
      setHasCompleted(true);
    }
  }, [
    isAutoRunning,
    hasCompleted,
    shouldAnimate,
    eliminatedStepCount,
    eliminationOrder.length,
    resolveAllInstantly,
  ]);

  // Notify parent when animated or step-by-step elimination finishes
  useEffect(() => {
    if (!hasCompleted || !winner || completedNotifiedRef.current) return;
    completedNotifiedRef.current = true;

    if (!shouldAnimate) {
      if (onCompleteRef.current) {
        onCompleteRef.current(winner, {
          runId: tournamentRunId,
          seedHash,
        });
      }
      return;
    }

    const timer = setTimeout(() => {
      if (onCompleteRef.current) {
        onCompleteRef.current(winner, {
          runId: tournamentRunId,
          seedHash,
        });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [hasCompleted, winner, shouldAnimate, tournamentRunId, seedHash]);

  const handleRunEliminationClick = () => {
    if (!options || options.length === 0) return;
    // If previous tournament already concluded, start a fresh tournament and run it immediately
    if (isFinished) {
      initTournament(null, true);
      return;
    }
    if (!shouldAnimate || eliminationOrder.length === 0) {
      resolveAllInstantly();
    } else {
      setIsAutoRunning(true);
    }
  };

  const handleNextRoundClick = () => {
    if (isFinished || !options || options.length === 0) return;
    setIsAutoRunning(false);
    if (eliminationOrder.length === 0) {
      setHasCompleted(true);
      return;
    }
    const next = Math.min(eliminationOrder.length, eliminatedStepCount + 1);
    setEliminatedStepCount(next);
    if (next >= eliminationOrder.length) {
      setHasCompleted(true);
    }
  };

  const handleRestartClick = () => {
    if (onRestart) {
      onRestart();
    } else {
      initTournament(null, false);
    }
  };

  if (options.length === 0) {
    return (
      <div className="p-6 bg-surface-container-lowest rounded-xl hairline-border text-center space-y-3">
        <p className="font-body-md text-body-md text-secondary">
          No options available for Elimination Mode. Please add or select at least one option first.
        </p>
        {onBackToGenerator && (
          <Button variant="secondary" onClick={onBackToGenerator}>
            Back to Generator
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      {/* 1. Context Badge Card */}
      <section className="bg-surface-container-lowest hairline-border rounded-xl p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
            <Icon name={getCategoryIconName(categoryName)} size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                Session
              </span>
              <span className="inline-block w-1 h-1 rounded-full bg-outline-variant"></span>
              <span className="font-label-sm text-label-sm text-primary font-semibold tabular-nums">
                {totalInitial} Initial Candidates
              </span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight truncate">
              {categoryName}
            </h3>
          </div>
        </div>
        <span
          className={`text-[11px] font-label-sm font-semibold px-2 py-0.5 rounded border shrink-0 ${
            isFinished
              ? 'bg-primary-fixed text-on-primary-fixed border-primary-container/20'
              : 'bg-primary/10 text-primary border-primary/20'
          }`}
        >
          {isFinished ? 'Concluded' : isAutoRunning ? 'Running...' : 'Ready'}
        </span>
      </section>

      {/* 2. Elimination Progress Indicator */}
      <section className="bg-surface-container-lowest hairline-border rounded-xl p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-label-md text-label-md font-semibold text-on-surface tabular-nums">
              {isFinished
                ? `Completed ${totalRounds} ${
                    totalRounds === 1 ? 'Round' : 'Rounds'
                  }`
                : `Round ${currentRound} of ${totalRounds}`}
            </span>
            <span className="font-body-sm text-body-sm text-secondary tabular-nums">
              • {remainingCount}{' '}
              {remainingCount === 1 ? 'contender' : 'contenders'} remaining
            </span>
          </div>
          <span className="font-label-sm text-label-sm font-semibold text-primary bg-surface-container-high px-2 py-0.5 rounded tabular-nums">
            {progressPercent}%
          </span>
        </div>

        <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-container rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center text-[11px] text-secondary font-label-sm pt-0.5">
          <span>
            {remainingCount === 2 && !isFinished
              ? 'Matchup: Final Two'
              : isFinished
              ? 'Final Winner Determined'
              : shouldAnimate
              ? 'Progressive Elimination'
              : 'Instant Elimination Mode'}
          </span>
          <span className="text-primary font-medium tabular-nums">
            {isFinished
              ? `Winner: ${winner?.name}`
              : `${Math.max(1, remainingCount - 1)} ${
                  Math.max(1, remainingCount - 1) === 1
                    ? 'Elimination'
                    : 'Eliminations'
                } to Victory`}
          </span>
        </div>
      </section>

      {/* 3. Live Candidate Bracket / Elimination Rows */}
      <section className="space-y-2 max-h-[280px] overflow-y-auto pr-0.5">
        <div className="flex items-center justify-between px-1">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
            Contenders
          </span>
          <span className="font-label-sm text-label-sm text-secondary">
            Status
          </span>
        </div>

        {options.map((opt, idx) => {
          const outRound = eliminatedMap[opt.id];
          const isEliminated = outRound !== undefined;
          const isFinalWinner = isFinished && !isEliminated;

          if (isEliminated) {
            return (
              <div
                key={opt.id}
                className="bg-surface-container-low/75 hairline-border rounded-lg p-3 flex items-center justify-between opacity-75 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-surface-container text-secondary flex items-center justify-center font-label-md text-label-md font-medium shrink-0 tabular-nums">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="font-body-md text-body-md text-secondary line-through font-medium truncate">
                      {opt.name}
                    </div>
                    <div className="font-body-sm text-[11px] text-secondary/75">
                      Seed #{idx + 1}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-label-sm font-semibold bg-error-container/60 text-on-error-container border border-error/25 shrink-0 tabular-nums">
                  Out Round {outRound}
                </span>
              </div>
            );
          }

          return (
            <div
              key={opt.id}
              className={`rounded-lg p-3.5 flex items-center justify-between transition-all ${
                isFinalWinner
                  ? 'bg-surface-container-lowest border-2 border-primary-container shadow-sm'
                  : 'bg-surface-container-lowest hairline-border hover:border-primary/40'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center font-label-md text-label-md font-semibold shrink-0 tabular-nums ${
                    isFinalWinner
                      ? 'bg-primary-container text-on-primary'
                      : 'bg-surface-container text-primary'
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <div className="font-headline-sm text-base text-on-surface font-semibold tracking-tight truncate">
                    {opt.name}
                  </div>
                  <div className="font-body-sm text-body-sm text-secondary flex items-center gap-1.5">
                    <span>Seed #{idx + 1}</span>
                    <span>•</span>
                    <span className="text-primary font-semibold">
                      {isFinalWinner ? 'Winner' : 'Standing'}
                    </span>
                  </div>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-md text-[11px] font-label-sm font-semibold shrink-0 ${
                  isFinalWinner
                    ? 'bg-primary-container text-on-primary'
                    : 'bg-surface-container text-primary hairline-border'
                }`}
              >
                {isFinalWinner ? 'Final Selection' : 'Standing'}
              </span>
            </div>
          );
        })}
      </section>

      {/* 4. Elimination Action Controls */}
      <section className="pt-1 flex flex-col sm:flex-row items-center gap-2">
        <Button
          variant="primary"
          size="md"
          className="w-full sm:flex-1"
          onClick={handleRunEliminationClick}
          disabled={isAutoRunning}
        >
          <Icon name={isFinished ? 'refresh' : 'play_arrow'} size={16} />
          <span>
            {isFinished
              ? !shouldAnimate
                ? 'Resolve Again Instantly'
                : 'Run Elimination Again'
              : !shouldAnimate
              ? 'Resolve Winner Instantly'
              : isAutoRunning
              ? 'Eliminating Rounds...'
              : 'Run Elimination'}
          </span>
        </Button>

        {!isFinished && shouldAnimate && totalInitial > 1 && (
          <Button
            variant="secondary"
            size="md"
            className="w-full sm:w-auto"
            onClick={handleNextRoundClick}
          >
            <Icon name="gavel" size={16} />
            <span>Next Round</span>
          </Button>
        )}

        <Button
          variant="secondary"
          size="md"
          className="w-full sm:w-auto"
          onClick={handleRestartClick}
        >
          <Icon name="restart_alt" size={16} />
          <span>Restart Tournament</span>
        </Button>

        {onBackToGenerator && (
          <Button
            variant="ghost"
            size="md"
            className="w-full sm:w-auto"
            onClick={onBackToGenerator}
          >
            <Icon name="arrow_back" size={15} />
            <span>Back to Generator</span>
          </Button>
        )}
      </section>
    </div>
  );
}

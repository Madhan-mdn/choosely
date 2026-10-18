import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  loadAppState,
  saveAppState,
  clearAndResetAppState,
  getStorageSizeKB,
} from '../utils/storage.js';
import {
  runDecisionAlgorithm,
  normalizeModeKey,
  getModeHistoryLabel,
  calculateOptionPercentage,
} from '../utils/decisionAlgorithms.js';
import {
  validateImportedJson,
  mergeImportedState,
  exportAppStateToJson,
} from '../utils/exportImport.js';
import { useTheme } from '../hooks/useTheme.js';

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [appState, setAppState] = useState(() => loadAppState());
  const [selectedCategoryId, setSelectedCategoryId] = useState(() => {
    const initial = loadAppState();
    return initial.categories[0]?.id || null;
  });
  const [selectedMethod, setSelectedMethod] = useState('random');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Latest resolved or active decision run
  const [activeDecision, setActiveDecision] = useState(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultModalStage, setResultModalStage] = useState('result'); // 'wheel' | 'elimination' | 'result'

  // Toast feedback state
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  // Track which decision runIds have already been saved to history to prevent duplicates
  const recordedRunIdsRef = useRef(new Set());

  // Persist appState whenever it changes
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // Keep selectedCategoryId valid if categories change
  useEffect(() => {
    if (
      selectedCategoryId &&
      !appState.categories.some((c) => c.id === selectedCategoryId)
    ) {
      setSelectedCategoryId(appState.categories[0]?.id || null);
    } else if (!selectedCategoryId && appState.categories.length > 0) {
      setSelectedCategoryId(appState.categories[0].id);
    }
  }, [appState.categories, selectedCategoryId]);

  const showToast = useCallback((message, type = 'success') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ id: Date.now(), message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3200);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast(null);
  }, []);

  // Theme synchronization (keeps selected themeMode separate from resolvedTheme)
  const { themeMode, resolvedTheme, isDark } = useTheme(appState.settings);

  // Check if animations should run (respects both app setting and OS prefers-reduced-motion)
  const shouldAnimate = useMemo(() => {
    if (!appState.settings.animations) return false;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return false;
    }
    return true;
  }, [appState.settings.animations]);

  // ==========================================
  // CATEGORY CRUD
  // ==========================================
  const addCategory = useCallback(
    (rawName) => {
      const name = String(rawName || '').trim();
      if (!name) {
        return { ok: false, error: 'Category name cannot be empty.' };
      }
      const duplicate = appState.categories.some(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      );
      if (duplicate) {
        return { ok: false, error: 'A category with this name already exists.' };
      }

      const newId = `cat-${Date.now()}`;
      const newCategory = { id: newId, name };

      setAppState((prev) => {
        const next = {
          ...prev,
          categories: [...prev.categories, newCategory],
          options: {
            ...prev.options,
            [newId]: [],
          },
        };
        saveAppState(next);
        return next;
      });
      setSelectedCategoryId(newId);
      showToast(`Category "${name}" created.`);
      return { ok: true, category: newCategory };
    },
    [appState.categories, showToast]
  );

  const updateCategory = useCallback(
    (categoryId, rawName) => {
      const name = String(rawName || '').trim();
      if (!name) {
        return { ok: false, error: 'Category name cannot be empty.' };
      }
      const duplicate = appState.categories.some(
        (c) =>
          c.id !== categoryId && c.name.toLowerCase() === name.toLowerCase()
      );
      if (duplicate) {
        return { ok: false, error: 'A category with this name already exists.' };
      }

      const oldCategory = appState.categories.find((c) => c.id === categoryId);
      const oldName = oldCategory?.name;

      setAppState((prev) => {
        const next = {
          ...prev,
          categories: prev.categories.map((c) =>
            c.id === categoryId ? { ...c, name } : c
          ),
          favorites: oldName
            ? prev.favorites.map((f) =>
                f.categoryName.toLowerCase() === oldName.toLowerCase()
                  ? { ...f, categoryName: name }
                  : f
              )
            : prev.favorites,
        };
        saveAppState(next);
        return next;
      });
      showToast(`Category renamed to "${name}".`);
      return { ok: true };
    },
    [appState.categories, showToast]
  );

  const deleteCategory = useCallback(
    (categoryId) => {
      const target = appState.categories.find((c) => c.id === categoryId);
      if (!target) return { ok: false };

      setAppState((prev) => {
        const nextCategories = prev.categories.filter(
          (c) => c.id !== categoryId
        );
        const nextOptions = { ...prev.options };
        delete nextOptions[categoryId];
        const next = {
          ...prev,
          categories: nextCategories,
          options: nextOptions,
        };
        saveAppState(next);
        return next;
      });

      if (selectedCategoryId === categoryId) {
        const remaining = appState.categories.filter(
          (c) => c.id !== categoryId
        );
        setSelectedCategoryId(remaining[0]?.id || null);
      }
      showToast(`Category "${target.name}" deleted.`, 'info');
      return { ok: true };
    },
    [appState.categories, selectedCategoryId, showToast]
  );

  // ==========================================
  // OPTION CRUD
  // ==========================================
  const addOption = useCallback(
    (categoryId, rawName, rawWeight = 1) => {
      if (!categoryId) {
        return { ok: false, error: 'Please select a category first.' };
      }
      const name = String(rawName || '').trim();
      if (!name) {
        return { ok: false, error: 'Option name cannot be empty.' };
      }

      const currentList = appState.options[categoryId] || [];
      const duplicate = currentList.some(
        (o) => o.name.toLowerCase() === name.toLowerCase()
      );
      if (duplicate) {
        return {
          ok: false,
          error: 'This option name already exists in this category.',
        };
      }

      const parsedWeight = parseInt(rawWeight, 10);
      const weight =
        !Number.isNaN(parsedWeight) && parsedWeight >= 1
          ? Math.min(100, parsedWeight)
          : 1;

      const newOption = {
        id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name,
        weight,
      };

      setAppState((prev) => {
        const next = {
          ...prev,
          options: {
            ...prev.options,
            [categoryId]: [...(prev.options[categoryId] || []), newOption],
          },
        };
        saveAppState(next);
        return next;
      });
      return { ok: true, option: newOption };
    },
    [appState.options]
  );

  const updateOption = useCallback(
    (categoryId, optionId, updates) => {
      if (!categoryId || !optionId) return { ok: false };
      const currentList = appState.options[categoryId] || [];
      const existing = currentList.find((o) => o.id === optionId);
      if (!existing) return { ok: false, error: 'Option not found.' };

      let nextName = existing.name;
      if (updates.name !== undefined) {
        const trimmed = String(updates.name).trim();
        if (!trimmed) {
          return { ok: false, error: 'Option name cannot be empty.' };
        }
        const duplicate = currentList.some(
          (o) =>
            o.id !== optionId && o.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (duplicate) {
          return {
            ok: false,
            error: 'An option with this name already exists in this category.',
          };
        }
        nextName = trimmed;
      }

      let nextWeight = existing.weight || 1;
      if (updates.weight !== undefined) {
        const parsed = parseInt(updates.weight, 10);
        nextWeight =
          !Number.isNaN(parsed) && parsed >= 1 ? Math.min(100, parsed) : 1;
      }

      setAppState((prev) => {
        const next = {
          ...prev,
          options: {
            ...prev.options,
            [categoryId]: (prev.options[categoryId] || []).map((o) =>
              o.id === optionId
                ? { ...o, name: nextName, weight: nextWeight }
                : o
            ),
          },
        };
        saveAppState(next);
        return next;
      });
      return { ok: true };
    },
    [appState.options]
  );

  const deleteOption = useCallback((categoryId, optionId) => {
    if (!categoryId || !optionId) return;
    setAppState((prev) => {
      const next = {
        ...prev,
        options: {
          ...prev.options,
          [categoryId]: (prev.options[categoryId] || []).filter(
            (o) => o.id !== optionId
          ),
        },
      };
      saveAppState(next);
      return next;
    });
  }, []);

  const equalizeCategoryWeights = useCallback(
    (categoryId) => {
      if (!categoryId) return;
      setAppState((prev) => {
        const next = {
          ...prev,
          options: {
            ...prev.options,
            [categoryId]: (prev.options[categoryId] || []).map((o) => ({
              ...o,
              weight: 1,
            })),
          },
        };
        saveAppState(next);
        return next;
      });
      showToast('All option weights equalized.');
    },
    [showToast]
  );

  const shuffleCategoryOptions = useCallback((categoryId) => {
    if (!categoryId) return;
    setAppState((prev) => {
      const list = [...(prev.options[categoryId] || [])];
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = list[i];
        list[i] = list[j];
        list[j] = temp;
      }
      const next = {
        ...prev,
        options: {
          ...prev.options,
          [categoryId]: list,
        },
      };
      saveAppState(next);
      return next;
    });
  }, []);

  // ==========================================
  // HISTORY & DECISION ENGINE
  // ==========================================
  const commitDecisionToHistory = useCallback((decisionObj) => {
    if (!decisionObj || !decisionObj.runId) return;
    if (recordedRunIdsRef.current.has(decisionObj.runId)) {
      return; // Already recorded, never duplicate!
    }
    recordedRunIdsRef.current.add(decisionObj.runId);

    const now = new Date();
    const dateStr = decisionObj.date || now.toISOString().split('T')[0];
    const timeStr =
      decisionObj.time || now.toTimeString().split(' ')[0].substring(0, 5);

    const logItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      categoryName: decisionObj.categoryName,
      optionName: decisionObj.winner.name,
      mode: getModeHistoryLabel(decisionObj.mode),
      date: dateStr,
      time: timeStr,
    };

    setAppState((prev) => {
      const next = {
        ...prev,
        history: [...prev.history, logItem],
      };
      saveAppState(next);
      return next;
    });
  }, []);

  const triggerDecision = useCallback(
    ({
      categoryId = selectedCategoryId,
      categoryNameOverride = null,
      mode = selectedMethod,
      customOptions = null,
      openModal = true,
      skipAnimation = false,
    } = {}) => {
      const normalizedMode = normalizeModeKey(mode);
      let categoryName = categoryNameOverride;
      let optionsList = customOptions;

      if (!optionsList) {
        if (!categoryId) {
          return { ok: false, error: 'Please select a category first.' };
        }
        const category = appState.categories.find((c) => c.id === categoryId);
        if (!category) {
          return { ok: false, error: 'Selected category was not found.' };
        }
        categoryName = category.name;
        optionsList = appState.options[categoryId] || [];
      }

      if (!Array.isArray(optionsList) || optionsList.length === 0) {
        return {
          ok: false,
          error: 'Please add at least one option to generate a decision.',
        };
      }

      const clonedOptions = JSON.parse(JSON.stringify(optionsList));
      const outcome = runDecisionAlgorithm(clonedOptions, normalizedMode);
      if (!outcome || !outcome.winner) {
        return { ok: false, error: 'Unable to compute a decision outcome.' };
      }

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
      const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      const weightPercent = calculateOptionPercentage(
        outcome.winner,
        clonedOptions
      );

      const decisionPayload = {
        runId,
        categoryId: categoryId || 'custom',
        categoryName: categoryName || 'Custom Set',
        mode: normalizedMode,
        options: clonedOptions,
        winner: outcome.winner,
        winnerIndex: outcome.winnerIndex,
        probabilityPercent:
          normalizedMode === 'weighted'
            ? weightPercent
            : outcome.probabilityPercent,
        seedHash: outcome.seedHash,
        date: dateStr,
        time: timeStr,
      };

      setActiveDecision(decisionPayload);

      const animateThisRun = shouldAnimate && !skipAnimation;

      if (openModal) {
        if (animateThisRun && normalizedMode === 'spin') {
          setResultModalStage('wheel');
        } else if (
          animateThisRun &&
          normalizedMode === 'elimination' &&
          clonedOptions.length > 1
        ) {
          setResultModalStage('elimination');
        } else {
          setResultModalStage('result');
          commitDecisionToHistory(decisionPayload);
        }
        setResultModalOpen(true);
      } else {
        // Inline execution (e.g. from Spin Wheel / Elimination page)
        commitDecisionToHistory(decisionPayload);
      }

      return { ok: true, decision: decisionPayload };
    },
    [
      selectedCategoryId,
      selectedMethod,
      appState.categories,
      appState.options,
      shouldAnimate,
      commitDecisionToHistory,
    ]
  );

  const completeModalAnimationAndShowResult = useCallback(() => {
    if (activeDecision) {
      commitDecisionToHistory(activeDecision);
    }
    setResultModalStage('result');
  }, [activeDecision, commitDecisionToHistory]);

  const presentDecisionResult = useCallback(
    (decisionPayload, { openModal = true } = {}) => {
      if (!decisionPayload || !decisionPayload.winner) return;
      setActiveDecision(decisionPayload);
      commitDecisionToHistory(decisionPayload);
      setResultModalStage('result');
      if (openModal) {
        setResultModalOpen(true);
      }
    },
    [commitDecisionToHistory]
  );

  const openExistingResultInModal = useCallback((item) => {
    if (!item) return;
    const runId = item.runId || `existing-${item.id || Date.now()}`;
    recordedRunIdsRef.current.add(runId); // Mark as already recorded so it never duplicates history
    const winnerObj =
      item.winner && typeof item.winner === 'object' && item.winner.name
        ? item.winner
        : {
            id: item.winner?.id || 'opt-existing',
            name: item.optionName || item.winner?.name || 'Selected Option',
            weight: item.winner?.weight || 1,
          };
    setActiveDecision({
      runId,
      categoryId: item.categoryId || 'history-view',
      categoryName: item.categoryName || 'General',
      mode: normalizeModeKey(item.mode),
      options:
        Array.isArray(item.options) && item.options.length > 0
          ? item.options
          : [winnerObj],
      winner: winnerObj,
      winnerIndex: item.winnerIndex ?? 0,
      probabilityPercent: item.probabilityPercent || 100,
      seedHash: item.seedHash || '#HIST-01',
      date: item.date || '',
      time: item.time || '',
    });
    setResultModalStage('result');
    setResultModalOpen(true);
  }, []);

  const closeResultModal = useCallback(() => {
    setResultModalOpen(false);
  }, []);

  const deleteHistoryItem = useCallback((historyId) => {
    setAppState((prev) => {
      const next = {
        ...prev,
        history: prev.history.filter((item) => item.id !== historyId),
      };
      saveAppState(next);
      return next;
    });
  }, []);

  const clearAllHistory = useCallback(() => {
    setAppState((prev) => {
      const next = {
        ...prev,
        history: [],
      };
      saveAppState(next);
      return next;
    });
    showToast('Decision history cleared.', 'info');
  }, [showToast]);

  // ==========================================
  // FAVORITES
  // ==========================================
  const isOptionFavorited = useCallback(
    (categoryName, optionName) => {
      if (!categoryName || !optionName) return false;
      return appState.favorites.some(
        (f) =>
          f.categoryName.toLowerCase() === String(categoryName).toLowerCase() &&
          f.optionName.toLowerCase() === String(optionName).toLowerCase()
      );
    },
    [appState.favorites]
  );

  const addFavorite = useCallback(
    (categoryName, optionName) => {
      if (!categoryName || !optionName) return false;
      const already = isOptionFavorited(categoryName, optionName);
      if (already) return false;

      const dateStr = new Date().toISOString().split('T')[0];
      const newFav = {
        id: `fav-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        categoryName: String(categoryName).trim(),
        optionName: String(optionName).trim(),
        addedAt: dateStr,
      };

      setAppState((prev) => {
        const next = {
          ...prev,
          favorites: [...prev.favorites, newFav],
        };
        saveAppState(next);
        return next;
      });
      showToast(`"${optionName}" saved to favorites.`);
      return true;
    },
    [isOptionFavorited, showToast]
  );

  const removeFavorite = useCallback(
    (favoriteId) => {
      const target = appState.favorites.find((f) => f.id === favoriteId);
      setAppState((prev) => {
        const next = {
          ...prev,
          favorites: prev.favorites.filter((f) => f.id !== favoriteId),
        };
        saveAppState(next);
        return next;
      });
      if (target) {
        showToast(`Removed "${target.optionName}" from favorites.`, 'info');
      }
    },
    [appState.favorites, showToast]
  );

  const toggleFavorite = useCallback(
    (categoryName, optionName) => {
      if (!categoryName || !optionName) return;
      const existing = appState.favorites.find(
        (f) =>
          f.categoryName.toLowerCase() === String(categoryName).toLowerCase() &&
          f.optionName.toLowerCase() === String(optionName).toLowerCase()
      );
      if (existing) {
        removeFavorite(existing.id);
      } else {
        addFavorite(categoryName, optionName);
      }
    },
    [appState.favorites, addFavorite, removeFavorite]
  );

  // ==========================================
  // SETTINGS, EXPORT, IMPORT & RESET
  // ==========================================
  const setThemeMode = useCallback((mode) => {
    const validMode = mode === 'dark' ? 'dark' : 'light';

    setAppState((prev) => {
      const next = {
        ...prev,
        settings: {
          ...prev.settings,
          themeMode: validMode,
          darkMode: validMode === 'dark',
        },
      };
      saveAppState(next);
      return next;
    });
  }, []);

  const toggleDarkMode = useCallback(
    (forceDark) => {
      const nextDark =
        typeof forceDark === 'boolean' ? forceDark : !isDark;
      setThemeMode(nextDark ? 'dark' : 'light');
    },
    [isDark, setThemeMode]
  );

  const setAnimationsEnabled = useCallback((enabled) => {
    setAppState((prev) => {
      const next = {
        ...prev,
        settings: {
          ...prev.settings,
          animations: Boolean(enabled),
        },
      };
      saveAppState(next);
      return next;
    });
  }, []);

  const exportData = useCallback(() => {
    const res = exportAppStateToJson(appState);
    if (res.ok) {
      showToast('Backup JSON exported successfully.');
    } else {
      showToast(res.error || 'Failed to export backup.', 'error');
    }
    return res;
  }, [appState, showToast]);

  const validateBackupJsonString = useCallback((jsonText) => {
    if (!jsonText || !String(jsonText).trim()) {
      return {
        ok: false,
        error: 'The selected file is empty. Please choose a valid JSON backup.',
      };
    }
    try {
      const parsed = JSON.parse(jsonText);
      const validation = validateImportedJson(parsed);
      if (!validation.valid) {
        return { ok: false, error: validation.error };
      }
      return {
        ok: true,
        state: validation.state,
        summary: validation.summary,
      };
    } catch {
      return {
        ok: false,
        error:
          'Malformed JSON file. Please verify you selected a valid Choosely backup file.',
      };
    }
  }, []);

  const applyValidatedImport = useCallback(
    (validatedState, strategy = 'overwrite') => {
      if (!validatedState) {
        return { ok: false, error: 'No validated backup state provided.' };
      }
      if (strategy === 'merge') {
        setAppState((prev) => {
          const merged = mergeImportedState(prev, validatedState);
          saveAppState(merged);
          return merged;
        });
        showToast('Backup data merged into your workspace.');
      } else {
        recordedRunIdsRef.current.clear();
        saveAppState(validatedState);
        setAppState(validatedState);
        setSelectedCategoryId(validatedState.categories[0]?.id || null);
        setActiveDecision(null);
        setResultModalOpen(false);
        showToast('Backup data restored and replaced current workspace.');
      }
      return { ok: true };
    },
    [showToast]
  );

  const importDataFromJsonString = useCallback(
    (jsonText, strategy = 'overwrite') => {
      const check = validateBackupJsonString(jsonText);
      if (!check.ok) {
        return check;
      }
      return applyValidatedImport(check.state, strategy);
    },
    [validateBackupJsonString, applyValidatedImport]
  );

  const resetAllData = useCallback(() => {
    try {
      const fresh = clearAndResetAppState();
      recordedRunIdsRef.current.clear();
      setAppState(fresh);
      setSelectedCategoryId(fresh.categories[0]?.id || null);
      setSelectedMethod('random');
      setGlobalSearchQuery('');
      setActiveDecision(null);
      setResultModalStage('result');
      setResultModalOpen(false);
      showToast('All application data has been reset to defaults.', 'info');
      return { ok: true };
    } catch {
      showToast('Failed to reset application data.', 'error');
      return { ok: false, error: 'Failed to reset application data.' };
    }
  }, [showToast]);

  const storageSizeKB = useMemo(() => getStorageSizeKB(appState), [appState]);

  const value = useMemo(
    () => ({
      appState,
      categories: appState.categories,
      optionsMap: appState.options,
      favorites: appState.favorites,
      history: appState.history,
      settings: appState.settings,
      themeMode,
      resolvedTheme,
      isDark,
      shouldAnimate,
      storageSizeKB,
      selectedCategoryId,
      setSelectedCategoryId,
      selectedMethod,
      setSelectedMethod,
      globalSearchQuery,
      setGlobalSearchQuery,
      activeDecision,
      setActiveDecision,
      resultModalOpen,
      setResultModalOpen,
      resultModalStage,
      setResultModalStage,
      closeResultModal,
      completeModalAnimationAndShowResult,
      presentDecisionResult,
      openExistingResultInModal,
      commitDecisionToHistory,
      addCategory,
      updateCategory,
      deleteCategory,
      addOption,
      updateOption,
      deleteOption,
      equalizeCategoryWeights,
      shuffleCategoryOptions,
      triggerDecision,
      deleteHistoryItem,
      clearAllHistory,
      isOptionFavorited,
      addFavorite,
      removeFavorite,
      toggleFavorite,
      setThemeMode,
      toggleDarkMode,
      setAnimationsEnabled,
      exportData,
      validateBackupJsonString,
      applyValidatedImport,
      importDataFromJsonString,
      resetAllData,
      toast,
      showToast,
      dismissToast,
    }),
    [
      appState,
      themeMode,
      resolvedTheme,
      isDark,
      shouldAnimate,
      storageSizeKB,
      selectedCategoryId,
      selectedMethod,
      globalSearchQuery,
      activeDecision,
      resultModalOpen,
      resultModalStage,
      closeResultModal,
      completeModalAnimationAndShowResult,
      presentDecisionResult,
      openExistingResultInModal,
      commitDecisionToHistory,
      addCategory,
      updateCategory,
      deleteCategory,
      addOption,
      updateOption,
      deleteOption,
      equalizeCategoryWeights,
      shuffleCategoryOptions,
      triggerDecision,
      deleteHistoryItem,
      clearAllHistory,
      isOptionFavorited,
      addFavorite,
      removeFavorite,
      toggleFavorite,
      setThemeMode,
      toggleDarkMode,
      setAnimationsEnabled,
      exportData,
      validateBackupJsonString,
      applyValidatedImport,
      importDataFromJsonString,
      resetAllData,
      toast,
      showToast,
      dismissToast,
    ]
  );

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}

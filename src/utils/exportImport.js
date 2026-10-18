import { normalizeAppState } from './storage.js';

export const BACKUP_SCHEMA_VERSION = 1;

/**
 * Validates that a parsed JSON object has a valid Choosely backup structure
 * and a supported schemaVersion.
 */
export function validateImportedJson(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      valid: false,
      error: 'Invalid backup file: Root structure must be a JSON object.',
    };
  }

  // Check schemaVersion if present
  if (
    parsed.schemaVersion !== undefined &&
    (typeof parsed.schemaVersion !== 'number' ||
      parsed.schemaVersion < 1 ||
      parsed.schemaVersion > BACKUP_SCHEMA_VERSION)
  ) {
    return {
      valid: false,
      error: `Unsupported backup schema version (${String(
        parsed.schemaVersion
      )}). Supported version is v${BACKUP_SCHEMA_VERSION}.`,
    };
  }

  // Support both root-level state and wrapped `{ data: state }` backups
  const payload =
    parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data)
      ? parsed.data
      : parsed;

  const hasCategories = Array.isArray(payload.categories);
  const hasOptions =
    payload.options &&
    typeof payload.options === 'object' &&
    !Array.isArray(payload.options);
  const hasFavorites = Array.isArray(payload.favorites);
  const hasHistory = Array.isArray(payload.history);

  if (!hasCategories || !hasOptions || !hasFavorites || !hasHistory) {
    return {
      valid: false,
      error:
        'Invalid Choosely backup schema: Missing required categories, options, favorites, or history fields.',
    };
  }

  // Validate categories items
  for (const cat of payload.categories) {
    if (!cat || typeof cat.name !== 'string' || !cat.name.trim()) {
      return {
        valid: false,
        error: 'Invalid category entry detected in backup file.',
      };
    }
  }

  // Validate options map entries
  for (const [catId, optList] of Object.entries(payload.options)) {
    if (!Array.isArray(optList)) {
      return {
        valid: false,
        error: `Invalid options list for category "${catId}" in backup file.`,
      };
    }
    for (const opt of optList) {
      if (!opt || typeof opt.name !== 'string' || !opt.name.trim()) {
        return {
          valid: false,
          error: 'Invalid option entry detected in backup file.',
        };
      }
    }
  }

  const normalized = normalizeAppState(payload);
  const totalOptionsCount = Object.values(normalized.options).reduce(
    (sum, list) => sum + list.length,
    0
  );

  return {
    valid: true,
    state: normalized,
    summary: {
      schemaVersion: parsed.schemaVersion || BACKUP_SCHEMA_VERSION,
      categoriesCount: normalized.categories.length,
      optionsCount: totalOptionsCount,
      favoritesCount: normalized.favorites.length,
      historyCount: normalized.history.length,
    },
  };
}

/**
 * Merges an imported normalized state into the current application state without losing existing data.
 */
export function mergeImportedState(currentState, importedState) {
  const mergedCategories = [...currentState.categories];
  const mergedOptions = { ...currentState.options };

  // Map category names (lowercase) to existing category IDs
  const catNameMap = {};
  mergedCategories.forEach((c) => {
    catNameMap[c.name.toLowerCase()] = c.id;
  });

  importedState.categories.forEach((impCat) => {
    const key = impCat.name.toLowerCase();
    const impCatOptions = importedState.options[impCat.id] || [];

    if (catNameMap[key]) {
      // Merge options into existing category
      const existingCatId = catNameMap[key];
      const existingOpts = [...(mergedOptions[existingCatId] || [])];
      const existingOptNames = new Set(
        existingOpts.map((o) => o.name.toLowerCase())
      );

      impCatOptions.forEach((opt, idx) => {
        if (!existingOptNames.has(opt.name.toLowerCase())) {
          existingOpts.push({
            id: `opt-${existingCatId}-${Date.now()}-${idx}`,
            name: opt.name,
            weight: opt.weight || 1,
          });
          existingOptNames.add(opt.name.toLowerCase());
        }
      });
      mergedOptions[existingCatId] = existingOpts;
    } else {
      // Add new category
      const newCatId = mergedCategories.some((c) => c.id === impCat.id)
        ? `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        : impCat.id;
      mergedCategories.push({ id: newCatId, name: impCat.name });
      catNameMap[key] = newCatId;
      mergedOptions[newCatId] = impCatOptions.map((opt, idx) => ({
        id: `opt-${newCatId}-${Date.now()}-${idx}`,
        name: opt.name,
        weight: opt.weight || 1,
      }));
    }
  });

  // Merge favorites without duplicates
  const mergedFavorites = [...currentState.favorites];
  importedState.favorites.forEach((impFav, idx) => {
    const exists = mergedFavorites.some(
      (f) =>
        f.categoryName.toLowerCase() === impFav.categoryName.toLowerCase() &&
        f.optionName.toLowerCase() === impFav.optionName.toLowerCase()
    );
    if (!exists) {
      mergedFavorites.push({
        ...impFav,
        id: `fav-${Date.now()}-${idx}`,
      });
    }
  });

  // Merge history without duplicate IDs
  const existingHistIds = new Set(currentState.history.map((h) => h.id));
  const mergedHistory = [...currentState.history];
  importedState.history.forEach((impHist, idx) => {
    if (!existingHistIds.has(impHist.id)) {
      mergedHistory.push({
        ...impHist,
        id: impHist.id || `hist-${Date.now()}-${idx}`,
      });
    }
  });

  return {
    categories: mergedCategories,
    options: mergedOptions,
    favorites: mergedFavorites,
    history: mergedHistory,
    settings: {
      ...currentState.settings,
      ...importedState.settings,
    },
  };
}

/**
 * Triggers browser download of application state as a formatted JSON file with schema metadata.
 */
export function exportAppStateToJson(state) {
  try {
    const exportPayload = {
      app: 'Choosely',
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      categories: state.categories || [],
      options: state.options || {},
      favorites: state.favorites || [],
      history: state.history || [],
      settings: {
        themeMode: state.settings?.themeMode || 'light',
        darkMode: Boolean(state.settings?.darkMode),
        animations:
          state.settings?.animations !== undefined
            ? Boolean(state.settings.animations)
            : true,
      },
    };

    const jsonStr = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const datePart = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.href = url;
    link.download = `choosely-backup-${datePart}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { ok: true, filename: `choosely-backup-${datePart}.json` };
  } catch (err) {
    console.error('Failed to export backup JSON:', err);
    return { ok: false, error: 'Failed to export backup file.' };
  }
}

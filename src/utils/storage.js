export const STORAGE_KEY = 'decision_generator_state';

export const DEFAULT_STATE = {
  categories: [
    { id: 'cat-1', name: 'Food' },
    { id: 'cat-2', name: 'Movies' },
    { id: 'cat-3', name: 'Travel' },
  ],
  options: {
    'cat-1': [
      { id: 'opt-1-1', name: 'Pizza', weight: 5 },
      { id: 'opt-1-2', name: 'Burger', weight: 2 },
      { id: 'opt-1-3', name: 'Dosa', weight: 1 },
      { id: 'opt-1-4', name: 'Biryani', weight: 4 },
    ],
    'cat-2': [
      { id: 'opt-2-1', name: 'Interstellar', weight: 1 },
      { id: 'opt-2-2', name: 'Avatar', weight: 1 },
      { id: 'opt-2-3', name: 'Inception', weight: 1 },
    ],
    'cat-3': [
      { id: 'opt-3-1', name: 'Goa', weight: 1 },
      { id: 'opt-3-2', name: 'Ooty', weight: 1 },
      { id: 'opt-3-3', name: 'Manali', weight: 1 },
    ],
  },
  favorites: [],
  history: [],
  settings: {
    darkMode: false,
    animations: true,
    themeMode: 'light', // 'light' | 'dark'
  },
};

export function cloneDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

export function normalizeAppState(raw) {
  if (!raw || typeof raw !== 'object') {
    return cloneDefaultState();
  }

  const categories = Array.isArray(raw.categories)
    ? raw.categories
        .filter((c) => c && typeof c.name === 'string' && c.name.trim() !== '')
        .map((c, idx) => ({
          id: String(c.id || `cat-${Date.now()}-${idx}`),
          name: c.name.trim(),
        }))
    : cloneDefaultState().categories;

  const rawOptions = raw.options && typeof raw.options === 'object' ? raw.options : {};
  const options = {};

  categories.forEach((cat) => {
    const list = Array.isArray(rawOptions[cat.id]) ? rawOptions[cat.id] : [];
    options[cat.id] = list
      .filter((o) => o && typeof o.name === 'string' && o.name.trim() !== '')
      .map((o, idx) => {
        const parsedWeight = parseInt(o.weight, 10);
        const safeWeight =
          !Number.isNaN(parsedWeight) && parsedWeight >= 1
            ? Math.min(100, parsedWeight)
            : 1;
        return {
          id: String(o.id || `opt-${cat.id}-${idx}-${Date.now()}`),
          name: o.name.trim(),
          weight: safeWeight,
        };
      });
  });

  const favorites = Array.isArray(raw.favorites)
    ? raw.favorites
        .filter(
          (f) =>
            f &&
            typeof f.categoryName === 'string' &&
            typeof f.optionName === 'string' &&
            f.optionName.trim() !== ''
        )
        .map((f, idx) => ({
          id: String(f.id || `fav-${Date.now()}-${idx}`),
          categoryName: f.categoryName.trim(),
          optionName: f.optionName.trim(),
          addedAt: f.addedAt || 'Saved',
        }))
    : [];

  const history = Array.isArray(raw.history)
    ? raw.history
        .filter(
          (h) =>
            h &&
            typeof h.categoryName === 'string' &&
            typeof h.optionName === 'string' &&
            h.optionName.trim() !== ''
        )
        .map((h, idx) => ({
          id: String(h.id || `hist-${Date.now()}-${idx}`),
          categoryName: h.categoryName.trim(),
          optionName: h.optionName.trim(),
          mode:
            typeof h.mode === 'string' && h.mode.trim()
              ? h.mode.trim()
              : 'Random Pick',
          date:
            typeof h.date === 'string' && h.date.trim()
              ? h.date.trim()
              : new Date().toISOString().split('T')[0],
          time:
            typeof h.time === 'string' && h.time.trim()
              ? h.time.trim()
              : '12:00',
        }))
    : [];

  const rawSettings =
    raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
  const themeMode =
    rawSettings.themeMode === 'dark' ||
    (rawSettings.themeMode !== 'light' && rawSettings.darkMode === true)
      ? 'dark'
      : 'light';
  const darkMode = themeMode === 'dark';
  const animations =
    rawSettings.animations !== undefined
      ? Boolean(rawSettings.animations)
      : true;

  return {
    categories,
    options,
    favorites,
    history,
    settings: {
      darkMode,
      animations,
      themeMode,
    },
  };
}

export function loadAppState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      const initial = cloneDefaultState();
      saveAppState(initial);
      return initial;
    }
    const parsed = JSON.parse(saved);
    return normalizeAppState(parsed);
  } catch (err) {
    console.error(
      'Error loading saved state from localStorage, falling back to default state:',
      err
    );
    const fallback = cloneDefaultState();
    saveAppState(fallback);
    return fallback;
  }
}

export function saveAppState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
    return false;
  }
}

export function clearAndResetAppState() {
  const fresh = cloneDefaultState();
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  } catch (err) {
    console.error('Error resetting localStorage:', err);
  }
  return fresh;
}

export function getStorageSizeKB(state) {
  try {
    const serialized = JSON.stringify(state || {});
    const bytes = new Blob([serialized]).size;
    return Math.max(0.1, Number((bytes / 1024).toFixed(1)));
  } catch {
    return 1.2;
  }
}

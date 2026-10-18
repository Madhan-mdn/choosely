import { useEffect } from 'react';

export function resolveAppliedTheme(themeMode) {
  return themeMode === 'dark' ? 'dark' : 'light';
}

/**
 * Synchronizes the selected theme preference ('light' or 'dark')
 * with the root <html> element's `data-theme` attribute and `.dark` class.
 */
export function useTheme(settings) {
  const rawMode = settings?.themeMode;
  const themeMode =
    rawMode === 'dark' || (rawMode !== 'light' && settings?.darkMode === true)
      ? 'dark'
      : 'light';

  const resolvedTheme = resolveAppliedTheme(themeMode);
  const isDark = resolvedTheme === 'dark';

  const animationsEnabled =
    settings?.animations !== undefined ? Boolean(settings.animations) : true;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute(
        'data-animations',
        animationsEnabled ? 'true' : 'false'
      );
    }
  }, [animationsEnabled]);

  return {
    themeMode,
    resolvedTheme,
    isDark,
  };
}

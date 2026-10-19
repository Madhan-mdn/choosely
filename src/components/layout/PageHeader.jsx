import React, { useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { ChooselyLogo } from '../ui/ChooselyLogo';
import { useAppState } from '../../context/AppStateContext';
import {
  DECISION_MODES,
  normalizeModeKey,
} from '../../utils/decisionAlgorithms';

const ROUTE_TITLES = {
  '/': 'Dashboard',
  '/generator': 'Generator',
  '/wheel': 'Interactive Arena',
  '/history': 'History',
  '/favorites': 'Saved Favorites',
  '/settings': 'Preferences',
};

export function PageHeader({ onOpenMobileMenu }) {
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  const {
    categories,
    optionsMap,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedMethod,
    globalSearchQuery,
    setGlobalSearchQuery,
    triggerDecision,
    showToast,
  } = useAppState();

  const currentPageBadge = ROUTE_TITLES[location.pathname] || 'Workspace';

  const activeCategory = useMemo(
    () =>
      categories.find((c) => c.id === selectedCategoryId) ||
      categories[0] ||
      null,
    [categories, selectedCategoryId]
  );

  const activeOptionsCount = useMemo(
    () => (activeCategory ? (optionsMap[activeCategory.id] || []).length : 0),
    [activeCategory, optionsMap]
  );

  const activeMethodMeta = useMemo(() => {
    const key = normalizeModeKey(selectedMethod);
    return DECISION_MODES[key] || DECISION_MODES.random;
  }, [selectedMethod]);

  // Determine whether the top header quick-run button should be shown:
  // - Hidden on /settings (irrelevant on settings page)
  // - Hidden on /, /generator, /wheel because those pages already have primary execution buttons
  // - Shown on /history and /favorites so users can run the active category/method without leaving
  const isConfigRoute = location.pathname === '/settings';
  const isConfigOrLegalRoute = isConfigRoute;
  const hasPagePrimaryRunButton = ['/', '/generator', '/wheel'].includes(
    location.pathname
  );
  const showHeaderQuickRun = !isConfigRoute && !hasPagePrimaryRunButton;

  // Support Ctrl+K / Cmd+K to focus global search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleQuickRunEngine = () => {
    if (!activeCategory) {
      showToast(
        'Please create or select a category in the Generator first.',
        'error'
      );
      navigate('/generator');
      return;
    }
    if (activeOptionsCount === 0) {
      showToast(
        `"${activeCategory.name}" has no options yet. Add options in the Generator to run a decision.`,
        'error'
      );
      navigate('/generator');
      return;
    }
    const res = triggerDecision({
      categoryId: activeCategory.id,
      mode: activeMethodMeta.id,
      openModal: true,
    });
    if (!res.ok && res.error) {
      showToast(res.error, 'error');
    }
  };

  const handleCategoryTabClick = (catId) => {
    setSelectedCategoryId(catId);
    if (location.pathname !== '/generator' && location.pathname !== '/wheel') {
      navigate('/generator');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 lg:h-[58px] px-4 lg:px-6 hairline-b bg-surface/95 backdrop-blur-md flex items-center justify-between shrink-0">
      {/* Mobile / Tablet Left: Hamburger + Brand + Active Page Badge */}
      <div className="flex lg:hidden items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open menu"
          className="p-1.5 -ml-1.5 rounded-lg text-secondary hover:bg-surface-container hover:text-primary active:scale-[0.98] transition-all cursor-pointer"
        >
          <Icon name="menu" size={21} />
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 font-headline-sm text-headline-sm font-bold text-primary tracking-tight cursor-pointer"
          >
            <ChooselyLogo size={26} decorative />
            <span>Choosely</span>
          </button>
          <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container-high text-secondary border border-outline-variant/30">
            {currentPageBadge}
          </span>
        </div>
      </div>

      {/* Mobile / Tablet Right: Quick Category Switcher */}
      <div className="flex lg:hidden items-center gap-1.5">
        {categories.length > 0 && !isConfigOrLegalRoute && (
          <div className="relative hidden sm:block">
            <select
              aria-label="Active Category"
              value={activeCategory?.id || ''}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="h-8 pl-2.5 pr-7 rounded-lg hairline-border bg-surface-container-lowest text-on-surface font-label-sm text-label-sm appearance-none cursor-pointer focus:outline-none focus:border-primary-container"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-secondary">
              <Icon name="unfold_more" size={14} />
            </span>
          </div>
        )}
      </div>

      {/* Desktop Left: Global Search Input + Category Filter Tabs */}
      <div className="hidden lg:flex items-center gap-6 flex-1 min-w-0">
        <div className="relative w-80 max-w-sm shrink-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">
            <Icon name="search" size={16} />
          </span>
          <input
            ref={searchInputRef}
            type="text"
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            placeholder="Search choices, categories, or history..."
            className="w-full h-[36px] pl-9 pr-14 py-1.5 bg-surface-container-lowest hairline-border rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
          />
          {globalSearchQuery ? (
            <button
              type="button"
              onClick={() => setGlobalSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface p-0.5 cursor-pointer"
            >
              <Icon name="close" size={14} />
            </button>
          ) : (
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 font-label-sm text-[10px] text-secondary bg-surface-container rounded hairline-border font-mono pointer-events-none">
              ⌘K
            </kbd>
          )}
        </div>

        {/* Desktop Category Shortcuts */}
        {!isConfigOrLegalRoute && (
          <nav
            aria-label="Category Shortcuts"
            className="hidden xl:flex items-center gap-4 overflow-x-auto no-scrollbar"
          >
            <button
              type="button"
              onClick={() => navigate('/generator')}
              className={`font-label-md text-label-md pb-0.5 transition-colors shrink-0 cursor-pointer ${
                location.pathname === '/'
                  ? 'text-primary font-semibold border-b-2 border-primary'
                  : 'text-secondary hover:text-on-surface'
              }`}
            >
              All Categories
            </button>
            {categories.slice(0, 5).map((cat) => {
              const isSelected =
                activeCategory?.id === cat.id && location.pathname !== '/';
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryTabClick(cat.id)}
                  className={`font-label-md text-label-md pb-0.5 transition-colors shrink-0 cursor-pointer max-w-[140px] truncate ${
                    isSelected
                      ? 'text-primary font-semibold border-b-2 border-primary'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* Desktop Right: Contextual Active Selection Status or Quick-Run Action */}
      <div className="hidden lg:flex items-center gap-2.5 shrink-0">
        {!isConfigOrLegalRoute && activeCategory && hasPagePrimaryRunButton && (
          <div
            className="h-[32px] px-3 rounded-lg bg-surface-container-low hairline-border flex items-center gap-2 text-xs text-secondary"
            title={`Active selection: ${activeCategory.name} (${activeOptionsCount} options) using ${activeMethodMeta.label}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container shrink-0" />
            <span className="font-semibold text-on-surface truncate max-w-[120px]">
              {activeCategory.name}
            </span>
            <span className="text-outline-variant">•</span>
            <Icon name={activeMethodMeta.icon} size={13} className="text-primary" />
            <span className="font-medium text-secondary">
              {activeMethodMeta.shortLabel}
            </span>
          </div>
        )}

        {showHeaderQuickRun && (
          <button
            type="button"
            onClick={handleQuickRunEngine}
            title={
              !activeCategory
                ? 'Select or create a category in Generator first'
                : activeOptionsCount === 0
                ? `Add at least one option to "${activeCategory.name}" to run a decision`
                : `Run ${activeMethodMeta.label} on "${activeCategory.name}" (${activeOptionsCount} options)`
            }
            className={`h-[32px] px-3.5 rounded-lg font-label-md text-label-md font-semibold transition-colors flex items-center gap-1.5 cursor-pointer active:scale-[0.98] shadow-sm ${
              !activeCategory || activeOptionsCount === 0
                ? 'bg-surface-container text-secondary hairline-border hover:text-on-surface'
                : 'bg-primary-container text-on-primary hover:bg-primary-hover'
            }`}
          >
            <Icon name="play_arrow" size={15} />
            <span>
              {activeCategory
                ? `Run ${activeMethodMeta.shortLabel}: ${activeCategory.name}`
                : 'Run Decision'}
            </span>
          </button>
        )}

      </div>
    </header>
  );
}

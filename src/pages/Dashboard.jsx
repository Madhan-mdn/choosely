import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, getCategoryIconName } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { EmptyState } from '../components/ui/EmptyState';
import {
  DECISION_MODES,
  calculateOptionPercentage,
  normalizeModeKey,
} from '../utils/decisionAlgorithms';
import { useAppState } from '../context/AppStateContext';

const METHOD_OPTIONS = [
  DECISION_MODES.random,
  DECISION_MODES.weighted,
  DECISION_MODES.spin,
  DECISION_MODES.elimination,
];

export function Dashboard() {
  const navigate = useNavigate();
  const {
    categories,
    optionsMap,
    favorites,
    history,
    storageSizeKB,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedMethod,
    setSelectedMethod,
    globalSearchQuery,
    updateOption,
    equalizeCategoryWeights,
    triggerDecision,
    isOptionFavorited,
    toggleFavorite,
    openExistingResultInModal,
    showToast,
  } = useAppState();

  // Categories that have at least one option (for Quick Decision)
  const nonEmptyCategories = useMemo(
    () => categories.filter((c) => (optionsMap[c.id] || []).length > 0),
    [categories, optionsMap]
  );

  const activeCategory = useMemo(() => {
    const found = categories.find((c) => c.id === selectedCategoryId);
    if (found) return found;
    return nonEmptyCategories[0] || categories[0] || null;
  }, [categories, nonEmptyCategories, selectedCategoryId]);

  const activeOptions = useMemo(
    () => (activeCategory ? optionsMap[activeCategory.id] || [] : []),
    [activeCategory, optionsMap]
  );

  // Derived Dashboard Statistics
  const stats = useMemo(() => {
    const totalDecisions = history.length;
    const totalCategories = categories.length;
    const totalFavorites = favorites.length;

    // Weekly decisions (last 7 days)
    const nowMs = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    let weeklyCount = 0;
    const categoryCounts = {};
    const optionCounts = {};

    categories.forEach((cat) => {
      categoryCounts[cat.name] = 0;
    });

    history.forEach((item) => {
      const itemMs = new Date(item.date).getTime();
      if (!Number.isNaN(itemMs) && nowMs - itemMs <= sevenDaysMs) {
        weeklyCount++;
      }
      categoryCounts[item.categoryName] =
        (categoryCounts[item.categoryName] || 0) + 1;
      const optKey = `${item.categoryName} > ${item.optionName}`;
      optionCounts[optKey] = (optionCounts[optKey] || 0) + 1;
    });

    let favoriteCategory = 'None yet';
    let maxCatCount = 0;
    Object.entries(categoryCounts).forEach(([catName, count]) => {
      if (count > maxCatCount) {
        maxCatCount = count;
        favoriteCategory = catName;
      }
    });

    let mostSelectedOption = 'None yet';
    let maxOptCount = 0;
    Object.entries(optionCounts).forEach(([key, count]) => {
      if (count > maxOptCount) {
        maxOptCount = count;
        const optName = key.split(' > ')[1];
        mostSelectedOption = `${optName} (${count})`;
      }
    });

    const topOptions = Object.entries(optionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      totalDecisions,
      totalCategories,
      totalFavorites,
      weeklyCount,
      favoriteCategory,
      mostSelectedOption,
      categoryCounts,
      topOptions,
    };
  }, [history, categories, favorites]);

  // Recent decisions (newest first, filtered by global search if active, max 5)
  const recentDecisions = useMemo(() => {
    const reversed = [...history].reverse();
    if (!globalSearchQuery.trim()) {
      return reversed.slice(0, 5);
    }
    const q = globalSearchQuery.toLowerCase();
    return reversed
      .filter(
        (h) =>
          h.optionName.toLowerCase().includes(q) ||
          h.categoryName.toLowerCase().includes(q) ||
          h.mode.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [history, globalSearchQuery]);

  const handleMakeDecision = () => {
    if (!activeCategory) {
      showToast('Please create a category first.', 'error');
      navigate('/generator');
      return;
    }
    const res = triggerDecision({
      categoryId: activeCategory.id,
      mode: selectedMethod,
      openModal: true,
    });
    if (!res.ok && res.error) {
      showToast(res.error, 'error');
    }
  };

  const handleExportCsv = () => {
    if (history.length === 0) {
      showToast('No decision history to export yet.', 'error');
      return;
    }
    const header = 'Date,Time,Category,Method,Selected Option\n';
    const rows = history
      .map(
        (h) =>
          `"${h.date}","${h.time}","${h.categoryName.replace(/"/g, '""')}","${
            h.mode
          }","${h.optionName.replace(/"/g, '""')}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `choosely_history_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Decision history exported to CSV.');
  };

  return (
    <div className="flex flex-col gap-7">
      {/* Dashboard Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 hairline-b pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
            What are we deciding today?
          </h1>
          <p className="font-body-md text-body-md text-secondary max-w-2xl">
            Choose a category, select your options, and find clarity without second-guessing.
          </p>
        </div>

        {/* Active Preset Category Chips */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-label-sm text-label-sm text-secondary mr-1">
              Active Presets:
            </span>
            {categories.map((cat) => {
              const isSelected = activeCategory?.id === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-2.5 py-1 rounded-lg font-label-sm text-label-sm flex items-center gap-1.5 cursor-pointer transition-colors ${
                    isSelected
                      ? 'accent-soft-bg text-primary-container border border-primary-container/30 font-semibold'
                      : 'bg-surface-container-low text-secondary hairline-border hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                  )}
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 2-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* LEFT COLUMN: Quick Decision Engine & Category Insights (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Quick Decision Engine Card */}
          <section className="bg-surface-container-lowest rounded-xl hairline-border p-5 sm:p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between hairline-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
                  <Icon name="tune" size={17} />
                </div>
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Quick Decision Engine
                  </h2>
                  <p className="font-body-sm text-body-sm text-secondary">
                    Tune attributes and contender weight ratios
                  </p>
                </div>
              </div>
              {activeCategory && activeOptions.length > 1 && (
                <button
                  type="button"
                  onClick={() => equalizeCategoryWeights(activeCategory.id)}
                  className="text-secondary hover:text-on-surface font-label-sm text-label-sm flex items-center gap-1 transition-colors cursor-pointer"
                  title="Equalize option weights"
                >
                  <Icon name="restart_alt" size={15} />
                  <span>Equalize</span>
                </button>
              )}
            </div>

            {/* Category Selector Dropdown */}
            <Select
              id="dashboard-category-select"
              label="Target Category"
              rightLabel={`${activeOptions.length} options`}
              value={activeCategory?.id || ''}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              options={categories.map((cat) => ({
                value: cat.id,
                label: `${cat.name} (${(optionsMap[cat.id] || []).length} options)`,
              }))}
              placeholder={
                categories.length === 0 ? 'No categories available' : undefined
              }
            />

            {/* Resolution Method Segmented Control */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface font-medium">
                  Resolution Method
                </span>
                <span className="font-label-sm text-label-sm text-secondary">
                  4 modes
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-container-low rounded-lg hairline-border text-center">
                {METHOD_OPTIONS.map((m) => {
                  const isSelected = normalizeModeKey(selectedMethod) === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethod(m.id)}
                      className={`py-1.5 px-2 rounded-md font-label-md text-label-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-surface-container-lowest hairline-border text-primary font-semibold shadow-xs'
                          : 'text-secondary hover:text-on-surface font-medium'
                      }`}
                    >
                      <Icon name={m.icon} size={14} />
                      <span>{m.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Contenders Preview with Interactive Weight Sliders */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md text-on-surface font-medium">
                  Active Contenders ({activeOptions.length})
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/generator')}
                  className="font-label-sm text-label-sm text-primary-container hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Icon name="add" size={14} />
                  <span>Manage Options</span>
                </button>
              </div>

              {activeOptions.length === 0 ? (
                <div className="p-4 rounded-lg bg-surface hairline-border text-center space-y-2">
                  <p className="font-body-sm text-body-sm text-secondary">
                    No options configured in this category yet.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/generator')}
                  >
                    Add Options in Generator
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto pr-0.5">
                  {activeOptions.slice(0, 5).map((opt, idx) => {
                    const pct = calculateOptionPercentage(opt, activeOptions);
                    const dotColors = [
                      'bg-primary-container',
                      'bg-[#376757]',
                      'bg-secondary',
                    ];
                    return (
                      <div
                        key={opt.id}
                        className="p-3 bg-surface rounded-lg hairline-border flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                dotColors[idx % dotColors.length]
                              }`}
                            ></span>
                            <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                              {opt.name}
                            </span>
                          </div>
                          <span className="font-label-md text-label-md font-mono text-primary font-bold tabular-nums">
                            {pct}%
                          </span>
                        </div>
                        <div className="w-full accent-soft-bg h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-primary-container h-full rounded-full transition-all duration-200"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                        {selectedMethod === 'weighted' && activeCategory && (
                          <div className="pt-1 flex items-center gap-2">
                            <input
                              type="range"
                              min="1"
                              max="20"
                              aria-label={`Adjust weight for ${opt.name}`}
                              value={Math.min(20, parseInt(opt.weight, 10) || 1)}
                              onChange={(e) =>
                                updateOption(activeCategory.id, opt.id, {
                                  weight: parseInt(e.target.value, 10) || 1,
                                })
                              }
                              className="w-full editorial-range h-1"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Primary Execution Button */}
            <div className="flex flex-col gap-2 pt-1">
              <Button
                variant="primary"
                size="lg"
                className="w-full h-[42px]"
                onClick={handleMakeDecision}
                disabled={!activeCategory || activeOptions.length === 0}
              >
                <Icon name="play_arrow" size={18} />
                <span>Make a decision</span>
              </Button>
            </div>
          </section>

          {/* Category Insights & Most Selected Progress Bars */}
          <section className="bg-surface-container-lowest rounded-xl hairline-border p-5 space-y-4">
            <div className="flex items-center justify-between hairline-b pb-3">
              <div className="flex items-center gap-2">
                <Icon name="insights" size={18} className="text-primary-container" />
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Category & Contender Insights
                </h2>
              </div>
              <span className="font-label-sm text-label-sm text-secondary">
                Top Picks
              </span>
            </div>

            {/* Category Decision Distribution Bars */}
            {categories.length > 0 && (
              <div className="space-y-2.5">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold block">
                  Decisions by Category
                </span>
                <div className="space-y-2">
                  {categories.map((cat) => {
                    const count = stats.categoryCounts[cat.name] || 0;
                    const maxCat = Math.max(
                      1,
                      ...Object.values(stats.categoryCounts)
                    );
                    const barPct = Math.round((count / maxCat) * 100);
                    return (
                      <div key={cat.id} className="space-y-1">
                        <div className="flex items-center justify-between font-label-sm text-label-sm">
                          <span className="text-on-surface font-medium">
                            {cat.name}
                          </span>
                          <span className="text-secondary font-mono tabular-nums">
                            {count} {count === 1 ? 'decision' : 'decisions'}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-container rounded-full transition-all duration-300"
                            style={{ width: `${barPct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Most Selected Options Progress Bars */}
            {stats.topOptions.length > 0 && (
              <div className="pt-2 hairline-t space-y-2">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold block">
                  Most Selected Contenders
                </span>
                {stats.topOptions.map(([key, count]) => {
                  const maxOpt = stats.topOptions[0][1] || 1;
                  const pct = Math.round((count / maxOpt) * 100);
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between font-label-sm text-label-sm">
                        <span className="text-on-surface font-medium truncate pr-2">
                          {key}
                        </span>
                        <span className="text-primary font-mono font-semibold tabular-nums shrink-0">
                          {count} {count === 1 ? 'pick' : 'picks'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 accent-soft-bg rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-container rounded-full"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: Analytics, Recent Resolutions & Categories Overview (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Key Metrics Row (4 Cards) */}
          <section
            aria-label="Key Statistics"
            className="grid grid-cols-2 sm:grid-cols-4 gap-3.5"
          >
            <div className="bg-surface-container-lowest rounded-lg hairline-border p-4 flex flex-col justify-between h-28">
              <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold tracking-wider">
                Total Decisions
              </span>
              <div className="flex items-baseline justify-between gap-1">
                <span
                  id="dashTotalDecisions"
                  className="font-headline-lg text-headline-lg font-bold text-on-surface tabular-nums"
                >
                  {stats.totalDecisions}
                </span>
                <span className="font-label-sm text-[11px] text-primary-container accent-soft-bg px-1.5 py-0.5 rounded font-mono tabular-nums">
                  {stats.weeklyCount} this wk
                </span>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-lg hairline-border p-4 flex flex-col justify-between h-28">
              <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold tracking-wider">
                Saved Favorites
              </span>
              <div className="flex items-baseline justify-between gap-1">
                <span
                  id="dashSavedFavorites"
                  className="font-headline-lg text-headline-lg font-bold text-on-surface tabular-nums"
                >
                  {stats.totalFavorites}
                </span>
                <Link
                  to="/favorites"
                  className="font-label-sm text-[11px] text-primary hover:underline font-mono"
                >
                  View list
                </Link>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-lg hairline-border p-4 flex flex-col justify-between h-28">
              <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold tracking-wider">
                Active Categories
              </span>
              <div className="flex items-baseline justify-between gap-1">
                <span
                  id="dashTotalCategories"
                  className="font-headline-lg text-headline-lg font-bold text-on-surface tabular-nums"
                >
                  {stats.totalCategories}
                </span>
                <span
                  id="dashFavCategory"
                  className="font-label-sm text-[11px] text-secondary truncate max-w-[90px]"
                  title={`Top Category: ${stats.favoriteCategory}`}
                >
                  Top: {stats.favoriteCategory}
                </span>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-lg hairline-border p-4 flex flex-col justify-between h-28">
              <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold tracking-wider">
                Most Selected
              </span>
              <div className="flex flex-col justify-end">
                <span
                  id="dashMostSelectedOption"
                  className="font-headline-sm text-headline-sm font-bold text-on-surface truncate"
                  title={stats.mostSelectedOption}
                >
                  {stats.mostSelectedOption}
                </span>
                <span className="font-label-sm text-[11px] text-secondary font-mono mt-0.5">
                  Storage: ~{storageSizeKB} KB
                </span>
              </div>
            </div>
          </section>

          {/* Recent Decisions Table Card */}
          <section className="bg-surface-container-lowest rounded-xl hairline-border flex flex-col overflow-hidden">
            <div className="p-5 hairline-b flex items-center justify-between gap-2">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Recent Decisions
                </h2>
                <p className="font-body-sm text-body-sm text-secondary">
                  Historical outcomes cataloged in local storage
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="h-8 px-2.5 bg-surface-container-low hairline-border rounded-lg font-label-md text-label-md text-secondary hover:text-on-surface flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Icon name="download" size={14} />
                  <span>CSV</span>
                </button>
                <Link
                  to="/history"
                  className="h-8 px-2.5 bg-surface-container-low hairline-border rounded-lg font-label-md text-label-md text-primary font-semibold hover:bg-surface-container flex items-center gap-1 transition-colors"
                >
                  <span>View archive</span>
                  <Icon name="chevron_right" size={15} />
                </Link>
              </div>
            </div>

            {recentDecisions.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="font-body-md text-body-sm text-secondary">
                  No recent decisions found. Use the Quick Decision Engine to make your first call.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low font-label-sm text-label-sm text-secondary uppercase tracking-wider hairline-b">
                      <th className="py-2.5 px-4 font-semibold">
                        Resolved Contender
                      </th>
                      <th className="py-2.5 px-3 font-semibold">Category</th>
                      <th className="py-2.5 px-3 font-semibold">Method</th>
                      <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                      <th className="py-2.5 px-4 font-semibold text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container font-body-sm text-body-sm">
                    {recentDecisions.map((item, idx) => {
                      const fav = isOptionFavorited(
                        item.categoryName,
                        item.optionName
                      );
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-surface-container-low/50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  idx === 0
                                    ? 'bg-primary-container'
                                    : 'bg-secondary'
                                }`}
                              ></span>
                              <button
                                type="button"
                                onClick={() => openExistingResultInModal(item)}
                                className="font-label-md text-label-md text-on-surface font-semibold hover:text-primary hover:underline text-left cursor-pointer"
                              >
                                {item.optionName}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-lg bg-surface-container hairline-border font-label-sm text-[11px] text-on-surface-variant whitespace-nowrap">
                              {item.categoryName}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-secondary font-label-sm text-label-sm whitespace-nowrap">
                            {item.mode}
                          </td>
                          <td className="py-3 px-3 text-secondary font-mono text-[12px] whitespace-nowrap tabular-nums">
                            {item.date} • {item.time}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openExistingResultInModal(item)}
                                title="Inspect Decision Result"
                                aria-label={`Inspect ${item.optionName}`}
                                className="p-1 text-secondary hover:text-on-surface hover:bg-surface-container rounded transition-colors cursor-pointer"
                              >
                                <Icon name="casino" size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  toggleFavorite(
                                    item.categoryName,
                                    item.optionName
                                  )
                                }
                                title={
                                  fav
                                    ? 'Remove from Favorites'
                                    : 'Save to Favorites'
                                }
                                aria-label={
                                  fav
                                    ? `Remove ${item.optionName} from favorites`
                                    : `Save ${item.optionName} to favorites`
                                }
                                className={`p-1 rounded transition-colors cursor-pointer ${
                                  fav
                                    ? 'text-primary-container hover:bg-surface-container'
                                    : 'text-secondary hover:text-primary-container hover:bg-surface-container'
                                }`}
                              >
                                <Icon name="star" size={16} filled={fav} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p-3 bg-surface hairline-t flex items-center justify-between text-secondary">
              <span className="font-label-sm text-label-sm tabular-nums">
                Showing {recentDecisions.length} of {history.length} resolutions
              </span>
              <Link
                to="/history"
                className="font-label-sm text-label-sm text-primary hover:underline font-semibold"
              >
                Full History Log →
              </Link>
            </div>
          </section>

          {/* Categories Overview Cards */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
                Categories Overview
              </h2>
              <button
                type="button"
                onClick={() => navigate('/generator')}
                className="font-label-md text-label-md text-primary hover:underline font-semibold cursor-pointer"
              >
                Configure
              </button>
            </div>

            {categories.length === 0 ? (
              <EmptyState
                icon="folder"
                title="No Categories Configured"
                description="Create your first category in the Decision Generator to start organizing options."
                actionLabel="Open Generator"
                onAction={() => navigate('/generator')}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {categories.map((cat) => {
                  const count = (optionsMap[cat.id] || []).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        navigate('/generator');
                      }}
                      className="p-3.5 bg-surface-container-lowest hairline-border rounded-lg flex items-center justify-between hover:border-primary/50 transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-md bg-surface-container-low flex items-center justify-center text-primary-container shrink-0 group-hover:accent-soft-bg transition-colors">
                          <Icon name={getCategoryIconName(cat.name)} size={18} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-body-md text-body-md font-semibold text-on-surface truncate">
                            {cat.name}
                          </h3>
                          <span className="font-label-sm text-label-sm text-secondary tabular-nums block">
                            {count} active {count === 1 ? 'option' : 'options'}
                          </span>
                        </div>
                      </div>
                      <Icon
                        name="arrow_forward"
                        size={16}
                        className="text-outline-variant group-hover:text-primary transition-colors shrink-0 ml-2"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Local Storage Architecture Summary Banner */}
          <section className="p-4 rounded-lg bg-surface-container-lowest hairline-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg accent-soft-bg text-primary-container flex items-center justify-center shrink-0">
                <Icon name="verified" size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface font-semibold">
                  Zero Telemetry • 100% Client-Side
                </span>
                <span className="font-body-sm text-body-sm text-secondary">
                  All categories, weights, favorites, and history stay in your browser's LocalStorage.
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import {
  DECISION_MODES,
  normalizeModeKey,
  getModeDisplayLabel,
} from '../utils/decisionAlgorithms';

const METHOD_FILTERS = [
  { id: 'all', label: 'All Methods' },
  { id: 'random', label: 'Random' },
  { id: 'weighted', label: 'Weighted' },
  { id: 'spin', label: 'Wheel' },
  { id: 'elimination', label: 'Elimination' },
];

export function History() {
  const navigate = useNavigate();
  const {
    categories,
    history,
    globalSearchQuery,
    deleteHistoryItem,
    clearAllHistory,
    isOptionFavorited,
    toggleFavorite,
    setSelectedCategoryId,
    setSelectedMethod,
    openExistingResultInModal,
    showToast,
  } = useAppState();

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [clearModalOpen, setClearModalOpen] = useState(false);

  // Sync with top bar global search when updated
  useEffect(() => {
    if (globalSearchQuery !== undefined) {
      setSearchQuery(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  // Distinct category names from both categories and historical logs
  const availableCategories = useMemo(() => {
    const set = new Set(categories.map((c) => c.name));
    history.forEach((h) => {
      if (h.categoryName) set.add(h.categoryName);
    });
    return Array.from(set);
  }, [categories, history]);

  // Filtered and sorted history items
  const filteredHistory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = history.filter((item) => {
      const optName = (item.optionName || '').toLowerCase();
      const catName = (item.categoryName || '').toLowerCase();
      const modeKey = normalizeModeKey(item.mode);

      const matchesQuery =
        !query ||
        optName.includes(query) ||
        catName.includes(query) ||
        (item.mode && item.mode.toLowerCase().includes(query));

      const matchesMethod = methodFilter === 'all' || modeKey === methodFilter;
      const matchesCategory =
        categoryFilter === 'all' || item.categoryName === categoryFilter;

      return matchesQuery && matchesMethod && matchesCategory;
    });

    // Reverse chronological by default (newest appended last in history array)
    const indexed = filtered.map((item, idx) => ({ item, idx }));
    indexed.sort((a, b) => {
      const dtA = new Date(`${a.item.date || ''}T${a.item.time || '00:00'}`).getTime();
      const dtB = new Date(`${b.item.date || ''}T${b.item.time || '00:00'}`).getTime();
      if (!Number.isNaN(dtA) && !Number.isNaN(dtB) && dtA !== dtB) {
        return sortOrder === 'newest' ? dtB - dtA : dtA - dtB;
      }
      return sortOrder === 'newest' ? b.idx - a.idx : a.idx - b.idx;
    });

    return indexed.map((entry) => entry.item);
  }, [history, searchQuery, methodFilter, categoryFilter, sortOrder]);

  const handleDecideAgain = (item) => {
    const matchingCategory = categories.find(
      (c) => c.name.toLowerCase() === (item.categoryName || '').toLowerCase()
    );
    const modeKey = normalizeModeKey(item.mode);
    if (matchingCategory) {
      setSelectedCategoryId(matchingCategory.id);
    }
    setSelectedMethod(modeKey);
    showToast(
      `Loaded "${item.categoryName}" (${getModeDisplayLabel(modeKey)}) in Studio`
    );
    if (modeKey === 'spin' || modeKey === 'elimination') {
      navigate('/wheel');
    } else {
      navigate('/generator');
    }
  };

  return (
    <div className="space-y-7 pb-10">
      {/* Page Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 hairline-b">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary-container block mb-1">
            Historical Ledger
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
            Decision History
          </h1>
          <p className="text-sm text-secondary mt-1">
            Audit past outcomes, inspect selection methodologies, or re-run any decision scenario.
          </p>
        </div>
        {history.length > 0 && (
          <Button
            variant="danger"
            size="md"
            icon="delete_sweep"
            onClick={() => setClearModalOpen(true)}
          >
            Clear History
          </Button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Icon
              name="search"
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search past decisions or categories..."
              aria-label="Search past decisions or categories"
              className="w-full h-11 pl-10 pr-9 bg-surface-container-lowest hairline border rounded-lg text-sm text-on-surface placeholder:text-secondary/60 focus:outline-none focus:border-primary-container transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface"
                aria-label="Clear search"
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </div>

          {/* Category Scope & Sort Selectors */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <div className="relative min-w-[180px] flex-1 sm:flex-initial">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by category"
                className="w-full h-11 pl-3.5 pr-9 appearance-none bg-surface-container-lowest hairline border rounded-lg text-sm font-medium text-on-surface focus:outline-none focus:border-primary-container cursor-pointer"
              >
                <option value="all">Category: All</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <Icon
                name="expand_more"
                size={18}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary"
              />
            </div>

            <div className="relative min-w-[155px] flex-1 sm:flex-initial">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                aria-label="Sort history"
                className="w-full h-11 pl-3.5 pr-9 appearance-none bg-surface-container-lowest hairline border rounded-lg text-sm font-medium text-on-surface focus:outline-none focus:border-primary-container cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <Icon
                name="expand_more"
                size={18}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary"
              />
            </div>
          </div>
        </div>

        {/* Method Filter Pills */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {METHOD_FILTERS.map((m) => {
              const active = methodFilter === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethodFilter(m.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-primary-container text-on-primary shadow-sm'
                      : 'bg-surface-container-lowest text-secondary hairline border hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          <span className="text-xs font-semibold text-secondary">
            Showing {filteredHistory.length} of {history.length}{' '}
            {history.length === 1 ? 'record' : 'records'}
          </span>
        </div>
      </section>

      {/* Main Ledger */}
      {history.length === 0 ? (
        <EmptyState
          icon="history"
          title="No decisions recorded yet"
          description="Once you generate decisions using Random Pick, Weighted Decision, Spin Wheel, or Elimination Mode, your full audit trail will appear here."
          actionLabel="Make Your First Decision"
          onAction={() => navigate('/generator')}
        />
      ) : filteredHistory.length === 0 ? (
        <EmptyState
          icon="search"
          title="No matching history records"
          description="Try clearing your search query or adjusting the category and method filters."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearchQuery('');
            setMethodFilter('all');
            setCategoryFilter('all');
          }}
        />
      ) : (
        <div className="bg-surface-container-lowest hairline border rounded-xl overflow-hidden shadow-sm">
          {/* Desktop Table Header */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3.5 bg-surface-container-low hairline-b text-[10px] font-bold uppercase tracking-widest text-secondary">
            <div className="col-span-4">Selected Outcome</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Methodology</div>
            <div className="col-span-2">Date & Time</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Ledger Rows */}
          <div className="divide-y divide-outline-variant/30">
            {filteredHistory.map((item) => {
              const modeKey = normalizeModeKey(item.mode);
              const modeMeta = DECISION_MODES[modeKey] || DECISION_MODES.random;
              const favorited = isOptionFavorited(
                item.categoryName,
                item.optionName
              );

              return (
                <div
                  key={item.id}
                  className="p-4 sm:px-6 sm:py-4 hover:bg-surface-container-low/50 transition-colors flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 md:items-center"
                >
                  {/* Selected Outcome */}
                  <div className="md:col-span-4 flex items-center justify-between md:justify-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => openExistingResultInModal(item)}
                      title="Inspect resolution details"
                      className="w-9 h-9 rounded-lg bg-primary-fixed/40 text-primary-container flex items-center justify-center shrink-0 cursor-pointer hover:bg-primary-fixed/70 transition-colors"
                    >
                      <Icon name={modeMeta.icon} size={18} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => openExistingResultInModal(item)}
                        className="text-sm font-bold text-on-surface hover:text-primary-container truncate block text-left cursor-pointer"
                      >
                        {item.optionName}
                      </button>
                      <p className="text-[11px] text-secondary md:hidden">
                        {item.categoryName} · {item.date} {item.time}
                      </p>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="hidden md:flex md:col-span-2 items-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-surface-container text-on-surface truncate max-w-full">
                      {item.categoryName}
                    </span>
                  </div>

                  {/* Methodology Badge */}
                  <div className="hidden md:flex md:col-span-2 items-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-primary-fixed/30 text-primary-container">
                      <Icon name={modeMeta.icon} size={13} />
                      {modeMeta.shortLabel}
                    </span>
                  </div>

                  {/* Timestamp */}
                  <div className="hidden md:block md:col-span-2 text-xs text-secondary font-medium">
                    <span>{item.date}</span>
                    {item.time && (
                      <span className="text-secondary/70 ml-1.5">{item.time}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-2 flex items-center justify-end gap-1.5 pt-2 md:pt-0 hairline-t md:border-t-0">
                    <button
                      type="button"
                      onClick={() =>
                        toggleFavorite(item.categoryName, item.optionName)
                      }
                      title={
                        favorited ? 'Remove from Favorites' : 'Save to Favorites'
                      }
                      aria-label={
                        favorited ? 'Remove from Favorites' : 'Save to Favorites'
                      }
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        favorited
                          ? 'text-amber-500 bg-amber-500/10'
                          : 'text-secondary hover:bg-surface-container hover:text-on-surface'
                      }`}
                    >
                      <Icon name={favorited ? 'star' : 'star_outline'} size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDecideAgain(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary-container hover:bg-primary-fixed/30 transition-colors cursor-pointer"
                      title="Open category and method in Decision Generator"
                    >
                      <Icon name="replay" size={14} />
                      <span>Decide Again</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteHistoryItem(item.id)}
                      title="Delete record"
                      aria-label={`Delete history record for ${item.optionName}`}
                      className="p-2 rounded-lg text-secondary hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer"
                    >
                      <Icon name="delete" size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clear History Confirmation Modal */}
      <Modal
        isOpen={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
        title="Clear Decision History"
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setClearModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                clearAllHistory();
                setClearModalOpen(false);
              }}
            >
              Clear All ({history.length})
            </Button>
          </>
        }
      >
        <p className="text-sm text-secondary leading-relaxed">
          Are you sure you want to permanently clear all{' '}
          <strong className="text-on-surface">{history.length}</strong> recorded
          decisions from your history? Your categories and saved favorites will
          not be affected.
        </p>
      </Modal>
    </div>
  );
}

export default History;

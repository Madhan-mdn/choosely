import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { Icon, getCategoryIconName } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

export function Favorites() {
  const navigate = useNavigate();
  const {
    categories,
    optionsMap,
    favorites,
    history,
    globalSearchQuery,
    removeFavorite,
    setSelectedCategoryId,
    addCategory,
    addOption,
    triggerDecision,
    showToast,
  } = useAppState();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (globalSearchQuery !== undefined) {
      setSearchQuery(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  // Category chips with counts derived from favorites
  const categoryCounts = useMemo(() => {
    const counts = { all: favorites.length };
    favorites.forEach((fav) => {
      const cat = fav.categoryName || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [favorites]);

  const categoryTabs = useMemo(() => {
    return Object.keys(categoryCounts);
  }, [categoryCounts]);

  // Count how many times each favorite option was chosen in history
  const winCountMap = useMemo(() => {
    const map = {};
    history.forEach((h) => {
      const key = `${(h.optionName || '').toLowerCase()}::${(
        h.categoryName || ''
      ).toLowerCase()}`;
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [history]);

  const filteredFavorites = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return favorites.filter((fav) => {
      const cat = fav.categoryName || 'General';
      const opt = fav.optionName || '';
      const matchesCat =
        selectedCategory === 'all' || cat === selectedCategory;
      const matchesSearch =
        !q ||
        opt.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [favorites, selectedCategory, searchQuery]);

  const handleUseInDecision = (fav) => {
    const existingCat = categories.find(
      (c) =>
        c.name.toLowerCase() === (fav.categoryName || '').toLowerCase()
    );

    if (existingCat) {
      const currentOpts = optionsMap[existingCat.id] || [];
      const hasOpt = currentOpts.some(
        (o) => o.name.toLowerCase() === (fav.optionName || '').toLowerCase()
      );
      if (!hasOpt) {
        addOption(existingCat.id, fav.optionName, 1);
      }
      setSelectedCategoryId(existingCat.id);
      showToast(`Opened "${existingCat.name}" in Decision Generator`);
      navigate('/generator');
    } else {
      const created = addCategory(fav.categoryName || 'Saved Favorites');
      if (created.ok && created.category) {
        addOption(created.category.id, fav.optionName, 1);
        setSelectedCategoryId(created.category.id);
      }
      navigate('/generator');
    }
  };

  // Run an immediate decision across the currently filtered (or all) favorites
  const handleDecideFromFavorites = () => {
    const pool =
      filteredFavorites.length >= 1 ? filteredFavorites : favorites;
    if (pool.length === 0) {
      showToast('No favorite options available to run a decision.', 'error');
      return;
    }

    const customOptions = pool.map((fav, idx) => ({
      id: `fav-opt-${fav.id || idx}`,
      name: `${fav.optionName} (${fav.categoryName})`,
      weight: 1,
    }));

    const label =
      selectedCategory !== 'all'
        ? `Favorites • ${selectedCategory}`
        : 'Favorites Collection';

    triggerDecision({
      categoryId: 'favorites-pool',
      categoryNameOverride: label,
      mode: 'random',
      customOptions,
      openModal: true,
    });
  };

  return (
    <div className="space-y-7 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 hairline-b">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary-container block mb-1">
            Curated Shortlist
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
            Saved Favorites
          </h1>
          <p className="text-sm text-secondary mt-1">
            Your bookmarked high-conviction options across every category, ready for rapid re-selection.
          </p>
        </div>

        {favorites.length > 0 && (
          <Button
            variant="primary"
            size="md"
            icon="bolt"
            onClick={handleDecideFromFavorites}
          >
            Use in New Decision ({filteredFavorites.length || favorites.length})
          </Button>
        )}
      </div>

      {favorites.length > 0 ? (
        <>
          {/* Search & Category Chips */}
          <section className="space-y-4">
            <div className="relative">
              <Icon
                name="search"
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved choices..."
                aria-label="Search saved choices"
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

            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {categoryTabs.map((cat) => {
                const isActive = selectedCategory === cat;
                const label = cat === 'all' ? 'All Categories' : cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-primary-container text-on-primary shadow-sm'
                        : 'bg-surface-container-lowest text-secondary hairline border hover:bg-surface-container-low hover:text-on-surface'
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-surface-container text-secondary'
                      }`}
                    >
                      {categoryCounts[cat]}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Favorites Grid */}
          {filteredFavorites.length === 0 ? (
            <EmptyState
              icon="search"
              title="No matching favorites"
              description="No saved favorites match your current search or category filter."
              actionLabel="Reset Filters"
              onAction={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFavorites.map((fav) => {
                const key = `${(fav.optionName || '').toLowerCase()}::${(
                  fav.categoryName || ''
                ).toLowerCase()}`;
                const chosenCount = winCountMap[key] || 0;
                const catIcon = getCategoryIconName(fav.categoryName);

                return (
                  <article
                    key={fav.id}
                    className="bg-surface-container-lowest hairline border rounded-xl p-5 flex flex-col justify-between gap-4 shadow-sm hover:border-primary-container/50 transition-all group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-surface-container text-secondary">
                          <Icon name={catIcon} size={13} />
                          {fav.categoryName || 'General'}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeFavorite(fav.id)}
                          title="Remove from Favorites"
                          aria-label={`Remove ${fav.optionName} from favorites`}
                          className="p-1.5 rounded-lg text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 transition-colors cursor-pointer"
                        >
                          <Icon name="star" size={16} />
                        </button>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-on-surface tracking-tight leading-snug">
                          {fav.optionName}
                        </h3>
                        <p className="text-xs text-secondary mt-1 flex items-center gap-2">
                          <span>
                            {chosenCount === 0
                              ? 'Not selected yet'
                              : `Chosen ${chosenCount} ${
                                  chosenCount === 1 ? 'time' : 'times'
                                }`}
                          </span>
                          {fav.addedAt && (
                            <>
                              <span>·</span>
                              <span>Added {fav.addedAt}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 hairline-t flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleUseInDecision(fav)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-container hover:underline cursor-pointer"
                      >
                        <span>Use in Decision</span>
                        <Icon name="arrow_forward" size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeFavorite(fav.id)}
                        className="text-xs font-medium text-secondary hover:text-error transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Create Decision from Favorites CTA Card */}
          <section className="bg-primary-container text-on-primary rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-md">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary-fixed">
                <Icon name="auto_awesome" size={14} />
                <span>Custom Shortlist Pool</span>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-white">
                Create a Decision from Your Saved Favorites
              </h2>
              <p className="text-xs sm:text-sm text-primary-fixed/90 leading-relaxed">
                Combine your currently filtered favorites into an instant decision pool and let Choosely select a winner right now.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDecideFromFavorites}
              className="px-5 py-3 rounded-lg bg-white text-primary-container font-bold text-xs sm:text-sm inline-flex items-center gap-2 hover:bg-primary-fixed transition-colors shrink-0 cursor-pointer shadow-sm"
            >
              <Icon name="play_arrow" size={18} />
              <span>Decide From Favorites</span>
            </button>
          </section>
        </>
      ) : (
        <EmptyState
          icon="star"
          title="No favorite choices saved yet"
          description="Star winning results in the Decision Concluded modal or bookmark options from your Decision History to curate your personal shortlist."
          actionLabel="Open Decision Generator"
          onAction={() => navigate('/generator')}
        />
      )}
    </div>
  );
}

export default Favorites;

import React, { useState } from 'react';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { calculateOptionPercentage } from '../../utils/decisionAlgorithms';
import { useAppState } from '../../context/AppStateContext';

/**
 * OptionEditor component for adding, searching, editing, deleting,
 * and weighting options within the active category.
 */
export function OptionEditor({ categoryId, showWeightsAlways = true }) {
  const {
    categories,
    optionsMap,
    selectedMethod,
    addOption,
    updateOption,
    deleteOption,
    equalizeCategoryWeights,
  } = useAppState();

  const [newOptionName, setNewOptionName] = useState('');
  const [addError, setAddError] = useState('');
  const [optionSearch, setOptionSearch] = useState('');

  // Modal state for editing an option
  const [editingOption, setEditingOption] = useState(null);
  const [editOptionName, setEditOptionName] = useState('');
  const [editOptionWeight, setEditOptionWeight] = useState(1);
  const [editError, setEditError] = useState('');

  const category = categories.find((c) => c.id === categoryId);
  const options = categoryId ? optionsMap[categoryId] || [] : [];

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(optionSearch.toLowerCase())
  );

  // Determine the highest weight to highlight top-weighted contenders
  const maxWeight =
    options.length > 0
      ? Math.max(...options.map((o) => parseInt(o.weight, 10) || 1))
      : 1;
  const hasDistinctWeights =
    options.some((o) => (parseInt(o.weight, 10) || 1) !== maxWeight);

  const isWeightedActive = selectedMethod === 'weighted' || showWeightsAlways;

  const handleAddOption = (e) => {
    e.preventDefault();
    if (!categoryId) {
      setAddError('Please select or create a category first.');
      return;
    }
    const res = addOption(categoryId, newOptionName, 1);
    if (!res.ok) {
      setAddError(res.error);
      return;
    }
    setNewOptionName('');
    setAddError('');
  };

  const openEditOptionModal = (opt) => {
    setEditingOption(opt);
    setEditOptionName(opt.name);
    setEditOptionWeight(opt.weight || 1);
    setEditError('');
  };

  const handleSaveOptionEdit = (e) => {
    e.preventDefault();
    if (!editingOption || !categoryId) return;
    const res = updateOption(categoryId, editingOption.id, {
      name: editOptionName,
      weight: editOptionWeight,
    });
    if (!res.ok) {
      setEditError(res.error);
      return;
    }
    setEditingOption(null);
  };

  if (!category) {
    return (
      <div className="bg-surface-container-lowest rounded-xl hairline-border p-8 text-center space-y-2">
        <div className="w-10 h-10 mx-auto rounded-lg bg-surface-container-low flex items-center justify-center text-secondary">
          <Icon name="folder" size={20} />
        </div>
        <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
          Select or Create a Category
        </h3>
        <p className="font-body-sm text-body-sm text-secondary max-w-md mx-auto">
          Choose an existing category or create a new one to configure contender options and generate decisions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Quick Add Option Form */}
      <form
        onSubmit={handleAddOption}
        className="bg-surface-container-lowest p-3 rounded-lg hairline-border"
      >
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline/70 pointer-events-none">
              <Icon name="edit_note" size={18} />
            </span>
            <input
              type="text"
              value={newOptionName}
              onChange={(e) => {
                setNewOptionName(e.target.value);
                if (addError) setAddError('');
              }}
              placeholder={`Add new option to ${category.name}, e.g. Coastal Hike...`}
              aria-label="New option name"
              className="w-full h-[38px] pl-9 pr-3 bg-surface text-on-surface font-body-sm text-body-sm rounded-lg hairline-border focus:border-primary-container focus:ring-1 focus:ring-primary-container focus:outline-none placeholder:text-outline/70 transition-colors"
            />
          </div>
          <Button type="submit" variant="primary" size="md" className="shrink-0">
            <Icon name="add" size={16} />
            <span>Add</span>
          </Button>
        </div>
        {addError && (
          <p role="alert" className="font-label-sm text-label-sm text-error mt-2 px-1">
            {addError}
          </p>
        )}
      </form>

      {/* Filter / Counter / Equalize Weights Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-1.5 text-secondary shrink-0">
            <Icon name="filter_list" size={15} />
            <span className="font-label-sm text-label-sm tabular-nums">
              {options.length} active {options.length === 1 ? 'option' : 'options'}
            </span>
          </div>

          {options.length > 2 && (
            <div className="relative max-w-[200px] flex-1">
              <input
                type="text"
                value={optionSearch}
                onChange={(e) => setOptionSearch(e.target.value)}
                placeholder="Filter options..."
                aria-label="Search options"
                className="w-full h-7 px-2.5 bg-surface-container-lowest hairline-border rounded-md font-label-sm text-label-sm text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary-container"
              />
            </div>
          )}
        </div>

        {options.length > 1 && (
          <button
            type="button"
            onClick={() => equalizeCategoryWeights(category.id)}
            className="font-label-sm text-label-sm text-primary hover:underline flex items-center gap-1 cursor-pointer self-end sm:self-auto"
          >
            <Icon name="balance" size={14} />
            <span>Equalize Weights</span>
          </button>
        )}
      </div>

      {/* Participating Options List */}
      {filteredOptions.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-lg hairline-border p-6 text-center font-body-sm text-body-sm text-secondary">
          {options.length === 0
            ? `No options in "${category.name}" yet. Add your first contender above.`
            : 'No options match your search filter.'}
        </div>
      ) : (
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
          {filteredOptions.map((opt, index) => {
            const pct = calculateOptionPercentage(opt, options);
            const weightVal = parseInt(opt.weight, 10) || 1;
            const isPrimaryContender =
              hasDistinctWeights && weightVal === maxWeight;

            // Tonal dot opacity progression
            const dotOpacities = [
              'bg-primary-container',
              'bg-primary-container/80',
              'bg-primary-container/60',
              'bg-primary-container/45',
            ];
            const dotClass = dotOpacities[index % dotOpacities.length];

            return (
              <div
                key={opt.id}
                className="bg-surface-container-lowest p-3.5 rounded-lg hairline-border hover:border-outline-variant transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`}
                      ></span>
                      <h3 className="font-label-md text-label-md font-semibold text-on-surface break-words">
                        {opt.name}
                      </h3>
                      {isPrimaryContender && (
                        <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container text-secondary">
                          Primary
                        </span>
                      )}
                    </div>

                    {/* Probability Progress Bar & Weight Controls */}
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="flex-1 bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-primary-container h-full rounded-full transition-all duration-200"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <span className="font-label-sm text-label-sm font-mono font-semibold text-primary-container w-10 text-right tabular-nums">
                        {pct}%
                      </span>
                    </div>

                    {isWeightedActive && (
                      <div className="mt-2 pt-1.5 flex items-center gap-3">
                        <label
                          htmlFor={`weight-slider-${opt.id}`}
                          className="font-label-sm text-[11px] text-secondary shrink-0"
                        >
                          Weight:
                        </label>
                        <input
                          id={`weight-slider-${opt.id}`}
                          type="range"
                          min="1"
                          max="20"
                          value={Math.min(20, weightVal)}
                          onChange={(e) =>
                            updateOption(category.id, opt.id, {
                              weight: parseInt(e.target.value, 10) || 1,
                            })
                          }
                          className="flex-1 editorial-range h-1"
                        />
                        <input
                          type="number"
                          min="1"
                          max="100"
                          aria-label={`Weight for ${opt.name}`}
                          value={weightVal}
                          onChange={(e) =>
                            updateOption(category.id, opt.id, {
                              weight: parseInt(e.target.value, 10) || 1,
                            })
                          }
                          className="w-14 h-7 px-1.5 text-center bg-surface hairline-border rounded font-mono font-label-sm text-label-sm text-on-surface tabular-nums focus:outline-none focus:border-primary-container"
                        />
                      </div>
                    )}
                  </div>

                  {/* Option Edit & Delete Actions */}
                  <div className="flex items-center gap-0.5 ml-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditOptionModal(opt)}
                      aria-label={`Edit ${opt.name}`}
                      title={`Edit ${opt.name}`}
                      className="p-1.5 rounded text-secondary hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      <Icon name="edit" size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteOption(category.id, opt.id)}
                      aria-label={`Delete ${opt.name}`}
                      title={`Delete ${opt.name}`}
                      className="p-1.5 rounded text-secondary hover:text-error hover:bg-error-container/25 transition-colors cursor-pointer"
                    >
                      <Icon name="delete" size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Option Modal */}
      <Modal
        isOpen={Boolean(editingOption)}
        onClose={() => setEditingOption(null)}
        title="Edit Option"
      >
        <form onSubmit={handleSaveOptionEdit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="edit-option-name-input"
              className="block font-label-md text-label-md text-on-surface font-medium"
            >
              Option Name
            </label>
            <input
              id="edit-option-name-input"
              type="text"
              value={editOptionName}
              onChange={(e) => {
                setEditOptionName(e.target.value);
                if (editError) setEditError('');
              }}
              className="w-full h-10 px-3 bg-surface-container-lowest hairline-border rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="edit-option-weight-input"
              className="block font-label-md text-label-md text-on-surface font-medium"
            >
              Relative Weight (1 - 100)
            </label>
            <input
              id="edit-option-weight-input"
              type="number"
              min="1"
              max="100"
              value={editOptionWeight}
              onChange={(e) => setEditOptionWeight(e.target.value)}
              className="w-full h-10 px-3 bg-surface-container-lowest hairline-border rounded-lg font-body-md text-body-md text-on-surface tabular-nums focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
            />
          </div>

          {editError && (
            <p role="alert" className="font-label-sm text-label-sm text-error">
              {editError}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingOption(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

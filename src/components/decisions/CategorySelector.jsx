import React, { useState } from 'react';
import { Icon, getCategoryIconName } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useAppState } from '../../context/AppStateContext';

/**
 * CategorySelector & Management component.
 * Provides both:
 * 1. Horizontal Category Pill Bar
 * 2. Full Category Sidebar Panel with Search, Create, Rename, and Delete modals.
 */
export function CategorySelector({ variant = 'panel' }) {
  const {
    categories,
    optionsMap,
    selectedCategoryId,
    setSelectedCategoryId,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useAppState();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [formError, setFormError] = useState('');

  // Confirmation modal for deleting a category
  const [deleteConfirmCat, setDeleteConfirmCat] = useState(null);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const openAddModal = () => {
    setModalMode('add');
    setEditingCategoryId(null);
    setCategoryNameInput('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    if (!cat) return;
    setModalMode('edit');
    setEditingCategoryId(cat.id);
    setCategoryNameInput(cat.name);
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (modalMode === 'add') {
      const res = addCategory(categoryNameInput);
      if (!res.ok) {
        setFormError(res.error);
        return;
      }
    } else if (editingCategoryId) {
      const res = updateCategory(editingCategoryId, categoryNameInput);
      if (!res.ok) {
        setFormError(res.error);
        return;
      }
    }
    setModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmCat) {
      deleteCategory(deleteConfirmCat.id);
      setDeleteConfirmCat(null);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (variant === 'pills') {
    const activeOptionCount = selectedCategoryId
      ? (optionsMap[selectedCategoryId] || []).length
      : 0;

    return (
      <>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">
              Active Workspace
            </span>
            <div className="flex items-center gap-3">
              <span className="font-label-sm text-label-sm text-secondary tabular-nums">
                {activeOptionCount}{' '}
                {activeOptionCount === 1 ? 'Option' : 'Options'} Listed
              </span>
              {selectedCategory && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(selectedCategory)}
                    title={`Rename ${selectedCategory.name}`}
                    className="p-1 rounded text-secondary hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    <Icon name="edit" size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmCat(selectedCategory)}
                    title={`Delete ${selectedCategory.name}`}
                    className="p-1 rounded text-secondary hover:text-error hover:bg-error-container/25 transition-colors cursor-pointer"
                  >
                    <Icon name="delete" size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {categories.map((cat) => {
              const isSelected = cat.id === selectedCategoryId;
              const count = (optionsMap[cat.id] || []).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-label-md shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                      : 'bg-surface-container-lowest text-secondary hairline-border hover:text-on-surface hover:bg-surface-container-low font-medium'
                  }`}
                >
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed"></span>
                  )}
                  <span>{cat.name}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full tabular-nums ${
                      isSelected
                        ? 'bg-primary/40 text-on-primary'
                        : 'bg-surface-container text-secondary'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-outline-variant text-primary font-label-md text-label-md font-medium hover:bg-surface-container shrink-0 cursor-pointer transition-colors"
            >
              <Icon name="add" size={15} />
              <span>New Category</span>
            </button>
          </div>
        </div>

        {renderCategoryModals()}
      </>
    );
  }

  function renderCategoryModals() {
    return (
      <>
        {/* Add / Edit Category Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={modalMode === 'edit' ? 'Edit Category Name' : 'Add New Category'}
        >
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="category-name-modal-input"
                className="block font-label-md text-label-md text-on-surface font-medium"
              >
                Category Name
              </label>
              <input
                id="category-name-modal-input"
                type="text"
                value={categoryNameInput}
                onChange={(e) => {
                  setCategoryNameInput(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="e.g., Food, Movies, Travel, Weekend Plans..."
                className="w-full h-10 px-3 bg-surface-container-lowest hairline-border rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
              />
              {formError && (
                <p role="alert" className="font-label-sm text-label-sm text-error">
                  {formError}
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Category
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Category Confirmation Modal */}
        <Modal
          isOpen={Boolean(deleteConfirmCat)}
          onClose={() => setDeleteConfirmCat(null)}
          title="Delete Category"
        >
          <div className="space-y-4">
            <p className="font-body-md text-body-md text-secondary">
              Are you sure you want to delete the{' '}
              <strong className="text-on-surface font-semibold">
                "{deleteConfirmCat?.name}"
              </strong>{' '}
              category and all of its configured options? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeleteConfirmCat(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="dangerSolid"
                onClick={handleConfirmDelete}
              >
                <Icon name="delete" size={16} />
                <span>Delete Category</span>
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <>
      <div className="bg-surface-container-lowest rounded-xl hairline-border p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between hairline-b pb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-surface-container-low flex items-center justify-center text-primary-container">
              <Icon name="folder" size={16} />
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Categories
              </h2>
              <p className="font-label-sm text-label-sm text-secondary">
                {categories.length} active domains
              </p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={openAddModal}>
            <Icon name="add" size={14} />
            <span>Add New</span>
          </Button>
        </div>

        {/* Category Search Input */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">
            <Icon name="search" size={15} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            aria-label="Search categories"
            className="w-full h-9 pl-8 pr-7 bg-surface hairline-border rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear category search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface cursor-pointer"
            >
              <Icon name="close" size={14} />
            </button>
          )}
        </div>

        {/* Categories List */}
        {filteredCategories.length === 0 ? (
          <div className="py-6 text-center font-body-sm text-body-sm text-secondary">
            No matching categories found.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-[340px] overflow-y-auto pr-0.5">
            {filteredCategories.map((cat) => {
              const isSelected = cat.id === selectedCategoryId;
              const count = (optionsMap[cat.id] || []).length;
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedCategoryId(cat.id);
                    }
                  }}
                  className={`group px-3 py-2.5 rounded-lg flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'accent-soft-bg text-primary font-semibold border border-primary-container/30'
                      : 'bg-surface hover:bg-surface-container-low text-on-surface hairline-border'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      name={getCategoryIconName(cat.name)}
                      size={16}
                      className={
                        isSelected ? 'text-primary-container' : 'text-secondary'
                      }
                    />
                    <span className="font-label-md text-label-md truncate">
                      {cat.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full tabular-nums ${
                        isSelected
                          ? 'bg-primary-container text-on-primary'
                          : 'bg-surface-container-high text-secondary'
                      }`}
                    >
                      {count}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(cat);
                      }}
                      aria-label={`Edit ${cat.name}`}
                      title="Edit Category"
                      className="p-1 rounded text-secondary hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      <Icon name="edit" size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmCat(cat);
                      }}
                      aria-label={`Delete ${cat.name}`}
                      title="Delete Category"
                      className="p-1 rounded text-secondary hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer"
                    >
                      <Icon name="delete" size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {renderCategoryModals()}
    </>
  );
}

import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { BACKUP_SCHEMA_VERSION } from '../utils/exportImport';

const THEME_OPTIONS = [
  {
    id: 'light',
    label: 'Light Mode',
    icon: 'light_mode',
    desc: 'Warm paper & forest green palette',
  },
  {
    id: 'dark',
    label: 'Dark Mode',
    icon: 'dark_mode',
    desc: 'Charcoal & soft sage palette',
  },
];

export function Settings() {
  const {
    categories,
    optionsMap,
    favorites,
    history,
    settings,
    themeMode,
    storageSizeKB,
    setThemeMode,
    setAnimationsEnabled,
    exportData,
    validateBackupJsonString,
    applyValidatedImport,
    resetAllData,
  } = useAppState();

  const fileInputRef = useRef(null);
  const [importMode, setImportMode] = useState('merge'); // 'merge' | 'overwrite'
  const [importStatus, setImportStatus] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Confirmation modal states
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [pendingOverwrite, setPendingOverwrite] = useState(null); // { filename, state, summary }

  const totalOptionsCount = useMemo(() => {
    return Object.values(optionsMap || {}).reduce(
      (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
      0
    );
  }, [optionsMap]);

  const handleFileProcess = (file) => {
    if (!file || isProcessing) return;
    setIsProcessing(true);
    setImportStatus({
      type: 'loading',
      message: `Validating "${file.name}"...`,
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      const validation = validateBackupJsonString(String(text || ''));
      setIsProcessing(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (!validation.ok) {
        setImportStatus({
          type: 'error',
          message: validation.error || 'Failed to validate JSON backup file.',
        });
        return;
      }

      // If Replace / Overwrite mode is selected, require confirmation before replacing user data
      if (importMode === 'overwrite') {
        setPendingOverwrite({
          filename: file.name,
          state: validation.state,
          summary: validation.summary,
        });
        setImportStatus({
          type: 'info',
          message: `Validated "${file.name}". Please confirm replacement in the dialog.`,
        });
      } else {
        const res = applyValidatedImport(validation.state, 'merge');
        if (res.ok) {
          setImportStatus({
            type: 'success',
            message: `Successfully merged "${file.name}" (${validation.summary.categoriesCount} categories, ${validation.summary.optionsCount} options, ${validation.summary.favoritesCount} favorites, ${validation.summary.historyCount} history records).`,
          });
        }
      }
    };

    reader.onerror = () => {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setImportStatus({
        type: 'error',
        message: 'Could not read the selected file. Please try again.',
      });
    };

    reader.readAsText(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleConfirmOverwriteImport = () => {
    if (!pendingOverwrite || isProcessing) return;
    setIsProcessing(true);
    const { filename, state: validatedState, summary } = pendingOverwrite;
    const res = applyValidatedImport(validatedState, 'overwrite');
    setPendingOverwrite(null);
    setIsProcessing(false);

    if (res.ok) {
      setImportStatus({
        type: 'success',
        message: `Restored "${filename}" and replaced workspace data (${summary.categoriesCount} categories, ${summary.optionsCount} options, ${summary.favoritesCount} favorites, ${summary.historyCount} history records).`,
      });
    } else {
      setImportStatus({
        type: 'error',
        message: res.error || 'Failed to restore backup.',
      });
    }
  };

  const handleCancelOverwriteImport = () => {
    setPendingOverwrite(null);
    setImportStatus({
      type: 'info',
      message: 'Import cancelled. Your existing workspace data was not modified.',
    });
  };

  const handleConfirmResetAllData = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const res = resetAllData();
    setResetModalOpen(false);
    setPendingOverwrite(null);
    setImportStatus(null);
    setIsProcessing(false);
    return res;
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      {/* Page Header */}
      <div className="pb-5 hairline-b">
        <span className="text-[11px] font-bold uppercase tracking-widest text-primary-container block mb-1">
          Workspace Configuration
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
          Settings & Data
        </h1>
        <p className="text-sm text-secondary mt-1">
          Customize visual appearance, motion behavior, and manage local browser storage backups.
        </p>
      </div>

      {/* Section 1: Appearance & Motion Preferences */}
      <section className="bg-surface-container-lowest hairline-border rounded-xl p-6 space-y-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 hairline-b pb-4">
          <div>
            <h2 className="text-base font-bold text-on-surface">
              Appearance & Motion
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Select your preferred workspace color scheme and animation behavior.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-surface-container text-secondary">
            <Icon name="palette" size={13} />
            Active: {themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </div>

        {/* Theme Switcher Grid (Light Mode & Dark Mode) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-secondary">
              Interface Theme
            </label>
            <span className="text-xs text-secondary">
              Selected:{' '}
              <strong className="text-on-surface">
                {themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </strong>
            </span>
          </div>

          <div
            role="radiogroup"
            aria-label="Interface Theme"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {THEME_OPTIONS.map((opt) => {
              const active = themeMode === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setThemeMode(opt.id)}
                  className={`flex items-center justify-between gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    active
                      ? 'border-primary-container accent-soft-bg text-on-surface ring-1 ring-primary-container shadow-xs'
                      : 'hairline-border bg-surface-container-low/50 text-secondary hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        active
                          ? 'bg-primary-container text-on-primary'
                          : 'bg-surface-container text-secondary'
                      }`}
                    >
                      <Icon name={opt.icon} size={19} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">
                        {opt.label}
                      </p>
                      <p className="text-xs text-secondary truncate mt-0.5">
                        {opt.desc}
                      </p>
                    </div>
                  </div>
                  {active && (
                    <span className="text-primary shrink-0">
                      <Icon name="check_circle" size={18} filled={true} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Studio Animations & Transitions Toggle */}
        <div className="pt-4 hairline-t flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-on-surface">
                Studio Animations & Transitions
              </p>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  settings.animations
                    ? 'bg-primary-fixed text-on-primary-fixed'
                    : 'bg-surface-container text-secondary'
                }`}
              >
                {settings.animations ? 'Enabled' : 'Instant Mode'}
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Enable spin-wheel rotation physics, progressive elimination round transitions, and modal motion. Disable to display selected outcomes immediately.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-label="Studio Animations & Transitions"
            aria-checked={Boolean(settings.animations)}
            onClick={() => setAnimationsEnabled(!settings.animations)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
              settings.animations
                ? 'bg-primary-container'
                : 'bg-surface-container-highest'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-150 ease-in-out ${
                settings.animations ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Section 2: Local Storage Telemetry & Privacy Notice */}
      <section className="bg-surface-container-lowest hairline-border rounded-xl p-6 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 hairline-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0">
              <Icon name="shield" size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">
                Client-Side LocalStorage Architecture
              </h2>
              <p className="text-xs text-secondary">
                100% of your decision data stays inside this browser under key{' '}
                <code className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface text-[11px] font-mono">
                  decision_generator_state
                </code>
                .
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-fixed text-on-primary-fixed shrink-0">
            <Icon name="database" size={14} />
            {storageSizeKB} KB used
          </span>
        </div>

        {/* Live Telemetry Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-lg bg-surface-container-low/60 hairline-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">
              Categories
            </p>
            <p className="text-xl font-extrabold text-on-surface mt-1 tabular-nums">
              {categories.length}
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-surface-container-low/60 hairline-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">
              Total Options
            </p>
            <p className="text-xl font-extrabold text-on-surface mt-1 tabular-nums">
              {totalOptionsCount}
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-surface-container-low/60 hairline-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">
              Favorites
            </p>
            <p className="text-xl font-extrabold text-on-surface mt-1 tabular-nums">
              {favorites.length}
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-surface-container-low/60 hairline-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">
              History Logs
            </p>
            <p className="text-xl font-extrabold text-on-surface mt-1 tabular-nums">
              {history.length}
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Data Portability (Export & Import) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <section className="bg-surface-container-lowest hairline-border rounded-xl p-6 flex flex-col justify-between gap-6 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-surface-container text-primary-container flex items-center justify-center">
                <Icon name="download" size={20} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
                Schema v{BACKUP_SCHEMA_VERSION}
              </span>
            </div>
            <h3 className="text-base font-bold text-on-surface">
              Export Data Backup
            </h3>
            <p className="text-xs text-secondary leading-relaxed">
              Download a human-readable JSON snapshot (<code className="font-mono">choosely-backup-YYYY-MM-DD.json</code>) containing all categories, option weights, saved favorites, decision history, and preferences.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            icon="download"
            onClick={exportData}
            className="w-full"
          >
            Download JSON Snapshot
          </Button>
        </section>

        {/* Import Card */}
        <section className="bg-surface-container-lowest hairline-border rounded-xl p-6 flex flex-col justify-between gap-5 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-surface-container text-primary-container flex items-center justify-center">
                <Icon name="upload_file" size={20} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">
                JSON Schema v{BACKUP_SCHEMA_VERSION}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-on-surface">
                Import & Restore Backup
              </h3>
              <p className="text-xs text-secondary mt-1 leading-relaxed">
                Restore a previously exported Choosely JSON file. Choose whether to merge with your current workspace or replace it.
              </p>
            </div>

            {/* Merge vs Overwrite Strategy Selector */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-surface-container">
                <button
                  type="button"
                  onClick={() => setImportMode('merge')}
                  className={`py-1.5 px-3 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    importMode === 'merge'
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm hairline-border'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  Merge Data
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('overwrite')}
                  className={`py-1.5 px-3 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    importMode === 'overwrite'
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm hairline-border'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                >
                  Replace Current Data
                </button>
              </div>
              <p className="text-[11px] text-secondary">
                {importMode === 'merge'
                  ? 'Merge adds imported categories, options, favorites, and history without deleting your current items.'
                  : 'Replace overwrites all current categories, options, favorites, and history (confirmation required).'}
              </p>
            </div>

            {/* Dropzone / File Trigger */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-primary-container accent-soft-bg'
                  : 'border-outline-variant hover:border-primary-container bg-surface-container-low/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Upload JSON backup file"
              />
              <p className="text-xs font-bold text-on-surface">
                Click to select a <code className="font-mono">.json</code> file or drag & drop here
              </p>
              <p className="text-[11px] text-secondary mt-0.5">
                Active strategy:{' '}
                <strong className="text-on-surface">
                  {importMode === 'merge'
                    ? 'Non-destructive merge'
                    : 'Replace existing workspace'}
                </strong>
              </p>
            </div>

            {importStatus && (
              <div
                role={importStatus.type === 'error' ? 'alert' : 'status'}
                className={`p-3 rounded-lg text-xs font-medium flex items-start gap-2 ${
                  importStatus.type === 'error'
                    ? 'bg-error-container/50 text-on-error-container border border-error/30'
                    : importStatus.type === 'success'
                    ? 'bg-primary-fixed text-on-primary-fixed border border-primary-container/30'
                    : 'bg-surface-container text-on-surface hairline-border'
                }`}
              >
                <Icon
                  name={
                    importStatus.type === 'error'
                      ? 'warning'
                      : importStatus.type === 'success'
                      ? 'check_circle'
                      : 'info'
                  }
                  size={15}
                  className="shrink-0 mt-0.5"
                />
                <span>{importStatus.message}</span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Section 4: Danger Zone */}
      <section className="bg-error-container/20 border border-error/35 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-error">
            <Icon name="warning" size={15} />
            <span>Danger Zone</span>
          </div>
          <h3 className="text-base font-bold text-on-surface">
            Reset Application Data
          </h3>
          <p className="text-xs text-secondary max-w-xl">
            Remove all custom categories and options, clear all saved favorites and decision history, and restore default preferences and starter categories (Food, Movies, Travel).
          </p>
        </div>

        <Button
          variant="danger"
          size="md"
          icon="restart_alt"
          onClick={() => setResetModalOpen(true)}
          className="shrink-0"
        >
          Reset All Data
        </Button>
      </section>

      {/* Legal & Documentation Links */}
      <footer className="pt-4 hairline-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-secondary">
        <p>Choosely · Client-Side React + Vite Architecture</p>
        <div className="flex items-center gap-6 font-semibold">
          <Link
            to="/privacy"
            className="hover:text-primary transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            className="hover:text-primary transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </footer>

      {/* Reset All Data Confirmation Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset All Application Data?"
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setResetModalOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="dangerSolid"
              icon="restart_alt"
              onClick={handleConfirmResetAllData}
              disabled={isProcessing}
            >
              Confirm Reset All Data
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-secondary leading-relaxed">
          <p>
            Confirming this reset will immediately and permanently remove your current workspace data from this browser:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>
              <strong className="text-on-surface">Categories & Options:</strong>{' '}
              Removes all custom categories and options, restoring only the 3 default starter categories (<em>Food</em>, <em>Movies</em>, <em>Travel</em>).
            </li>
            <li>
              <strong className="text-on-surface">Saved Favorites:</strong>{' '}
              Deletes all <strong className="text-on-surface">{favorites.length}</strong> saved favorites.
            </li>
            <li>
              <strong className="text-on-surface">Decision History:</strong>{' '}
              Clears all <strong className="text-on-surface">{history.length}</strong> recorded decisions.
            </li>
            <li>
              <strong className="text-on-surface">Preferences:</strong>{' '}
              Resets theme mode to <strong className="text-on-surface">Light</strong> and <strong className="text-on-surface">Studio Animations</strong> to enabled.
            </li>
          </ul>
          <p className="text-xs">
            This action cannot be undone unless you have exported a JSON backup file.
          </p>
        </div>
      </Modal>

      {/* Replace / Overwrite Import Confirmation Modal */}
      <Modal
        isOpen={Boolean(pendingOverwrite)}
        onClose={handleCancelOverwriteImport}
        title="Replace Existing Data with Backup?"
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={handleCancelOverwriteImport}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="dangerSolid"
              icon="upload_file"
              onClick={handleConfirmOverwriteImport}
              disabled={isProcessing}
            >
              Replace Current Data
            </Button>
          </>
        }
      >
        {pendingOverwrite && (
          <div className="space-y-3 text-sm text-secondary leading-relaxed">
            <p>
              You are about to overwrite your current Choosely workspace with{' '}
              <strong className="text-on-surface">
                &ldquo;{pendingOverwrite.filename}&rdquo;
              </strong>{' '}
              (Schema v{pendingOverwrite.summary.schemaVersion}).
            </p>
            <div className="p-3 rounded-lg bg-surface-container hairline-border text-xs space-y-1">
              <p className="font-bold text-on-surface">Backup Contents:</p>
              <p>
                • {pendingOverwrite.summary.categoriesCount} categories &{' '}
                {pendingOverwrite.summary.optionsCount} options
              </p>
              <p>• {pendingOverwrite.summary.favoritesCount} saved favorites</p>
              <p>• {pendingOverwrite.summary.historyCount} history records</p>
            </div>
            <p className="text-xs text-error font-medium">
              Warning: Your existing categories, options, favorites, and history will be replaced. To keep your current data and combine both sets, cancel and choose &ldquo;Merge Data&rdquo;.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Settings;

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function Privacy() {
  return (
    <div className="space-y-8 pb-12 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 hairline-b">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary-container block mb-1">
            Legal & Data Architecture
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
            Privacy Policy
          </h1>
          <p className="text-sm text-secondary mt-1">
            How Choosely handles your categories, options, favorites, and decision history.
          </p>
        </div>
        <Link to="/settings">
          <Button variant="secondary" size="sm" icon="arrow_back">
            Back to Settings
          </Button>
        </Link>
      </div>

      <article className="bg-surface-container-lowest hairline border rounded-xl p-6 sm:p-8 space-y-6 text-sm text-secondary leading-relaxed shadow-sm">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-on-surface">
            1. Client-Side Only Data Storage
          </h2>
          <p>
            Choosely is a strictly client-side web application. All categories, options, probability weights, saved favorites, decision history records, and visual preferences you create are stored exclusively inside your web browser&apos;s{' '}
            <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-surface-container text-on-surface">
              window.localStorage
            </code>{' '}
            under the key{' '}
            <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-surface-container text-on-surface">
              decision_generator_state
            </code>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-on-surface">
            2. No Server Transmission or Account Tracking
          </h2>
          <p>
            Choosely does not operate a backend database server, user authentication system, or telemetry pipeline. Your decision pools and outcomes are never transmitted to external servers by the application.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-on-surface">
            3. Data Portability, Export & Erasure
          </h2>
          <p>
            You retain complete control over your locally stored data at all times:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-on-surface">Export:</strong> You may download a full JSON snapshot of your workspace from the{' '}
              <Link to="/settings" className="text-primary-container underline">
                Settings & Data
              </Link>{' '}
              page.
            </li>
            <li>
              <strong className="text-on-surface">Import:</strong> You may restore or merge a JSON backup file directly in your browser.
            </li>
            <li>
              <strong className="text-on-surface">Erasure:</strong> Clicking &ldquo;Reset All Data&rdquo; in Settings or clearing your browser site data immediately removes your custom records from LocalStorage.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-on-surface">
            4. Third-Party Static Assets
          </h2>
          <p>
            The application loads the <em>Manrope</em> web font from Google Fonts when an internet connection is available. No user-entered decision content is included in font requests.
          </p>
        </section>
      </article>
    </div>
  );
}

export default Privacy;

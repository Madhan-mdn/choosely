import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function Terms() {
  return (
    <div className="space-y-8 pb-12 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 hairline-b">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary-container block mb-1">
            Legal & Usage Terms
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
            Terms of Service
          </h1>
          <p className="text-sm text-secondary mt-1">
            Conditions governing the use of the Choosely client-side decision utility.
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
            1. Purpose of the Application
          </h2>
          <p>
            Choosely is an interactive decision-making utility providing uniform random selection, cumulative weighted selection, a canvas spin wheel, and progressive elimination rounds. Outcomes are generated mathematically in your browser for everyday planning, brainstorming, and prioritization.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-on-surface">
            2. Informational & Non-Advisory Nature
          </h2>
          <p>
            Selections produced by Choosely are mathematical outputs based on the options and weights you supply. They do not constitute financial, medical, legal, or safety advice. Users remain solely responsible for evaluating and acting upon any generated outcome.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-on-surface">
            3. Local Browser Storage Responsibility
          </h2>
          <p>
            Because Choosely stores all application state locally inside your browser&apos;s{' '}
            <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-surface-container text-on-surface">
              localStorage
            </code>
            , clearing your browser cache or site storage will erase your categories, favorites, and history unless you have exported a backup JSON file via the{' '}
            <Link to="/settings" className="text-primary-container underline">
              Settings & Data
            </Link>{' '}
            screen.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-on-surface">
            4. &ldquo;As-Is&rdquo; Software Provision
          </h2>
          <p>
            The software is provided &ldquo;as is&rdquo; without warranties of any kind, express or implied, including but not limited to fitness for a particular purpose or uninterrupted availability.
          </p>
        </section>
      </article>
    </div>
  );
}

export default Terms;

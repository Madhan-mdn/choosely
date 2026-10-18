import { chromium } from 'playwright-core';
import { preview } from 'vite';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = path.resolve('docs/screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Seed data to make the UI look realistic, populated, and beautiful
const seedState = {
  categories: [
    { id: 'cat-1', name: 'Food & Dining' },
    { id: 'cat-2', name: 'Movie Night' },
    { id: 'cat-3', name: 'Weekend Travel' },
    { id: 'cat-4', name: 'Team Focus' }
  ],
  options: {
    'cat-1': [
      { id: 'opt-1-1', name: 'Artisan Pizza', weight: 4 },
      { id: 'opt-1-2', name: 'Smash Burger', weight: 3 },
      { id: 'opt-1-3', name: 'Crispy Dosa', weight: 2 },
      { id: 'opt-1-4', name: 'Hyderabadi Biryani', weight: 5 },
      { id: 'opt-1-5', name: 'Sushi Omakase', weight: 3 }
    ],
    'cat-2': [
      { id: 'opt-2-1', name: 'Interstellar', weight: 2 },
      { id: 'opt-2-2', name: 'Inception', weight: 2 },
      { id: 'opt-2-3', name: 'Dune: Part Two', weight: 4 },
      { id: 'opt-2-4', name: 'Oppenheimer', weight: 3 },
      { id: 'opt-2-5', name: 'Spirited Away', weight: 2 }
    ],
    'cat-3': [
      { id: 'opt-3-1', name: 'Goa Coastal Trail', weight: 3 },
      { id: 'opt-3-2', name: 'Ooty Tea Hills', weight: 2 },
      { id: 'opt-3-3', name: 'Kyoto Heritage', weight: 4 },
      { id: 'opt-3-4', name: 'Manali Pine Retreat', weight: 3 }
    ],
    'cat-4': [
      { id: 'opt-4-1', name: 'Architecture Review', weight: 3 },
      { id: 'opt-4-2', name: 'UI Micro-Interactions', weight: 4 },
      { id: 'opt-4-3', name: 'Design System Sprint', weight: 2 },
      { id: 'opt-4-4', name: 'Team Hackathon', weight: 4 }
    ]
  },
  favorites: [
    { id: 'fav-1', categoryName: 'Food & Dining', optionName: 'Hyderabadi Biryani', addedAt: 'Oct 14, 2026' },
    { id: 'fav-2', categoryName: 'Movie Night', optionName: 'Dune: Part Two', addedAt: 'Oct 15, 2026' },
    { id: 'fav-3', categoryName: 'Weekend Travel', optionName: 'Kyoto Heritage', addedAt: 'Oct 16, 2026' },
    { id: 'fav-4', categoryName: 'Team Focus', optionName: 'UI Micro-Interactions', addedAt: 'Oct 17, 2026' }
  ],
  history: [
    { id: 'hist-1', categoryName: 'Food & Dining', optionName: 'Hyderabadi Biryani', mode: 'Weighted', date: '2026-10-14', time: '13:15' },
    { id: 'hist-2', categoryName: 'Movie Night', optionName: 'Inception', mode: 'Random Pick', date: '2026-10-15', time: '20:45' },
    { id: 'hist-3', categoryName: 'Weekend Travel', optionName: 'Kyoto Heritage', mode: 'Spin Wheel', date: '2026-10-16', time: '11:30' },
    { id: 'hist-4', categoryName: 'Team Focus', optionName: 'UI Micro-Interactions', mode: 'Elimination Mode', date: '2026-10-17', time: '10:00' },
    { id: 'hist-5', categoryName: 'Food & Dining', optionName: 'Artisan Pizza', mode: 'Random Pick', date: '2026-10-17', time: '19:20' },
    { id: 'hist-6', categoryName: 'Movie Night', optionName: 'Dune: Part Two', mode: 'Weighted', date: '2026-10-18', time: '21:10' },
    { id: 'hist-7', categoryName: 'Team Focus', optionName: 'Team Hackathon', mode: 'Spin Wheel', date: '2026-10-18', time: '14:00' },
    { id: 'hist-8', categoryName: 'Food & Dining', optionName: 'Hyderabadi Biryani', mode: 'Weighted', date: '2026-10-18', time: '18:05' }
  ],
  settings: {
    darkMode: false,
    animations: false,
    themeMode: 'light'
  }
};

async function run() {
  console.log('Starting in-process Vite preview server...');
  const server = await preview({
    preview: {
      port: 4173,
      host: '127.0.0.1'
    }
  });

  const rawBaseUrl = server.resolvedUrls.local[0] || 'http://127.0.0.1:4173';
  const baseUrl = rawBaseUrl.replace(/\/$/, '');
  console.log(`Vite preview running at ${baseUrl}`);

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  console.log(`Connecting to Chrome at ${chromePath}...`);

  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  async function createPage(viewport, isDark = false) {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 2
    });
    const page = await context.newPage();

    const stateToInject = JSON.parse(JSON.stringify(seedState));
    if (isDark) {
      stateToInject.settings.darkMode = true;
      stateToInject.settings.themeMode = 'dark';
    } else {
      stateToInject.settings.darkMode = false;
      stateToInject.settings.themeMode = 'light';
    }

    await page.addInitScript((state) => {
      window.localStorage.setItem('decision_generator_state', JSON.stringify(state));
    }, stateToInject);

    return { page, context };
  }

  const desktopViewport = { width: 1440, height: 1000 };
  const mobileViewport = { width: 390, height: 844 };

  try {
    // 1. Dashboard (Desktop)
    console.log('Capturing: dashboard.png');
    {
      const { page, context } = await createPage(desktopViewport, false);
      await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'dashboard.png') });
      await context.close();
    }

    // 2. Decision Generator (Desktop)
    console.log('Capturing: decision-generator.png');
    {
      const { page, context } = await createPage(desktopViewport, false);
      await page.goto(`${baseUrl}/generator`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'decision-generator.png') });
      await context.close();
    }

    // 3. Spin Wheel Arena (Desktop)
    console.log('Capturing: spin-wheel.png');
    {
      const { page, context } = await createPage(desktopViewport, false);
      await page.goto(`${baseUrl}/wheel`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'spin-wheel.png') });
      await context.close();
    }

    // 4. Elimination Mode (Desktop)
    console.log('Capturing: elimination-mode.png');
    {
      const { page, context } = await createPage(desktopViewport, false);
      await page.goto(`${baseUrl}/wheel`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      const elimButton = page.locator('button:has-text("Elimination Bracket")').first();
      if (await elimButton.count() > 0) {
        await elimButton.click();
        await page.waitForTimeout(800);
      }
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'elimination-mode.png') });
      await context.close();
    }

    // 5. History (Desktop)
    console.log('Capturing: history.png');
    {
      const { page, context } = await createPage(desktopViewport, false);
      await page.goto(`${baseUrl}/history`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'history.png') });
      await context.close();
    }

    // 6. Favorites (Desktop)
    console.log('Capturing: favorites.png');
    {
      const { page, context } = await createPage(desktopViewport, false);
      await page.goto(`${baseUrl}/favorites`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'favorites.png') });
      await context.close();
    }

    // 7. Settings (Desktop)
    console.log('Capturing: settings.png');
    {
      const { page, context } = await createPage(desktopViewport, false);
      await page.goto(`${baseUrl}/settings`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'settings.png') });
      await context.close();
    }

    // 8. Privacy Policy (Desktop)
    console.log('Capturing: privacy-policy.png');
    {
      const { page, context } = await createPage(desktopViewport, false);
      await page.goto(`${baseUrl}/privacy`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'privacy-policy.png') });
      await context.close();
    }

    // 9. Terms of Service (Desktop)
    console.log('Capturing: terms-of-service.png');
    {
      const { page, context } = await createPage(desktopViewport, false);
      await page.goto(`${baseUrl}/terms`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'terms-of-service.png') });
      await context.close();
    }

    // 10. Dashboard Mobile View
    console.log('Capturing: dashboard-mobile.png');
    {
      const { page, context } = await createPage(mobileViewport, false);
      await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'dashboard-mobile.png') });
      await context.close();
    }

    // 11. Spin Wheel Mobile View
    console.log('Capturing: spin-wheel-mobile.png');
    {
      const { page, context } = await createPage(mobileViewport, false);
      await page.goto(`${baseUrl}/wheel`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'spin-wheel-mobile.png') });
      await context.close();
    }

    // 12. Dashboard Dark Theme (Desktop)
    console.log('Capturing: dashboard-dark.png');
    {
      const { page, context } = await createPage(desktopViewport, true);
      await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'dashboard-dark.png') });
      await context.close();
    }

    console.log('All 12 screenshots captured successfully!');
  } finally {
    await browser.close();
    await server.close();
  }
}

run().catch((err) => {
  console.error('Error during screenshot capture:', err);
  process.exit(1);
});

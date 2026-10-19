import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { ChooselyLogo } from '../ui/ChooselyLogo';
import { NAV_ITEMS } from './Sidebar';
import { useAppState } from '../../context/AppStateContext';

/**
 * Responsive Mobile Navigation:
 * 1. Slide-over navigation drawer when the menu button is tapped.
 * 2. Docked 5-tab bottom navigation bar on mobile and tablet viewports.
 */
export function MobileNavigation({ drawerOpen, onCloseDrawer }) {
  const { isDark, toggleDarkMode, storageSizeKB } = useAppState();
  const bottomTabs = NAV_ITEMS.slice(0, 5); // Dashboard, Generator, Wheel, History, Saved

  const themeBadgeLabel = isDark ? 'On' : 'Off';

  return (
    <>
      {/* Mobile Slide-Over Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Drawer"
        >
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[1px]"
            onClick={onCloseDrawer}
          />
          <aside className="relative w-72 max-w-[82vw] h-full bg-surface-container-low hairline-r p-4 flex flex-col justify-between z-10 shadow-xl">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between px-1 pt-1">
                <Link
                  to="/"
                  onClick={onCloseDrawer}
                  className="flex items-center gap-2.5"
                >
                  <ChooselyLogo size={32} decorative className="shadow-sm" />
                  <span className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">
                    Choosely
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={onCloseDrawer}
                  aria-label="Close Navigation"
                  className="p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container cursor-pointer"
                >
                  <Icon name="close" size={20} />
                </button>
              </div>

              <nav className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onCloseDrawer}
                    className={({ isActive }) =>
                      `rounded-lg px-3 py-2.5 flex items-center gap-3 font-label-md text-label-md transition-colors ${
                        isActive
                          ? 'bg-surface-container text-primary font-semibold border-l-2 border-primary'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60 font-medium'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon name={item.icon} size={19} filled={isActive} />
                        <span className="flex-1">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="flex flex-col gap-2 pt-3 hairline-t">
              <div className="px-3 py-2 rounded-lg bg-surface hairline-border flex items-center justify-between text-secondary">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                    Local Storage Active
                  </span>
                </div>
                <span className="font-label-sm text-[10px] font-mono tabular-nums">
                  {storageSizeKB} KB
                </span>
              </div>

              <button
                type="button"
                onClick={() => toggleDarkMode(!isDark)}
                className="w-full px-3 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high flex items-center justify-between font-label-md text-label-md cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Icon
                    name={isDark ? 'light_mode' : 'dark_mode'}
                    size={18}
                  />
                  <span>Dark Mode</span>
                </div>
                <span className="font-label-sm text-label-sm text-secondary">
                  {themeBadgeLabel}
                </span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Docked Bottom Navigation Bar on Mobile/Tablet (<1024px) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center px-2 py-1.5 h-16 bg-surface/95 backdrop-blur-md hairline-t shadow-[0_-1px_3px_rgba(0,0,0,0.03)]"
      >
        {bottomTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-lg active:scale-[0.97] transition-all duration-150 ${
                isActive
                  ? 'text-primary font-semibold bg-surface-container-high/60'
                  : 'text-secondary hover:text-primary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  name={tab.to === '/dashboard' || tab.to === '/' ? 'grid_view' : tab.icon}
                  size={20}
                  filled={isActive}
                />
                <span className="font-label-sm text-label-sm mt-0.5 tracking-tight">
                  {tab.mobileLabel}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

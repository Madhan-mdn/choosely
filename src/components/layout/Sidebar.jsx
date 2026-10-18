import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { ChooselyLogo } from '../ui/ChooselyLogo';
import { useAppState } from '../../context/AppStateContext';

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', mobileLabel: 'Dashboard', icon: 'space_dashboard', end: true },
  { to: '/generator', label: 'Decision Generator', mobileLabel: 'Generator', icon: 'psychology' },
  { to: '/wheel', label: 'Wheel & Arena', mobileLabel: 'Wheel', icon: 'incomplete_circle' },
  { to: '/history', label: 'History', mobileLabel: 'History', icon: 'history' },
  { to: '/favorites', label: 'Favorites', mobileLabel: 'Saved', icon: 'bookmark' },
  { to: '/settings', label: 'Settings', mobileLabel: 'Settings', icon: 'settings' },
];

export function Sidebar({ collapsed, onToggleCollapse }) {
  const navigate = useNavigate();
  const { isDark, toggleDarkMode, storageSizeKB } = useAppState();

  const themeBadgeLabel = isDark ? 'On' : 'Off';

  return (
    <aside
      aria-label="Desktop Sidebar Navigation"
      className={`hidden lg:flex flex-col justify-between h-screen shrink-0 select-none z-30 hairline-r bg-surface-container-low transition-all duration-200 ${
        collapsed ? 'w-20 p-3' : 'w-64 p-4'
      }`}
    >
      {/* Top Brand & Navigation */}
      <div className="flex flex-col gap-5">
        <button
          type="button"
          onClick={() => navigate('/')}
          title="Choosely Home"
          aria-label="Choosely Home"
          className={`flex items-center rounded-lg focus:outline-none cursor-pointer ${
            collapsed ? 'justify-center pt-1' : 'gap-2.5 px-2 pt-1'
          }`}
        >
          <ChooselyLogo size={32} decorative={!collapsed} className="shadow-sm" />
          {!collapsed && (
            <span className="font-headline-sm text-headline-sm tracking-tight text-primary font-bold truncate">
              Choosely
            </span>
          )}
        </button>

        {/* Primary CTA: New Decision */}
        <button
          type="button"
          onClick={() => navigate('/generator')}
          title="New Decision"
          className={`w-full h-[38px] bg-primary-container text-on-primary rounded-lg flex items-center justify-center gap-2 font-label-md text-label-md font-semibold transition-all hover:bg-primary-hover active:scale-[0.99] cursor-pointer shadow-sm ${
            collapsed ? 'px-0' : 'px-3'
          }`}
        >
          <Icon name="add" size={18} />
          {!collapsed && <span>New Decision</span>}
        </button>

        {/* Main Navigation Links */}
        <nav aria-label="Main Navigation" className="flex flex-col gap-1 mt-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `rounded-lg py-2 flex items-center transition-all duration-150 ${
                  collapsed ? 'justify-center px-2' : 'px-3 gap-3'
                } ${
                  isActive
                    ? 'bg-surface-container text-primary font-semibold border-l-2 border-primary'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/40 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    name={item.icon}
                    size={19}
                    filled={isActive}
                    className={isActive ? 'text-primary' : ''}
                  />
                  {!collapsed && (
                    <span className="font-label-md text-label-md flex-1 truncate">
                      {item.label}
                    </span>
                  )}
                  {!collapsed && isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Footer: Local Storage Status, Theme Switcher, Collapse Toggle */}
      <div className="flex flex-col gap-2 pt-3 hairline-t">
        {!collapsed ? (
          <div className="px-3 py-1.5 rounded-lg bg-surface flex items-center justify-between hairline-border text-secondary">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-primary-container shrink-0"></span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium truncate">
                Local Storage Active
              </span>
            </div>
            <span className="font-label-sm text-[10px] text-secondary font-mono tabular-nums shrink-0">
              {storageSizeKB} KB
            </span>
          </div>
        ) : (
          <div
            className="py-1.5 rounded-lg bg-surface flex items-center justify-center hairline-border"
            title={`Local Storage Active (${storageSizeKB} KB)`}
          >
            <span className="w-2 h-2 rounded-full bg-primary-container"></span>
          </div>
        )}

        {/* Dark Mode Toggle Button */}
        <button
          type="button"
          onClick={() => toggleDarkMode(!isDark)}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg py-2 flex items-center font-label-md text-label-md transition-colors duration-150 cursor-pointer ${
            collapsed ? 'justify-center px-2' : 'justify-between px-3'
          }`}
        >
          <div className="flex items-center gap-3">
            <Icon name={isDark ? 'light_mode' : 'dark_mode'} size={18} />
            {!collapsed && <span>Dark Mode</span>}
          </div>
          {!collapsed && (
            <span className="font-label-sm text-label-sm text-secondary">
              {themeBadgeLabel}
            </span>
          )}
        </button>

        {/* Collapse Sidebar Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className={`text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg py-2 flex items-center font-label-md text-label-md transition-colors duration-150 cursor-pointer ${
            collapsed ? 'justify-center px-2' : 'gap-3 px-3'
          }`}
        >
          <Icon
            name={collapsed ? 'left_panel_open' : 'left_panel_close'}
            size={18}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

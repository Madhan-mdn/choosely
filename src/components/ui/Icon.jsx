import React from 'react';

/**
 * Inline geometric SVG icon component with zero external icon-font dependencies.
 */
export function Icon({ name, size = 18, filled = false, className = '', title }) {
  const s = typeof size === 'number' ? `${size}px` : size;
  const strokeWidth = filled ? 2.2 : 1.85;

  const renderPath = () => {
    switch (name) {
      case 'space_dashboard':
      case 'grid_view':
        return filled ? (
          <>
            <rect x="3" y="3" width="8" height="8" rx="1.5" fill="currentColor" />
            <rect x="13" y="3" width="8" height="8" rx="1.5" fill="currentColor" />
            <rect x="3" y="13" width="8" height="8" rx="1.5" fill="currentColor" />
            <rect x="13" y="13" width="8" height="8" rx="1.5" fill="currentColor" />
          </>
        ) : (
          <>
            <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
            <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
            <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
            <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
          </>
        );

      case 'psychology':
      case 'casino':
        return (
          <>
            <rect x="3.5" y="3.5" width="17" height="17" rx="3" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.14 : 0} />
            <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
            <circle cx="15.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
            <circle cx="8.5" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
            <circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
          </>
        );

      case 'incomplete_circle':
      case 'adjust':
        return (
          <>
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
            <path d="M12 3v6M12 15v6M3 12h6M15 12h6" strokeOpacity="0.55" />
          </>
        );

      case 'history':
        return (
          <>
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l3.2 2" />
          </>
        );

      case 'bookmark':
        return (
          <path
            d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z"
            fill={filled ? 'currentColor' : 'none'}
          />
        );

      case 'bookmark_add':
        return (
          <>
            <path d="M17 11v9l-6-3.5L5 20V5a1 1 0 0 1 1-1h6" />
            <path d="M17 3v6M14 6h6" />
          </>
        );

      case 'star':
        return (
          <path
            d="M12 2.8l2.75 5.57 6.15.9-4.45 4.33 1.05 6.12L12 16.83l-5.5 2.89 1.05-6.12L3.1 9.27l6.15-.9L12 2.8z"
            fill={filled ? 'currentColor' : 'none'}
          />
        );

      case 'settings':
        return (
          <>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </>
        );

      case 'tune':
        return (
          <>
            <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
            <circle cx="16" cy="6" r="2" />
            <circle cx="10" cy="12" r="2" />
            <circle cx="18" cy="18" r="2" />
          </>
        );

      case 'search':
        return (
          <>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.8-3.8" />
          </>
        );

      case 'add':
        return <path d="M12 5v14M5 12h14" />;

      case 'add_circle':
        return (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v8M8 12h8" />
          </>
        );

      case 'edit':
        return (
          <>
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </>
        );

      case 'edit_note':
        return (
          <>
            <path d="M4 7h11M4 12h9M4 17h6" />
            <path d="M18.5 11.5l2 2-5.5 5.5H13v-2l5.5-5.5z" />
          </>
        );

      case 'delete':
      case 'delete_forever':
        return (
          <>
            <path d="M3 6h18" />
            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
          </>
        );

      case 'delete_sweep':
        return (
          <>
            <path d="M15 4h5M16 8h4M16 12h3" />
            <path d="M3 6h10l-1 13a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 4 19L3 6z" />
            <path d="M6 4h4" />
          </>
        );

      case 'close':
        return <path d="M18 6L6 18M6 6l12 12" />;

      case 'menu':
        return <path d="M4 6h16M4 12h16M4 18h16" />;

      case 'left_panel_close':
        return (
          <>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M9 4v16" />
            <path d="M16 15l-3-3 3-3" />
          </>
        );

      case 'left_panel_open':
        return (
          <>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M9 4v16" />
            <path d="M13 9l3 3-3 3" />
          </>
        );

      case 'dark_mode':
        return (
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            fill={filled ? 'currentColor' : 'none'}
          />
        );

      case 'light_mode':
        return (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </>
        );

      case 'settings_brightness':
        return (
          <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="12" cy="12" r="3" />
          </>
        );

      case 'play_arrow':
        return (
          <path
            d="M8 5.5v13l10-6.5-10-6.5z"
            fill="currentColor"
          />
        );

      case 'bolt':
        return (
          <path
            d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
            fill={filled ? 'currentColor' : 'none'}
          />
        );

      case 'shuffle':
        return (
          <>
            <path d="M16 3h5v5" />
            <path d="M4 20L21 3" />
            <path d="M21 16v5h-5" />
            <path d="M15 15l6 6" />
            <path d="M4 4l5 5" />
          </>
        );

      case 'balance':
        return (
          <>
            <path d="M12 3v18M8 21h8M4 7h16" />
            <path d="M5 7l-2 6h6L7 7M17 7l-2 6h6l-2-6" />
          </>
        );

      case 'pie_chart':
        return (
          <>
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
            <path d="M22 12A10 10 0 0 0 12 2v10z" />
          </>
        );

      case 'rotate_right':
      case 'refresh':
      case 'autorenew':
      case 'replay':
      case 'restart_alt':
        return (
          <>
            <path d="M21 12a9 9 0 1 1-2.64-6.36L21 8" />
            <path d="M21 3v5h-5" />
          </>
        );

      case 'checklist':
        return (
          <>
            <path d="M9 6h11M9 12h11M9 18h11" />
            <path d="M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5L7.5 11M3.5 18l1.5 1.5L7.5 17" />
          </>
        );

      case 'remove_circle_outline':
        return (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12h8" />
          </>
        );

      case 'check_circle':
      case 'verified':
        return (
          <>
            <circle cx="12" cy="12" r="9" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.16 : 0} />
            <path d="M8.5 12.5l2.3 2.3 4.7-4.8" />
          </>
        );

      case 'verified_user':
      case 'shield':
      case 'encrypted':
        return (
          <>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </>
        );

      case 'trophy':
        return (
          <>
            <path d="M6 9H4a2 2 0 0 1-2-2V5h4M18 9h2a2 2 0 0 0 2-2V5h-4" />
            <path d="M6 4h12v5a6 6 0 0 1-12 0V4z" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.15 : 0} />
            <path d="M12 15v5M8 20h8" />
          </>
        );

      case 'share':
        return (
          <>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
          </>
        );

      case 'content_copy':
        return (
          <>
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </>
        );

      case 'download':
      case 'file_download':
        return (
          <>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M7 10l5 5 5-5" />
            <path d="M12 15V3" />
          </>
        );

      case 'upload_file':
        return (
          <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6M12 17v-6M9.5 13.5L12 11l2.5 2.5" />
          </>
        );

      case 'warning':
        return (
          <>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <path d="M12 9v4M12 17h.01" />
          </>
        );

      case 'info':
        return (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 16v-4M12 8h.01" />
          </>
        );

      case 'lightbulb':
        return (
          <>
            <path d="M9 18h6M10 22h4" />
            <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A6 6 0 1 0 7.5 11.5c.76.76 1.23 1.52 1.41 2.5" />
          </>
        );

      case 'insights':
        return (
          <>
            <path d="M3 17l6-6 4 4 8-8" />
            <circle cx="3" cy="17" r="1.5" fill="currentColor" />
            <circle cx="9" cy="11" r="1.5" fill="currentColor" />
            <circle cx="13" cy="15" r="1.5" fill="currentColor" />
            <circle cx="21" cy="7" r="1.5" fill="currentColor" />
          </>
        );

      case 'auto_awesome':
        return (
          <>
            <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
            <path d="M19 3v4M17 5h4M5 17v4M3 19h4" />
          </>
        );

      case 'gavel':
        return (
          <>
            <path d="M14 4l6 6M11 7l6 6M3 21l9-9M13 3l-3 3 8 8 3-3-8-8z" />
            <path d="M2 21h8" />
          </>
        );

      case 'how_to_vote':
      case 'swords':
        return (
          <>
            <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
            <path d="M13 19l6-6M16 16l4 4M19 21l2-2" />
            <path d="M9.5 17.5L21 6V3h-3L6.5 14.5" />
            <path d="M11 19l-6-6M8 16l-4 4M5 21l-2-2" />
          </>
        );

      case 'speed':
        return (
          <>
            <path d="M12 14l4-4" />
            <path d="M3.34 19a10 10 0 1 1 17.32 0" />
          </>
        );

      case 'lock':
      case 'lock_reset':
        return (
          <>
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </>
        );

      case 'description':
        return (
          <>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6M8 13h8M8 17h6M8 9h2" />
          </>
        );

      case 'database':
        return (
          <>
            <ellipse cx="12" cy="5" rx="8" ry="3" />
            <path d="M20 12c0 1.66-3.58 3-8 3s-8-1.34-8-3" />
            <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
          </>
        );

      case 'volume_up':
      case 'volume_down':
        return (
          <>
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </>
        );

      case 'accessibility_new':
        return (
          <>
            <circle cx="12" cy="4.5" r="2" />
            <path d="M4 9h16M12 9v6M9 21l3-6 3 6" />
          </>
        );

      case 'filter_list':
        return <path d="M3 6h18M7 12h10M10 18h4" />;

      case 'expand_more':
        return <path d="M6 9l6 6 6-6" />;

      case 'expand_less':
        return <path d="M18 15l-6-6-6 6" />;

      case 'unfold_more':
        return <path d="M8 9l4-4 4 4M16 15l-4 4-4-4" />;

      case 'chevron_right':
        return <path d="M9 18l6-6-6-6" />;

      case 'arrow_forward':
        return <path d="M5 12h14M13 6l6 6-6 6" />;

      case 'arrow_back':
        return <path d="M19 12H5M11 18l-6-6 6-6" />;

      case 'open_in_new':
        return (
          <>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <path d="M15 3h6v6M10 14L21 3" />
          </>
        );

      case 'sync':
        return (
          <>
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </>
        );

      case 'notifications':
        return (
          <>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </>
        );

      case 'help_outline':
        return (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
          </>
        );

      case 'restaurant':
        return (
          <>
            <path d="M4 3v7a3 3 0 0 0 3 3v8M7 3v7M10 3v7" />
            <path d="M16 3v18M16 3c2.5 0 4 2 4 5v4h-4" />
          </>
        );

      case 'movie':
        return (
          <>
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M2 8h20M7 4l2 4M13 4l2 4" />
          </>
        );

      case 'calendar_today':
        return (
          <>
            <rect x="3" y="4" width="18" height="17" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </>
        );

      case 'flight':
        return (
          <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
        );

      case 'folder':
      default:
        return (
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
        );
    }
  };

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 select-none ${className}`}
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      {renderPath()}
    </svg>
  );
}

/**
 * Helper to pick a contextual category icon based on category name
 */
export function getCategoryIconName(categoryName = '') {
  const lower = String(categoryName).toLowerCase();
  if (lower.includes('food') || lower.includes('dining') || lower.includes('lunch') || lower.includes('dinner')) {
    return 'restaurant';
  }
  if (lower.includes('movie') || lower.includes('film') || lower.includes('show')) {
    return 'movie';
  }
  if (lower.includes('travel') || lower.includes('trip') || lower.includes('vacation')) {
    return 'flight';
  }
  if (lower.includes('weekend') || lower.includes('plan') || lower.includes('daily')) {
    return 'calendar_today';
  }
  return 'folder';
}

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNavigation } from './MobileNavigation';
import { PageHeader } from './PageHeader';
import { ResultModal } from '../decisions/ResultModal';
import { Toast } from '../ui/Toast';
import { useAppState } from '../../context/AppStateContext';

/**
 * Shared application shell wrapping all pages with Desktop Sidebar,
 * Top Header Utility Bar, Main Workstation Canvas, Mobile Bottom Nav,
 * Global Result Modal, and Toast notifications.
 */
export function AppLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { toast, dismissToast } = useAppState();

  return (
    <div className="min-h-screen lg:h-screen w-full bg-surface text-on-surface flex flex-col lg:flex-row lg:overflow-hidden">
      {/* Desktop Left Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-hidden bg-surface">
        <PageHeader onOpenMobileMenu={() => setMobileDrawerOpen(true)} />

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-5 pb-24 lg:py-7">
          <div className="max-w-[1440px] mx-auto w-full">{children}</div>
        </main>
      </div>

      {/* Mobile Navigation Drawer & Bottom Bar */}
      <MobileNavigation
        drawerOpen={mobileDrawerOpen}
        onCloseDrawer={() => setMobileDrawerOpen(false)}
      />

      {/* Global Decision Result / Animation Modal */}
      <ResultModal />

      {/* Global Toast Notification */}
      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

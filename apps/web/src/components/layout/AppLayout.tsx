import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileDrawer from './MobileDrawer';
import BottomTabBar from './BottomTabBar';

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop sidebar — hidden below lg */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      <MobileDrawer open={drawerOpen} onClose={closeDrawer} />

      <div className="flex flex-1 flex-col lg:ml-60">
        <TopBar onMenuToggle={openDrawer} />
        <main className="flex-1 p-4 pb-20 sm:p-6 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <BottomTabBar />
    </div>
  );
}

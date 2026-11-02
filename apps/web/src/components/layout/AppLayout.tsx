import { useState, useCallback, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileDrawer from './MobileDrawer';
import BottomTabBar from './BottomTabBar';
import { tituloDeRuta } from './navConfig';

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Cerrar el cajón al cambiar de ruta, también con atrás y adelante.
  const { pathname } = useLocation();
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setDrawerOpen(false);
  }

  // El título de la pestaña dice en qué sección estás.
  useEffect(() => {
    document.title = `${tituloDeRuta(pathname)} · Banco de Tiempo`;
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop sidebar — hidden below lg */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      <MobileDrawer open={drawerOpen} onClose={closeDrawer} />

      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        <TopBar onMenuToggle={openDrawer} />
        <main className="min-w-0 flex-1 overflow-x-hidden px-4 pb-28 pt-2 sm:px-6 lg:px-10 lg:pb-12">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <BottomTabBar />
    </div>
  );
}

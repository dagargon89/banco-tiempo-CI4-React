import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './app/App';
import { useThemeStore } from './stores/themeStore';
import './styles/tokens.css';

const queryClient = new QueryClient();

function AppShell() {
  const theme = useThemeStore((s) => s.theme);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolvedTheme: 'light' | 'dark' | 'system' = theme === 'system' ? 'system' : theme;

  return (
    <>
      <App />
      <Toaster
        position={isMobile ? 'top-center' : 'bottom-right'}
        richColors
        closeButton
        theme={resolvedTheme}
        toastOptions={{
          style: { fontFamily: 'var(--font-ui)' },
        }}
      />
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppShell />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);

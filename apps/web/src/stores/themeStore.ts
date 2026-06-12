import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  if (theme === 'dark') root.classList.add('dark');
  else if (theme === 'light') root.classList.add('light');
  // 'system' relies on prefers-color-scheme media query
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return (localStorage.getItem('theme') as Theme) ?? 'light';
}

export const useThemeStore = create<ThemeState>((set) => {
  const initial = getInitialTheme();
  applyTheme(initial);

  return {
    theme: initial,
    setTheme: (theme) => {
      localStorage.setItem('theme', theme);
      applyTheme(theme);
      set({ theme });
    },
  };
});

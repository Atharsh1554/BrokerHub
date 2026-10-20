import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Enforce light theme only across customer and broker application
  const [theme] = useState<ThemeMode>('light');
  const resolvedTheme: 'light' | 'dark' = 'light';

  useEffect(() => {
    try {
      localStorage.setItem('brokerhub_theme', 'light');
    } catch {}
    // Only remove dark if not on an admin route
    if (!window.location.pathname.startsWith('/admin')) {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, []);

  const setTheme = (_newTheme: ThemeMode) => {};
  const toggleTheme = () => {};

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};

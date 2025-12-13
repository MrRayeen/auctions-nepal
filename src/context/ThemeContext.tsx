"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The default theme is 'dark' as per globals.css
  const [theme, setTheme] = useState<Theme>('dark');

  // On mount, check localStorage and apply the theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  // This function now correctly toggles the 'light' class
  const applyTheme = (newTheme: Theme) => {
    const html = document.documentElement;
    if (newTheme === 'light') {
      html.classList.add('light');
    } else {
      html.classList.remove('light');
    }
  };

  // Always render the provider to avoid SSR errors.
  // The client-side useEffect will handle the theme sync.
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

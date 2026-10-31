export type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'eduzone_theme';

let currentTheme: Theme = (() => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // ignore
  }
  return 'dark'; // Default to existing dark gaming aesthetic
})();

const themeListeners = new Set<(theme: Theme) => void>();

function applyThemeToDOM(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
    document.body.style.backgroundColor = '#f1f5f9';
    document.body.style.color = '#0f172a';
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    document.body.style.backgroundColor = '#020617';
    document.body.style.color = '#f8fafc';
  }
}

// Initial DOM sync
applyThemeToDOM(currentTheme);

export function getTheme(): Theme {
  return currentTheme;
}

export function setTheme(theme: Theme): void {
  currentTheme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore
  }
  applyThemeToDOM(theme);
  themeListeners.forEach((fn) => fn(theme));
}

export function toggleTheme(): Theme {
  const next = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

export function subscribeTheme(listener: (theme: Theme) => void): () => void {
  themeListeners.add(listener);
  return () => {
    themeListeners.delete(listener);
  };
}

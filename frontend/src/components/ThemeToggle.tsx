import { useState, useEffect } from 'react';

type Theme = 'night' | 'day' | 'entardecer' | 'crepusculo';

const THEME_OPTIONS: Array<{ value: Theme; label: string; hint: string }> = [
  { value: 'night', label: 'Noite', hint: 'Tema noturno' },
  { value: 'day', label: 'Dia', hint: 'Tema claro' },
  { value: 'entardecer', label: 'Entardecer', hint: 'Tema quente' },
  { value: 'crepusculo', label: 'Crepúsculo', hint: 'Tema profundo' },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('maextria-theme') as Theme | 'dark' | 'light' | null;
      if (saved === 'dark') return 'night';
      if (saved === 'light') return 'day';
      if (saved && THEME_OPTIONS.some((option) => option.value === saved)) {
        return saved;
      }
    }
    return 'night';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(
      'dark',
      'light',
      'theme-night',
      'theme-day',
      'theme-entardecer',
      'theme-crepusculo'
    );
    if (theme === 'night') {
      root.classList.add('theme-night', 'dark');
    } else if (theme === 'day') {
      root.classList.add('theme-day', 'light');
    } else if (theme === 'entardecer') {
      root.classList.add('theme-entardecer', 'dark');
    } else {
      root.classList.add('theme-crepusculo', 'dark');
    }
    localStorage.setItem('maextria-theme', theme);
  }, [theme]);

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1"
      role="group"
      aria-label="Escolher tema"
    >
      {THEME_OPTIONS.map((option) => {
        const isActive = option.value === theme;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
              isActive
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
            aria-pressed={isActive}
            title={option.hint}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

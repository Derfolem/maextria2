import { useState, useEffect } from 'react';
import { useAuthStore } from '../lib/store';

type Theme = 'night' | 'day' | 'entardecer' | 'crepusculo';

const THEME_OPTIONS: Array<{ value: Theme; label: string; hint: string }> = [
  { value: 'night', label: 'Noite', hint: 'Tema noturno' },
  { value: 'day', label: 'Dia', hint: 'Tema claro' },
  { value: 'entardecer', label: 'Entardecer', hint: 'Tema quente' },
  { value: 'crepusculo', label: 'Crepúsculo', hint: 'Tema profundo' },
];

export default function ThemeToggle() {
  const user = useAuthStore((state) => state.user);
  const themeKey = user?.id ? `maextria-theme:${user.id}` : 'maextria-theme';
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(themeKey) as Theme | 'dark' | 'light' | null;
      const legacy = localStorage.getItem('maextria-theme') as Theme | 'dark' | 'light' | null;
      const candidate = saved || legacy;
      if (candidate === 'dark') return 'night';
      if (candidate === 'light') return 'day';
      if (candidate && THEME_OPTIONS.some((option) => option.value === candidate)) {
        return candidate;
      }
    }
    return 'night';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.dataset.memberTheme = theme;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(themeKey, theme);
    }
  }, [theme, themeKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(themeKey) as Theme | null;
    if (saved && THEME_OPTIONS.some((option) => option.value === saved)) {
      setTheme(saved);
    }
  }, [themeKey]);

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

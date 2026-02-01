import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Theme = 'dark' | 'light';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('maextria-theme') as Theme;
      return saved || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    localStorage.setItem('maextria-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full p-1 transition-colors duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
          : 'linear-gradient(135deg, #74b9ff 0%, #81ecec 50%, #a8e6cf 100%)',
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
    >
      {/* Stars for dark mode */}
      <AnimatePresence>
        {isDark && (
          <>
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.1 }}
              className="absolute top-1 left-2 w-1 h-1 bg-white rounded-full"
            />
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute top-2.5 left-4 w-0.5 h-0.5 bg-white/80 rounded-full"
            />
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ delay: 0.15 }}
              className="absolute bottom-1.5 left-3 w-0.5 h-0.5 bg-white/60 rounded-full"
            />
          </>
        )}
      </AnimatePresence>

      {/* Clouds for light mode */}
      <AnimatePresence>
        {!isDark && (
          <>
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 0.6, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ delay: 0.1 }}
              className="absolute top-1 right-2 w-3 h-1.5 bg-white rounded-full"
            />
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 0.4, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-1.5 right-3 w-2 h-1 bg-white rounded-full"
            />
          </>
        )}
      </AnimatePresence>

      {/* Toggle circle with sun/moon */}
      <motion.div
        className="relative w-5 h-5 rounded-full flex items-center justify-center"
        animate={{
          x: isDark ? 0 : 26,
          rotate: isDark ? 0 : 360,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #f5f3ce 0%, #ffeaa7 100%)'
            : 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 50%, #f39c12 100%)',
          boxShadow: isDark
            ? '0 0 10px rgba(255, 234, 167, 0.6), inset -2px -2px 4px rgba(0,0,0,0.1)'
            : '0 0 20px rgba(253, 203, 110, 0.8), 0 0 40px rgba(243, 156, 18, 0.4)',
        }}
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full"
            >
              {/* Moon craters */}
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#e0d9a8] rounded-full opacity-60" />
              <span className="absolute bottom-1.5 left-1 w-1 h-1 bg-[#e0d9a8] rounded-full opacity-40" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ scale: 0, rotate: 90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -90 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              {/* Sun rays */}
              {[...Array(8)].map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute w-0.5 h-1 bg-[#f39c12] rounded-full"
                  style={{
                    transform: `rotate(${i * 45}deg) translateY(-8px)`,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.03 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.button>
  );
}

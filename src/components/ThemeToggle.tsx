import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  id?: string;
  className?: string;
  variant?: 'pill' | 'button' | 'compact';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  id = 'btn-theme-toggle',
  className = '',
  variant = 'button',
}) => {
  const { theme, isDark, toggleTheme } = useTheme();

  if (variant === 'compact') {
    return (
      <button
        id={id}
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Kunduzgi rejimga oʻtish' : 'Tungi rejimga oʻtish'}
        title={isDark ? 'Kunduzgi rejimga oʻtish' : 'Tungi rejimga oʻtish'}
        className={`relative p-2 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-center outline-none ${
          isDark
            ? 'bg-slate-800/90 border-slate-700 text-amber-300 hover:bg-slate-700 hover:text-amber-200 shadow-xs'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-indigo-600 shadow-2xs'
        } ${className}`}
      >
        <motion.div
          key={theme}
          initial={{ rotate: -45, scale: 0.7, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 45, scale: 0.7, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
          ) : (
            <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
          )}
        </motion.div>
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        id={id}
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'Kunduzgi rejimga oʻtish' : 'Tungi rejimga oʻtish'}
        title={isDark ? 'Kunduzgi rejimga oʻtish' : 'Tungi rejimga oʻtish'}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-heading font-semibold transition-all duration-300 cursor-pointer outline-none ${
          isDark
            ? 'bg-slate-800/90 border-slate-700 text-slate-200 hover:border-slate-600'
            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
        } ${className}`}
      >
        <span className="flex items-center justify-center text-amber-400 dark:text-amber-300">
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
        </span>
        <span>{isDark ? 'Kunduzgi rejim' : 'Tungi rejim'}</span>
      </button>
    );
  }

  return (
    <button
      id={id}
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Kunduzgi rejimga oʻtish' : 'Tungi rejimga oʻtish'}
      title={isDark ? 'Kunduzgi rejimga oʻtish' : 'Tungi rejimga oʻtish'}
      className={`relative p-2 sm:p-2.5 rounded-xl border transition-all duration-300 cursor-pointer flex items-center justify-center outline-none ${
        isDark
          ? 'bg-slate-800/80 border-slate-700/80 text-amber-300 hover:bg-slate-700/90 hover:text-amber-200 hover:border-amber-500/40 shadow-xs'
          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 shadow-2xs'
      } ${className}`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-center justify-center"
      >
        {isDark ? (
          <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
        ) : (
          <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
        )}
      </motion.div>
    </button>
  );
};

'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline';
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

/**
 * Bouton pour basculer entre thème clair et sombre.
 * Utilise next-themes ; icônes Sun/Moon avec animation.
 */
export function ThemeToggle({
  className,
  size = 'md',
  variant = 'ghost',
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  if (!mounted) {
    return (
      <div
        className={cn(
          sizeClasses[size],
          'rounded-xl bg-slate-100 dark:bg-neutral-800 animate-pulse',
          className
        )}
        aria-hidden
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className={cn(
        sizeClasses[size],
        'rounded-xl flex items-center justify-center transition-colors duration-300',
        variant === 'ghost' &&
          'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800',
        variant === 'outline' &&
          'border border-slate-200 dark:border-neutral-600 text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800',
        className
      )}
    >
      <span className="relative inline-flex items-center justify-center">
        <Sun
          size={size === 'lg' ? 22 : 20}
          className={cn(
            'transition-all duration-300',
            isDark
              ? 'rotate-90 scale-0 opacity-0 absolute'
              : 'rotate-0 scale-100 opacity-100'
          )}
          strokeWidth={1.8}
        />
        <Moon
          size={size === 'lg' ? 22 : 20}
          className={cn(
            'transition-all duration-300',
            isDark
              ? 'rotate-0 scale-100 opacity-100'
              : '-rotate-90 scale-0 opacity-0 absolute'
          )}
          strokeWidth={1.8}
        />
      </span>
    </button>
  );
}

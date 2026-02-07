/**
 * Merge class names with Tailwind conflict resolution.
 * Uses clsx for conditional classes and tailwind-merge to dedupe Tailwind classes.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

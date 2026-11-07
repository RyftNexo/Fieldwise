import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names safely (same helper shadcn/ui components expect). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

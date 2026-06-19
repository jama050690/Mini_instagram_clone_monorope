import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind klasslarini xavfsiz birlashtiradi (shadcn/ui konvensiyasi). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

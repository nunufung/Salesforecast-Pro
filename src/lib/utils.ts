
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(val: number) {
  return '¥ ' + new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatNumber(val: number) {
  return new Intl.NumberFormat('en-US').format(val);
}

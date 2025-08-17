import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Concatenates class names using clsx and merges Tailwind classes with tailwind-merge.
 *
 * This utility function combines the power of clsx for conditional class names
 * and tailwind-merge for handling conflicting Tailwind CSS classes.
 *
 * @param inputs Class values to be processed
 * @returns Merged and deduplicated class string
 * @example
 * ```typescript
 * cn('px-2 py-1', 'px-4', condition && 'bg-blue-500')
 * // Returns: "py-1 px-4 bg-blue-500" (px-2 is overridden by px-4)
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
} 
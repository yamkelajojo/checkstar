import { twMerge } from 'tailwind-merge'

/** Merge conditional class names, letting tailwind-merge win conflicts. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return twMerge(classes.filter(Boolean).join(' '))
}

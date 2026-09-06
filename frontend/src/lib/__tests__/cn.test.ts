import { describe, expect, it } from 'vitest'
import { cn } from '../cn'

describe('cn', () => {
  it('joins truthy class names with a space', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('drops false, null and undefined entries', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
  })

  it('lets tailwind-merge resolve conflicts (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('keeps non-conflicting classes from all arguments', () => {
    expect(cn('p-2', 'text-sm')).toBe('p-2 text-sm')
  })

  it('returns an empty string when nothing truthy is passed', () => {
    expect(cn()).toBe('')
    expect(cn(false, null, undefined)).toBe('')
  })
})

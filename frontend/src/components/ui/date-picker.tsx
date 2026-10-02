'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { spring, time } from '@/lib/motion/tokens'

export interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  id?: string
  placeholder?: string
  ariaLabel?: string
  minDate?: string
  maxDate?: string
  /** Optional start of a paired date range (YYYY-MM-DD) for live range highlighting */
  rangeStart?: string
  /** Optional end of a paired date range (YYYY-MM-DD) for live range highlighting */
  rangeEnd?: string
  disabled?: boolean
  clearable?: boolean
  className?: string
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function toIsoDate(year: number, month0: number, day: number): string {
  const m = String(month0 + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

function todayIsoString(): string {
  const now = new Date()
  return toIsoDate(now.getFullYear(), now.getMonth(), now.getDate())
}

function addDaysIso(baseIso: string, days: number): string {
  const parsed = parseIsoParts(baseIso)
  const dt = parsed
    ? new Date(parsed.year, parsed.month0, parsed.day)
    : new Date()
  dt.setDate(dt.getDate() + days)
  return toIsoDate(dt.getFullYear(), dt.getMonth(), dt.getDate())
}

export function parseIsoParts(
  iso: string | null | undefined,
): { year: number; month0: number; day: number } | null {
  if (!iso) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim().slice(0, 10))
  if (!m) return null
  const year = Number(m[1])
  const month0 = Number(m[2]) - 1
  const day = Number(m[3])
  if (month0 < 0 || month0 > 11 || day < 1 || day > 31) return null
  const check = new Date(year, month0, day)
  if (
    check.getFullYear() !== year ||
    check.getMonth() !== month0 ||
    check.getDate() !== day
  ) {
    return null
  }
  return { year, month0, day }
}

export function formatFriendlyDate(iso: string | null | undefined): string {
  const parts = parseIsoParts(iso)
  if (!parts) return ''
  return `${parts.day} ${SHORT_MONTHS[parts.month0]} ${parts.year}`
}

export function diffDaysInclusive(startIso?: string, endIso?: string): number | null {
  const s = parseIsoParts(startIso)
  const e = parseIsoParts(endIso)
  if (!s || !e) return null
  const startMs = Date.UTC(s.year, s.month0, s.day)
  const endMs = Date.UTC(e.year, e.month0, e.day)
  if (endMs < startMs) return null
  return Math.round((endMs - startMs) / 86_400_000) + 1
}

interface PopoverPos {
  top: number
  left: number
  up: boolean
}

const POPOVER_W = 312
const POPOVER_H = 390
const GAP = 6

export default function DatePicker({
  value,
  onChange,
  id,
  placeholder = 'YYYY-MM-DD',
  ariaLabel,
  minDate,
  maxDate,
  rangeStart,
  rangeEnd,
  disabled = false,
  clearable = true,
  className = '',
}: DatePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const initialParts =
    parseIsoParts(value) ??
    parseIsoParts(rangeStart) ??
    parseIsoParts(minDate) ??
    parseIsoParts(todayIsoString())!

  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(initialParts.year)
  const [viewMonth, setViewMonth] = useState(initialParts.month0)
  const [hoveredIso, setHoveredIso] = useState<string | null>(null)
  const [pos, setPos] = useState<PopoverPos | null>(null)

  // Real-time sync calendar month/year whenever value or rangeStart updates
  useEffect(() => {
    const p = parseIsoParts(value) ?? parseIsoParts(rangeStart) ?? parseIsoParts(minDate)
    if (p) {
      setViewYear(p.year)
      setViewMonth(p.month0)
    }
  }, [value, rangeStart, minDate])

  const measure = useCallback((): PopoverPos | null => {
    const el = containerRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const up = spaceBelow < POPOVER_H + GAP && spaceAbove > spaceBelow
    const left = Math.min(
      Math.max(8, rect.left),
      Math.max(8, window.innerWidth - POPOVER_W - 8),
    )
    return {
      top: up ? rect.top - GAP : rect.bottom + GAP,
      left,
      up,
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setPos(measure())
    const onRelayout = () => setPos(measure())
    window.addEventListener('resize', onRelayout)
    window.addEventListener('scroll', onRelayout, true)
    return () => {
      window.removeEventListener('resize', onRelayout)
      window.removeEventListener('scroll', onRelayout, true)
    }
  }, [open, measure])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        containerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const isDateDisabled = useCallback(
    (iso: string): boolean => {
      if (minDate && parseIsoParts(minDate) && iso < minDate.slice(0, 10)) {
        return true
      }
      if (maxDate && parseIsoParts(maxDate) && iso > maxDate.slice(0, 10)) {
        return true
      }
      return false
    },
    [minDate, maxDate],
  )

  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

    const cells: Array<{
      iso: string
      day: number
      inCurrentMonth: boolean
    }> = []

    // Leading days from previous month
    const prevMonthYear = viewMonth === 0 ? viewYear - 1 : viewYear
    const prevMonth0 = viewMonth === 0 ? 11 : viewMonth - 1
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i
      cells.push({
        iso: toIsoDate(prevMonthYear, prevMonth0, d),
        day: d,
        inCurrentMonth: false,
      })
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      cells.push({
        iso: toIsoDate(viewYear, viewMonth, d),
        day: d,
        inCurrentMonth: true,
      })
    }

    // Trailing days from next month to fill 42 cells (6 rows)
    const nextMonthYear = viewMonth === 11 ? viewYear + 1 : viewYear
    const nextMonth0 = viewMonth === 11 ? 0 : viewMonth + 1
    let nextDay = 1
    while (cells.length < 42) {
      cells.push({
        iso: toIsoDate(nextMonthYear, nextMonth0, nextDay),
        day: nextDay,
        inCurrentMonth: false,
      })
      nextDay++
    }

    return cells
  }, [viewYear, viewMonth])

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const handleSelectIso = (iso: string) => {
    if (isDateDisabled(iso)) return
    onChange(iso)
    setOpen(false)
  }

  // Compute live range bounds (including hover preview when picking the other end of a range)
  const effectiveRange = useMemo(() => {
    const start = rangeStart && parseIsoParts(rangeStart) ? rangeStart.slice(0, 10) : null
    const end = rangeEnd && parseIsoParts(rangeEnd) ? rangeEnd.slice(0, 10) : null

    if (start && end) {
      return start <= end ? { start, end } : { start: end, end: start }
    }
    if (start && hoveredIso) {
      return start <= hoveredIso
        ? { start, end: hoveredIso }
        : { start: hoveredIso, end: start }
    }
    if (end && hoveredIso) {
      return hoveredIso <= end
        ? { start: hoveredIso, end }
        : { start: end, end: hoveredIso }
    }
    return { start, end }
  }, [rangeStart, rangeEnd, hoveredIso])

  const todayIso = todayIsoString()
  const friendlyValue = formatFriendlyDate(value)
  const rangeDayCount = diffDaysInclusive(
    effectiveRange.start ?? undefined,
    effectiveRange.end ?? undefined,
  )

  const presets = useMemo(() => {
    const anchor =
      rangeStart && parseIsoParts(rangeStart) && (!value || value !== rangeStart)
        ? rangeStart.slice(0, 10)
        : todayIso
    return [
      { label: 'Today', iso: todayIso },
      { label: '+3d', iso: addDaysIso(anchor, 3) },
      { label: '+7d', iso: addDaysIso(anchor, 7) },
      { label: '+14d', iso: addDaysIso(anchor, 14) },
      { label: '+30d', iso: addDaysIso(anchor, 30) },
    ]
  }, [rangeStart, value, todayIso])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        onClick={() => {
          if (!disabled) setOpen(true)
        }}
        className={`group flex items-center gap-2 w-full border rounded-xl px-3 py-2 text-sm bg-white transition-all cursor-pointer ${
          open
            ? 'border-primary ring-2 ring-primary/25 shadow-sm'
            : 'border-gray-200 hover:border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
      >
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label="Toggle calendar"
          onClick={(e) => {
            e.stopPropagation()
            if (!disabled) setOpen((v) => !v)
          }}
          className="text-gray-400 group-hover:text-primary transition-colors shrink-0"
        >
          <Calendar size={15} />
        </button>

        <input
          id={id}
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          aria-label={ariaLabel}
          disabled={disabled}
          value={value}
          onFocus={() => {
            if (!disabled) setOpen(true)
          }}
          onChange={(e) => {
            onChange(e.target.value)
          }}
          className="w-full min-w-0 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none tabular-nums"
        />

        {friendlyValue && (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-medium whitespace-nowrap shrink-0">
            {friendlyValue}
          </span>
        )}

        {clearable && value && !disabled && (
          <button
            type="button"
            aria-label="Clear date"
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
            }}
            className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition-colors shrink-0"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && pos && (
              <motion.div
                ref={popoverRef}
                role="dialog"
                aria-label="Choose date"
                initial={{
                  opacity: 0,
                  scale: 0.96,
                  y: pos.up ? 6 : -6,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  transition: spring.snap,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.97,
                  y: pos.up ? 4 : -4,
                  transition: { duration: time.fast },
                }}
                style={{
                  position: 'fixed',
                  top: pos.up ? undefined : pos.top,
                  bottom: pos.up ? window.innerHeight - pos.top : undefined,
                  left: pos.left,
                  width: POPOVER_W,
                  zIndex: 140,
                }}
                className="bg-white border border-gray-200 rounded-xl shadow-xl p-3.5 select-none"
              >
                {/* Quick Presets Bar */}
                <div className="flex items-center gap-1 pb-2.5 mb-2.5 border-b border-gray-100 overflow-x-auto">
                  {presets.map((preset) => {
                    const disabledPreset = isDateDisabled(preset.iso)
                    const isCurrent = value === preset.iso
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        disabled={disabledPreset}
                        onClick={() => handleSelectIso(preset.iso)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors shrink-0 ${
                          isCurrent
                            ? 'bg-primary text-white'
                            : disabledPreset
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'bg-gray-50 text-gray-600 hover:bg-primary/10 hover:text-primary'
                        }`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>

                {/* Month & Year Navigation Header */}
                <div className="flex items-center justify-between mb-2.5">
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={goPrevMonth}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft size={15} />
                  </button>

                  <div className="flex items-center gap-1.5">
                    <select
                      aria-label="Select month"
                      value={viewMonth}
                      onChange={(e) => setViewMonth(Number(e.target.value))}
                      className="text-xs font-semibold text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg px-2 py-1 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                    >
                      {MONTH_NAMES.map((m, idx) => (
                        <option key={m} value={idx}>
                          {m}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label="Select year"
                      value={viewYear}
                      onChange={(e) => setViewYear(Number(e.target.value))}
                      className="text-xs font-semibold text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg px-2 py-1 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer tabular-nums"
                    >
                      {Array.from({ length: 11 }, (_, i) => viewYear - 5 + i).map(
                        (yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={goNextMonth}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-0.5 mb-1">
                  {WEEKDAYS.map((wd) => (
                    <div
                      key={wd}
                      className="text-center text-[11px] font-semibold text-gray-400 py-1"
                    >
                      {wd}
                    </div>
                  ))}
                </div>

                {/* 42-Day Calendar Grid */}
                <div
                  className="grid grid-cols-7 gap-y-0.5"
                  onMouseLeave={() => setHoveredIso(null)}
                >
                  {calendarDays.map((cell) => {
                    const disabledCell = isDateDisabled(cell.iso)
                    const isSelected = value === cell.iso
                    const isRangeStart = effectiveRange.start === cell.iso
                    const isRangeEnd = effectiveRange.end === cell.iso
                    const isInRange =
                      !!effectiveRange.start &&
                      !!effectiveRange.end &&
                      cell.iso > effectiveRange.start &&
                      cell.iso < effectiveRange.end
                    const isToday = cell.iso === todayIso

                    return (
                      <button
                        key={cell.iso}
                        type="button"
                        disabled={disabledCell}
                        aria-label={formatFriendlyDate(cell.iso)}
                        aria-pressed={isSelected}
                        onMouseEnter={() => {
                          if (!disabledCell) setHoveredIso(cell.iso)
                        }}
                        onClick={() => handleSelectIso(cell.iso)}
                        className={`relative h-8 w-full flex items-center justify-center text-xs transition-colors tabular-nums ${
                          isInRange ? 'bg-primary/10 text-primary font-medium' : ''
                        } ${
                          isSelected || isRangeStart || isRangeEnd
                            ? 'bg-primary text-white font-semibold rounded-lg shadow-sm z-10'
                            : disabledCell
                              ? 'text-gray-300 opacity-40 cursor-not-allowed line-through'
                              : cell.inCurrentMonth
                                ? 'text-gray-800 hover:bg-gray-100 rounded-lg'
                                : 'text-gray-400 hover:bg-gray-50 rounded-lg'
                        } ${
                          isToday && !isSelected && !isRangeStart && !isRangeEnd
                            ? 'ring-1 ring-primary/50 text-primary font-semibold rounded-lg'
                            : ''
                        }`}
                      >
                        {cell.day}
                      </button>
                    )
                  })}
                </div>

                {/* Real-Time Range & Bounds Footer */}
                <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2 text-[11px] text-gray-500">
                  <div className="truncate">
                    {effectiveRange.start && effectiveRange.end ? (
                      <span className="font-medium text-gray-700">
                        {formatFriendlyDate(effectiveRange.start)} →{' '}
                        {formatFriendlyDate(effectiveRange.end)}
                        {rangeDayCount ? (
                          <span className="ml-1 text-primary font-semibold">
                            ({rangeDayCount}d)
                          </span>
                        ) : null}
                      </span>
                    ) : minDate && parseIsoParts(minDate) ? (
                      <span>From {formatFriendlyDate(minDate)}</span>
                    ) : maxDate && parseIsoParts(maxDate) ? (
                      <span>Until {formatFriendlyDate(maxDate)}</span>
                    ) : (
                      <span>{friendlyValue || 'Select a date'}</span>
                    )}
                  </div>

                  {value && (
                    <button
                      type="button"
                      onClick={() => {
                        onChange('')
                        setOpen(false)
                      }}
                      className="text-gray-400 hover:text-gray-700 font-medium shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  )
}

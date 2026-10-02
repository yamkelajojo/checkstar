'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Check, Copy, Sparkles, Pipette } from 'lucide-react'
import { spring, time } from '@/lib/motion/tokens'

export interface ColorPickerProps {
  value: string
  onChange: (hex: string) => void
  ariaLabel?: string
  disabled?: boolean
  className?: string
}

export const BRAND_COLOR_SWATCHES = [
  '#EB6522', // Checkstar Orange
  '#C2410C', // Burnt Orange
  '#F59E0B', // Warm Amber
  '#DC2626', // Deal Crimson
  '#16A34A', // Fresh Green
  '#059669', // Emerald
  '#0D9488', // Deep Teal
  '#2563EB', // Ocean Blue
  '#4F46E5', // Indigo
  '#7C3AED', // Royal Violet
  '#DB2777', // Berry Pink
  '#1E293B', // Slate Night
] as const

export function normalizeHex(input: string): string | null {
  const cleaned = input.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    const r = cleaned[0] + cleaned[0]
    const g = cleaned[1] + cleaned[1]
    const b = cleaned[2] + cleaned[2]
    return `#${(r + g + b).toUpperCase()}`
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `#${cleaned.toUpperCase()}`
  }
  return null
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const norm = normalizeHex(hex) ?? '#EB6522'
  const n = parseInt(norm.slice(1), 16)
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  )
}

export function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const { r: r255, g: g255, b: b255 } = hexToRgb(hex)
  const r = r255 / 255
  const g = g255 / 255
  const b = b255 / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min

  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }

  const s = max === 0 ? 0 : d / max
  const v = max

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  }
}

export function hsvToHex(h: number, s: number, v: number): string {
  const hue = ((h % 360) + 360) % 360
  const sat = Math.max(0, Math.min(100, s)) / 100
  const val = Math.max(0, Math.min(100, v)) / 100

  const c = val * sat
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = val - c

  let r1 = 0
  let g1 = 0
  let b1 = 0

  if (hue < 60) {
    r1 = c
    g1 = x
  } else if (hue < 120) {
    r1 = x
    g1 = c
  } else if (hue < 180) {
    g1 = c
    b1 = x
  } else if (hue < 240) {
    g1 = x
    b1 = c
  } else if (hue < 300) {
    r1 = x
    b1 = c
  } else {
    r1 = c
    b1 = x
  }

  return rgbToHex((r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255)
}

export function hexToHslString(hex: string): string {
  const { r: r255, g: g255, b: b255 } = hexToRgb(hex)
  const r = r255 / 255
  const g = g255 / 255
  const b = b255 / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
}

export function generateHarmoniousColors(hex: string): Array<{ label: string; hex: string }> {
  const { h, s, v } = hexToHsv(hex)
  const safeS = Math.max(45, s)
  const safeV = Math.max(55, v)
  return [
    { label: 'Analogous -30°', hex: hsvToHex(h - 30, safeS, safeV) },
    { label: 'Analogous +30°', hex: hsvToHex(h + 30, safeS, safeV) },
    { label: 'Triadic +120°', hex: hsvToHex(h + 120, safeS, safeV) },
    { label: 'Complement +180°', hex: hsvToHex(h + 180, safeS, safeV) },
  ]
}

interface PopoverPos {
  top: number
  left: number
  up: boolean
}

const POPOVER_W = 284
const POPOVER_H = 380
const GAP = 6

export default function ColorPicker({
  value,
  onChange,
  ariaLabel,
  disabled = false,
  className = '',
}: ColorPickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const spectrumRef = useRef<HTMLDivElement>(null)

  const safeHex = normalizeHex(value) ?? '#EB6522'
  const initialHsv = hexToHsv(safeHex)

  const [open, setOpen] = useState(false)
  const [hsv, setHsv] = useState(initialHsv)
  const [hexDraft, setHexDraft] = useState(safeHex)
  const [copied, setCopied] = useState(false)
  const [pos, setPos] = useState<PopoverPos | null>(null)

  useEffect(() => {
    const norm = normalizeHex(value)
    if (norm) {
      setHsv(hexToHsv(norm))
      setHexDraft(norm)
    }
  }, [value])

  const measure = useCallback((): PopoverPos | null => {
    const el = triggerRef.current
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
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const applyHsv = useCallback(
    (nextH: number, nextS: number, nextV: number) => {
      const clamped = {
        h: Math.max(0, Math.min(360, Math.round(nextH))),
        s: Math.max(0, Math.min(100, Math.round(nextS))),
        v: Math.max(0, Math.min(100, Math.round(nextV))),
      }
      setHsv(clamped)
      const nextHex = hsvToHex(clamped.h, clamped.s, clamped.v)
      setHexDraft(nextHex)
      onChange(nextHex)
    },
    [onChange],
  )

  const handleSpectrumPointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = spectrumRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const width = rect.width || 240
      const height = rect.height || 120
      const relX = Math.max(0, Math.min(1, (clientX - rect.left) / width))
      const relY = Math.max(0, Math.min(1, (clientY - rect.top) / height))
      applyHsv(hsv.h, relX * 100, (1 - relY) * 100)
    },
    [hsv.h, applyHsv],
  )

  const harmonious = useMemo(() => generateHarmoniousColors(safeHex), [safeHex])
  const hslLabel = useMemo(() => hexToHslString(safeHex), [safeHex])

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
    try {
      void navigator.clipboard?.writeText(safeHex)
    } catch {
      // clipboard unavailable in test env
    }
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel ?? `Pick colour ${safeHex}`}
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border bg-white text-xs font-medium text-gray-800 transition-all shadow-sm ${
          open
            ? 'border-primary ring-2 ring-primary/25'
            : 'border-gray-200 hover:border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          aria-hidden="true"
          className="w-5 h-5 rounded-md border border-black/10 shadow-inner shrink-0"
          style={{ backgroundColor: safeHex }}
        />
        <span className="font-mono text-[11px] tracking-tight text-gray-700">
          {safeHex}
        </span>
        <Pipette size={12} className="text-gray-400" />
      </button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && pos && (
              <motion.div
                ref={popoverRef}
                role="dialog"
                aria-label="Color picker"
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
                className="bg-white border border-gray-200 rounded-xl shadow-xl p-3.5 space-y-3 select-none"
              >
                {/* 2D Saturation / Value Spectrum Canvas */}
                <div
                  ref={spectrumRef}
                  role="slider"
                  aria-label="Color saturation and brightness"
                  aria-valuenow={hsv.s}
                  tabIndex={0}
                  onMouseDown={(e) => {
                    handleSpectrumPointer(e.clientX, e.clientY)
                    const onMove = (mv: MouseEvent) =>
                      handleSpectrumPointer(mv.clientX, mv.clientY)
                    const onUp = () => {
                      window.removeEventListener('mousemove', onMove)
                      window.removeEventListener('mouseup', onUp)
                    }
                    window.addEventListener('mousemove', onMove)
                    window.addEventListener('mouseup', onUp)
                  }}
                  style={{
                    backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
                    backgroundImage:
                      'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)',
                  }}
                  className="relative h-28 w-full rounded-lg cursor-crosshair overflow-hidden border border-black/10"
                >
                  <span
                    style={{
                      left: `${hsv.s}%`,
                      top: `${100 - hsv.v}%`,
                      backgroundColor: safeHex,
                    }}
                    className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-white shadow-md pointer-events-none"
                  />
                </div>

                {/* Hue Slider (0 - 360) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-medium text-gray-500">
                    <span>Hue ({hsv.h}°)</span>
                    <span className="font-mono text-gray-400">{hslLabel}</span>
                  </div>
                  <input
                    type="range"
                    aria-label="Hue"
                    min={0}
                    max={360}
                    value={hsv.h}
                    onChange={(e) => applyHsv(Number(e.target.value), hsv.s, hsv.v)}
                    style={{
                      background:
                        'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                    }}
                    className="w-full h-2.5 rounded-full appearance-none cursor-pointer"
                  />
                </div>

                {/* Cult UI Harmonious Colors Row */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    <Sparkles size={11} className="text-primary" />
                    Harmonious Palette
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {harmonious.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        aria-label={`Use harmonious colour ${item.hex} (${item.label})`}
                        onClick={() => {
                          setHexDraft(item.hex)
                          setHsv(hexToHsv(item.hex))
                          onChange(item.hex)
                        }}
                        className="group flex flex-col items-center gap-1 p-1 rounded-lg border border-gray-100 hover:border-gray-300 transition-colors"
                      >
                        <span
                          className="w-full h-5 rounded-md border border-black/10"
                          style={{ backgroundColor: item.hex }}
                        />
                        <span className="font-mono text-[9px] text-gray-500 group-hover:text-gray-800">
                          {item.hex}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Curated Swatches */}
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Brand & Campaign Swatches
                  </span>
                  <div className="grid grid-cols-6 gap-1.5">
                    {BRAND_COLOR_SWATCHES.map((swatch) => {
                      const active = swatch.toUpperCase() === safeHex.toUpperCase()
                      return (
                        <button
                          key={swatch}
                          type="button"
                          aria-label={`Select swatch ${swatch}`}
                          onClick={() => {
                            setHexDraft(swatch)
                            setHsv(hexToHsv(swatch))
                            onChange(swatch)
                          }}
                          style={{ backgroundColor: swatch }}
                          className={`h-6 w-full rounded-md border flex items-center justify-center transition-transform hover:scale-105 ${
                            active
                              ? 'border-gray-900 ring-2 ring-primary/40'
                              : 'border-black/10'
                          }`}
                        >
                          {active && <Check size={12} className="text-white drop-shadow" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Live HEX Input & Copy */}
                <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                  <span
                    className="w-7 h-7 rounded-lg border border-black/10 shrink-0"
                    style={{ backgroundColor: safeHex }}
                  />
                  <input
                    type="text"
                    aria-label="Hex colour"
                    value={hexDraft}
                    maxLength={7}
                    onChange={(e) => {
                      const raw = e.target.value
                      setHexDraft(raw)
                      const norm = normalizeHex(raw)
                      if (norm) {
                        setHsv(hexToHsv(norm))
                        onChange(norm)
                      }
                    }}
                    placeholder="#EB6522"
                    className="flex-1 min-w-0 px-2.5 py-1.5 border border-gray-200 rounded-lg font-mono text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <button
                    type="button"
                    aria-label="Copy hex colour"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11px] font-medium text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
                  >
                    {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  )
}

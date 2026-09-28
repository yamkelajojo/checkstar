'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';
import { spring, ease, time } from '@/lib/motion/tokens';

/**
 * Select — Checkstar's styled, animated dropdown.
 *
 * The native <select> popup is painted by the operating system: a grey menu
 * that ignores typography, colour and motion. Every select in the app uses
 * this component instead.
 *
 * Behaviour:
 *   - trigger is a real <button role="combobox">, so `<label htmlFor>` keeps
 *     working (buttons are labelable elements) and focus management is native;
 *   - the menu renders through a portal, positioned against the trigger, so it
 *     never gets clipped by overflow-x-auto admin tables and can flip upward
 *     when there is no room below;
 *   - full keyboard support: Enter/Space/arrows/Home/End/Escape, with
 *     letter type-ahead; disabled options are skipped;
 *   - entrance is one choreographed gesture — the panel settles in while the
 *     options cascade after it, using the shared motion tokens.
 */

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  /** Forwarded to the trigger — lets `<label htmlFor>` address the field. */
  id?: string;
  /** Accessible name when there is no visible <label>. */
  ariaLabel?: string;
  /** Shown while `value` matches no option (e.g. "" / ""/ loading). */
  placeholder?: string;
  /** Optional left icon (auth + cart fields use one). */
  icon?: React.ReactNode;
  size?: 'md' | 'sm' | 'xs';
  disabled?: boolean;
  /** Extra trigger classes (defaults to w-full). */
  className?: string;
  /** Extra menu classes (rare escape hatch, e.g. a fixed width). */
  menuClassName?: string;
}

const MENU_MAX_H = 264;
const MENU_GAP = 6;
const MENU_Z = 120;

const sizeStyles = {
  md: {
    trigger: 'py-2.5 text-sm',
    option: 'py-2.5 px-3.5 text-sm',
    icon: 'pl-10',
    iconLeft: 'left-3.5',
  },
  sm: {
    trigger: 'py-1.5 text-xs',
    option: 'py-1.5 px-2.5 text-xs',
    icon: 'pl-9',
    iconLeft: 'left-3',
  },
  xs: {
    trigger: 'py-1 text-xs',
    option: 'py-1 px-2 text-xs',
    icon: 'pl-8',
    iconLeft: 'left-2.5',
  },
} as const;

interface MenuPos {
  top: number;
  left: number;
  width: number;
  up: boolean;
}

export default function Select({
  value,
  onChange,
  options,
  id,
  ariaLabel,
  placeholder = 'Select…',
  icon,
  size = 'md',
  disabled = false,
  className = 'w-full',
  menuClassName = '',
}: SelectProps) {
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const typeBuffer = React.useRef('');
  const typeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = React.useId();

  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const [pos, setPos] = React.useState<MenuPos | null>(null);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;
  const sizes = sizeStyles[size];

  const measure = React.useCallback((): MenuPos | null => {
    const el = triggerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const up =
      spaceBelow < MENU_MAX_H + MENU_GAP + 8 &&
      spaceAbove > spaceBelow &&
      spaceAbove >= 120;
    return {
      top: up ? rect.top - MENU_GAP : rect.bottom + MENU_GAP,
      left: rect.left,
      width: rect.width,
      up,
    };
  }, []);

  const openMenu = React.useCallback(() => {
    if (disabled) return;
    setPos(measure());
    setActive(selectedIndex >= 0 ? selectedIndex : options.findIndex((o) => !o.disabled));
    setOpen(true);
  }, [disabled, measure, options, selectedIndex]);

  const closeMenu = React.useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  const commit = React.useCallback(
    (index: number) => {
      const option = options[index];
      if (!option || option.disabled) return;
      onChange(option.value);
      closeMenu();
    },
    [closeMenu, onChange, options],
  );

  /** Next enabled option index in a direction, wrapping around. */
  const moveActive = React.useCallback(
    (from: number, dir: 1 | -1): number => {
      const n = options.length;
      let i = from;
      for (let step = 0; step < n; step += 1) {
        i = (i + dir + n) % n;
        if (!options[i].disabled) return i;
      }
      return from;
    },
    [options],
  );

  // Keep the menu glued to its trigger while the page scrolls (capture phase
  // catches inner scroll containers too) or the window resizes.
  React.useEffect(() => {
    if (!open) return;
    const reposition = () => setPos(measure());
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open, measure]);

  // Dismiss on any press outside trigger + menu.
  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: Event) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      closeMenu(false);
    };
    // pointerdown dismisses the instant the press lands outside; mousedown and
    // click keep environments without pointer events (and synthetic test
    // events) honest. Inside-trigger/menu presses are ignored above.
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('click', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('click', onPointerDown);
    };
  }, [open, closeMenu]);

  // Keep the keyboard-highlighted option in view.
  React.useEffect(() => {
    if (!open || active < 0) return;
    const el = document.getElementById(`${menuId}-opt-${active}`);
    el?.scrollIntoView?.({ block: 'nearest' }); // scrollIntoView is absent in jsdom
  }, [open, active, menuId]);

  React.useEffect(() => {
    return () => {
      if (typeTimer.current) clearTimeout(typeTimer.current);
    };
  }, []);

  const typeAhead = (char: string) => {
    typeBuffer.current += char.toLowerCase();
    if (typeTimer.current) clearTimeout(typeTimer.current);
    typeTimer.current = setTimeout(() => {
      typeBuffer.current = '';
    }, 500);
    const n = options.length;
    for (let step = 1; step <= n; step += 1) {
      const i = (active + step) % n;
      const option = options[i];
      if (!option.disabled && option.label.toLowerCase().startsWith(typeBuffer.current)) {
        setActive(i);
        return;
      }
    }
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((i) => moveActive(i < 0 ? 0 : i, 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((i) => moveActive(i < 0 ? 0 : i, -1));
        break;
      case 'Home':
        e.preventDefault();
        setActive(options.findIndex((o) => !o.disabled));
        break;
      case 'End': {
        e.preventDefault();
        for (let i = options.length - 1; i >= 0; i -= 1) {
          if (!options[i].disabled) {
            setActive(i);
            break;
          }
        }
        break;
      }
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (active >= 0) commit(active);
        break;
      case 'Escape':
        e.preventDefault();
        closeMenu();
        break;
      case 'Tab':
        closeMenu(false);
        break;
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) {
          e.preventDefault();
          typeAhead(e.key);
        }
    }
  };

  const chevron = (
    <motion.span
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ type: 'spring', ...spring.snap }}
      className="shrink-0 text-gray-400"
      aria-hidden="true"
    >
      <ChevronDown size={size === 'md' ? 16 : 14} />
    </motion.span>
  );

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      id={id}
      disabled={disabled}
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-controls={open ? `${menuId}-listbox` : undefined}
      aria-activedescendant={open && active >= 0 ? `${menuId}-opt-${active}` : undefined}
      aria-label={ariaLabel}
      onClick={() => (open ? closeMenu() : openMenu())}
      onKeyDown={onTriggerKeyDown}
      className={`${className} ${sizes.trigger} ${icon ? sizes.icon : size === 'md' ? 'pl-3.5' : size === 'sm' ? 'pl-2.5' : 'pl-2'} pr-8 border border-gray-200 rounded-lg bg-white text-left flex items-center gap-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 relative`}
    >
      {icon && (
        <span className="absolute top-1/2 -translate-y-1/2 text-gray-400" style={{ left: size === 'md' ? '0.875rem' : '0.625rem' }} aria-hidden="true">
          {icon}
        </span>
      )}
      <span className={`flex-1 truncate ${selected ? 'text-gray-700' : 'text-gray-400'}`}>
        {selected ? selected.label : placeholder}
      </span>
      {chevron}
    </button>
  );

  if (typeof window === 'undefined') {
    return <div className="relative">{trigger}</div>;
  }

  return (
    <div className="relative">
      {trigger}
      {open &&
        createPortal(
          <AnimatePresence>
            <motion.div
              key="menu"
              ref={menuRef}
              id={`${menuId}-listbox`}
              role="listbox"
              aria-label={ariaLabel}
              style={{
                position: 'fixed',
                top: pos ? (pos.up ? undefined : pos.top) : undefined,
                bottom: pos?.up ? window.innerHeight - pos.top : undefined,
                left: pos?.left ?? 0,
                width: pos?.width ?? 'auto',
                maxHeight: MENU_MAX_H,
                transformOrigin: pos?.up ? 'bottom' : 'top',
                zIndex: MENU_Z,
              }}
              initial={{ opacity: 0, y: pos?.up ? 6 : -6, scale: 0.98 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: time.base, ease: ease.apple },
              }}
              exit={{
                opacity: 0,
                y: pos?.up ? 6 : -4,
                scale: 0.98,
                transition: { duration: time.instant, ease: ease.accelerate },
              }}
              className={`overflow-auto overscroll-contain bg-white rounded-xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.05)] p-1 ${menuClassName}`}
            >
              {options.map((option, i) => {
                const isSelected = option.value === value;
                const isActive = i === active;
                return (
                  <button
                    key={option.value}
                    type="button"
                    id={`${menuId}-opt-${i}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled || undefined}
                    onClick={() => {
                      if (option.disabled) return;
                      commit(i);
                    }}
                    onPointerEnter={() => {
                      if (!option.disabled) setActive(i);
                    }}
                    className={`${sizes.option} w-full flex items-center justify-between gap-2 text-left rounded-lg transition-colors ${
                      isActive ? 'bg-gray-50' : ''
                    } ${option.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${
                      isSelected ? 'text-primary font-medium' : 'text-gray-700'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            transition: { type: 'spring', ...spring.snap },
                          }}
                          exit={{ opacity: 0, transition: { duration: time.instant } }}
                          className="text-primary shrink-0"
                          aria-hidden="true"
                        >
                          <Check size={size === 'md' ? 16 : 14} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

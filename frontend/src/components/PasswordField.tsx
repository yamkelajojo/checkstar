'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { spring, ease, time } from '@/lib/motion/tokens';

/**
 * PasswordField — Checkstar's password input with a single, animated reveal toggle.
 *
 * Why a shared component? Windows Chromium injects its own "reveal" eye into
 * password inputs (the `::-ms-reveal` pseudo-element). With a per-page button,
 * riders and customers saw two eyes. The custom toggle lives here once, and
 * globals.css suppresses the native one for every password input:
 *
 *   input[type='password']::-ms-reveal, ::-ms-clear { display: none; }
 *
 * The reveal transition is deliberately ONE crisp gesture: the icon flips
 * (Eye ⇄ EyeOff) on the shared spring token while the input type swaps in
 * the same instant — a single `show` state drives both, so they can never
 * desync. No blur, no fade on the field itself: the text always stays sharp.
 */

export interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  autoFocus?: boolean;
  /** Left lock icon — used on the login form's prominent field. */
  showIcon?: boolean;
  onEnter?: () => void;
  /** Progressive enhancement only — the API enforces strength rules too. */
  minLength?: number;
}

/** Icon flip: springy arrival, quick exit so the two states trade places crisply. */
const iconEnter = {
  opacity: 1,
  scale: 1,
  rotate: 0,
  transition: { type: 'spring' as const, ...spring.snap },
};
const iconExit = {
  opacity: 0,
  scale: 0.55,
  rotate: 40,
  transition: { duration: time.instant, ease: ease.accelerate },
};

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder = '••••••••',
  autoComplete = 'current-password',
  required = true,
  autoFocus = false,
  showIcon = false,
  onEnter,
  minLength,
}: PasswordFieldProps) {
  const [show, setShow] = React.useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {/* Static adornment: never fades, never hides, whatever the reveal state. */}
        {showIcon && (
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        )}
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') onEnter?.();
          }}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          minLength={minLength}
          className={`w-full ${showIcon ? 'pl-10' : 'pl-3.5'} pr-12 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none`}
        />
        {/* The ONLY reveal control for this field — type="button" so it never submits forms. */}
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          title={show ? 'Hide password' : 'Show password'}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600"
        >
          {/* Fixed-size stage so the exiting and entering icons trade places without layout shift. */}
          <span className="relative w-4 h-4 block" aria-hidden="true">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={show ? 'eye-off' : 'eye'}
                initial={{ opacity: 0, scale: 0.55, rotate: -40 }}
                animate={iconEnter}
                exit={iconExit}
                className="absolute inset-0 flex items-center justify-center"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </motion.span>
            </AnimatePresence>
          </span>
        </button>
      </div>
    </div>
  );
}

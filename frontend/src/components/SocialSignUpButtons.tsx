'use client';

import React from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

/**
 * SocialSignUpButtons — decorative "Sign up with Google / Apple" affordances.
 *
 * Deliberately non-functional for the prototype: clicking one only raises a
 * toast explaining the option is coming soon. No auth flow is triggered.
 *
 * The brand glyphs are rendered single-colour (`currentColor`) on purpose —
 * Google's full-colour "G" and Apple's jet-black mark visually overpower the
 * warm Checkstar palette, so we keep them quiet, monochrome and secondary.
 */

export function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z" />
    </svg>
  );
}

export function AppleMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.03 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09ZM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.702Z" />
    </svg>
  );
}

const buttonClass =
  'w-full flex items-center justify-center gap-2.5 border border-gray-200 bg-white rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors';

export default function SocialSignUpButtons() {
  const announce = (provider: string) => {
    toast.info(`${provider} sign-up is coming soon — use your email for now.`);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => announce('Google')}
          className={buttonClass}
        >
          <span className="text-gray-600"><GoogleMark /></span>
          Sign up with Google
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => announce('Apple')}
          className={buttonClass}
        >
          <span className="text-gray-800"><AppleMark /></span>
          Sign up with Apple
        </motion.button>
      </div>

      {/* Divider — keeps the decorative options clearly separate from the real form */}
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-xs uppercase tracking-wide text-gray-400">or continue with email</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>
    </div>
  );
}

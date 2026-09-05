'use client';

import React from 'react';

const STAR_WING_PATH =
  'M 18 252 C 68 226 108 214 150 214 C 192 214 234 232 258 262 C 224 248 188 241 150 241 C 112 241 64 247 18 252 Z';
const STAR_CHECK_PATH =
  'M 108 348 C 99 262 91 170 93 86 C 105 128 119 152 133 173 C 172 118 222 58 277 15 C 214 98 149 222 108 348 Z';

export interface LogoProps {
  variant?: 'stacked' | 'lockup';
  size?: number;
  tone?: 'light' | 'dark';
  className?: string;
}

function StarIcon({ size, tone }: { size: number; tone: 'light' | 'dark' }) {
  const wingFill = tone === 'dark' ? '#1B1816' : '#FFFCF9';
  const checkColor = '#EB6522';
  return (
    <svg width={size} height={size} viewBox="0 0 300 400" aria-label="Checkstar star icon" fill="none">
      <path d={STAR_WING_PATH} fill={wingFill} />
      <path d={STAR_CHECK_PATH} fill={checkColor} />
    </svg>
  );
}

export function Logo({ variant = 'lockup', size = 28, tone = 'dark', className }: LogoProps) {
  // Start hidden: the server cannot know the restored scroll position, so a
  // visible-at-SSR tagline painted itself onto reload-while-scrolled pages and
  // vanished right after hydration (the "appears on startup, then moves"
  // jump). Post-hydration evaluation below fades it in only when truly at the
  // top of the page, and the fade never participates in layout (see Wordmark).
  const [showTagline, setShowTagline] = React.useState(false);
  const iconSize = size * 1.7;
  const wordSize = variant === 'stacked' ? size : size * 0.82;
  const color = tone === 'dark' ? '#1B1816' : '#FFFCF9';

  React.useEffect(() => {
    const handleScroll = () => {
      setShowTagline(window.scrollY <= 80);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center ${className || ''}`}>
        <StarIcon size={iconSize} tone={tone} />
        <Wordmark tone={tone} size={wordSize} showTagline={showTagline} />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className || ''}`}>
      <StarIcon size={size} tone={tone} />
      <Wordmark tone={tone} size={wordSize} showTagline={showTagline} />
    </div>
  );
}

function Wordmark({ tone, size, showTagline }: { tone: 'light' | 'dark'; size: number; showTagline: boolean }) {
  const color = tone === 'dark' ? '#1B1816' : '#FFFCF9';
  return (
    <div className="relative flex flex-col leading-none">
      <span
        className="font-extrabold tracking-tight"
        style={{
          fontSize: size,
          lineHeight: `${(size * 1.05).toFixed(2)}px`,
          letterSpacing: '-0.4px',
          color,
        }}
      >
        <span style={{ color: '#EB6522' }}>Check</span>
        <span style={{ color }}>star</span>
      </span>
      {/* Absolutely positioned below the wordmark: fading it in/out must never
          re-flow the lockup or the page. A collapsing in-flow span made the
          wordmark re-centre (the layout jump) on every show/hide. */}
      <span
        className="absolute left-0 top-full mt-[2px] whitespace-nowrap font-normal"
        aria-hidden={!showTagline}
        style={{
          fontSize: size * 0.34,
          color: '#EB6522',
          lineHeight: 1,
          letterSpacing: '0.2px',
          opacity: showTagline ? 1 : 0,
          transition: 'opacity 200ms ease',
          pointerEvents: 'none',
        }}
      >
        cares enough
      </span>
    </div>
  );
}

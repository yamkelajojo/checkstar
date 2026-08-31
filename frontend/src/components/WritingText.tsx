'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from 'motion/react';

interface WritingTextProps {
  text: string;
  className?: string;
  delay?: number;
  speed?: number;
  mode?: 'word' | 'char';
  trigger?: boolean;
}

export default function WritingText({
  text,
  className,
  delay = 0,
  speed = 40,
  mode = 'word',
  trigger = true,
}: WritingTextProps) {
  const shouldReduceMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(0);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const hasStarted = useRef(false);

  const startReveal = useCallback(() => {
    if (hasStarted.current || !trigger) return;
    hasStarted.current = true;

    const total = mode === 'char' ? text.length : text.split(/\s+/).filter(Boolean).length;

    if (shouldReduceMotion) {
      setRevealed(total);
      return;
    }

    const timeout = setTimeout(() => {
      let count = 0;
      const interval = setInterval(() => {
        count += 1;
        if (count >= total) {
          setRevealed(total);
          clearInterval(interval);
        } else {
          setRevealed(count);
        }
      }, speed);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, speed, mode, trigger, delay, shouldReduceMotion]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (inView) {
      const cleanup = startReveal();
      return cleanup;
    }
  }, [inView, startReveal]);

  if (shouldReduceMotion) {
    return <span className={className}>{text}</span>;
  }

  const revealCount = revealed;

  if (mode === 'word') {
    const words = text.split(/\s+/).filter(Boolean);
    return (
      <span ref={ref} className={className}>
        {words.map((word, i) => {
          const visible = i < revealCount;
          return (
            <span
              key={i}
              className="inline"
              style={{
                opacity: visible ? 1 : 0,
                filter: visible ? 'blur(0px)' : 'blur(3px)',
                transition: 'opacity 0.3s ease, filter 0.3s ease',
              }}
            >
              {word}{' '}
            </span>
          );
        })}
      </span>
    );
  }

  // Char mode
  const chars = text.split('');
  return (
    <span ref={ref} className={className}>
      {chars.map((char, i) => {
        const visible = i < revealCount;
        return (
          <span
            key={i}
            style={{
              opacity: visible ? 1 : 0,
              filter: visible ? 'blur(0px)' : 'blur(4px)',
              transition: 'opacity 0.15s ease, filter 0.15s ease',
            }}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}

import React from "react";

/**
 * Shared test double for `motion/react`.
 *
 * Component tests want the DOM the animation library would produce, not the
 * animation. This renders every `motion.<tag>` as a plain `<tag>`, drops the
 * animation-only props, forwards refs, and keeps `useReducedMotion` false and
 * `AnimatePresence` transparent so mounted content is queryable.
 *
 * One component instance is cached per tag: returning a fresh `forwardRef` on
 * every property access would give React a new element type each render and
 * remount the tree (effects would loop).
 *
 * Usage in a test file:
 *   vi.mock("motion/react", async () => (await import("@/test/motion-mock")).default)
 */
const cache = new Map<string, React.ElementType>();

/** Animation-only props that must not reach the DOM as attributes. */
const ANIMATION_PROPS = [
  "initial",
  "animate",
  "exit",
  "whileInView",
  "whileHover",
  "whileTap",
  "whileFocus",
  "whileDrag",
  "viewport",
  "transition",
  "variants",
  "layout",
  "layoutId",
  "drag",
  "dragConstraints",
  "onAnimationComplete",
] as const;

function createMotionComponent(tag: string) {
  const Component = React.forwardRef((props: any, ref: any) => {
    const rest: Record<string, unknown> = { ...props };
    ANIMATION_PROPS.forEach((key) => delete rest[key]);
    return React.createElement(tag, { ...rest, ref });
  });
  Component.displayName = `motion.${tag}`;
  return Component;
}

const motion = new Proxy({} as Record<string, React.ElementType>, {
  get: (_target, tag: string) => {
    if (!cache.has(tag)) cache.set(tag, createMotionComponent(tag));
    return cache.get(tag)!;
  },
});

function AnimatePresence({ children }: { children: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children);
}
AnimatePresence.displayName = "AnimatePresence";

const motionMock = {
  motion,
  AnimatePresence,
  useReducedMotion: () => false,
};

export default motionMock;

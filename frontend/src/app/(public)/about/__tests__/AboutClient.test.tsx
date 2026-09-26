import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";

const motionProps = new Set([
  "custom",
  "initial",
  "whileInView",
  "animate",
  "variants",
  "viewport",
  "transition",
]);

function motionElement(tag: string) {
  return function MotionElementMock({
    children,
    ...props
  }: Record<string, unknown> & { children?: ReactNode }) {
    const domProps = Object.fromEntries(
      Object.entries(props).filter(([key]) => !motionProps.has(key)),
    );
    return createElement(tag, domProps, children);
  };
}

vi.mock("motion/react", () => ({
  motion: new Proxy({}, { get: (_target, tag: string) => motionElement(tag) }),
  useScroll: () => ({ scrollYProgress: 0 }),
  useSpring: (value: number) => value,
}));

vi.mock("@/components/WritingText", () => ({
  default: ({ text }: { text: string }) => <span>{text}</span>,
}));

vi.mock("@/components/CurvyUnderline", () => ({
  default: () => null,
}));

vi.mock("@/lib/query", () => ({
  useCommunityPosts: () => ({ data: [], isLoading: false, error: null }),
}));

import AboutClient from "../AboutClient";

describe("AboutClient", () => {
  it("removes the stakeholder section while retaining the story and timeline", () => {
    render(<AboutClient />);

    expect(
      screen.queryByRole("heading", { name: "Our Stakeholders" }),
    ).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Our Story" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Our Timeline" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Our Community" }),
    ).toBeInTheDocument();
    expect(
      screen
        .getByRole("heading", { name: "Our Timeline" })
        .compareDocumentPosition(
          screen.getByRole("heading", { name: "Our Community" }),
        ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("motion/react", async () => {
  const mock = (await import("@/test/motion-mock")).default;
  return {
    ...mock,
    useScroll: () => ({ scrollYProgress: 0 }),
    useSpring: (value: number) => value,
  };
});

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

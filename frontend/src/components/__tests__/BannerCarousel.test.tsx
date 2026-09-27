import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";

/**
 * BannerCarousel — the homepage hero. It is the one component on the storefront
 * that moves by itself, so the tests concentrate on the things that make
 * autoplay acceptable: it pauses for pointer and keyboard users, it never runs
 * for people who asked for reduced motion, it can be stopped permanently, and
 * every slide is reachable by hand through arrows and dots.
 */

vi.mock("motion/react", () => {
  const cache = new Map<string, any>();
  return {
    motion: new Proxy(
      {},
      {
        get: (_t, tag: string) => {
          if (!cache.has(tag)) {
            cache.set(
              tag,
              React.forwardRef((props: any, ref: any) => {
                const {
                  initial,
                  animate,
                  exit,
                  whileInView,
                  whileHover,
                  whileTap,
                  viewport,
                  transition,
                  variants,
                  layout,
                  ...rest
                } = props;
                return React.createElement(tag, { ...rest, ref });
              }),
            );
          }
          return cache.get(tag);
        },
      },
    ),
    useReducedMotion: () => false,
    AnimatePresence: ({ children }: any) => children,
  };
});

import { BannerCarousel } from "../BannerCarousel";

const banners = [
  {
    id: 1,
    name: "Winter Specials",
    slides: [
      {
        title: "Half price on spinach",
        subtitle: "This week only",
        ctaLabel: "Shop the special",
        url: "/specials/winter",
        bgType: "gradient" as const,
        colors: ["#EB6522", "#262D3A"],
        pattern: "dots",
      },
      {
        title: "Free delivery over R 300",
        bgType: "solid" as const,
        colors: ["#262D3A"],
      },
    ],
  },
  {
    id: 2,
    name: "Bakery",
    slides: [
      {
        title: "Fresh bread daily",
        ctaLabel: "See the bakery",
        url: "/categories/bakery",
        bgType: "radial" as const,
        colors: ["#F6D7B0", "#EB6522"],
      },
    ],
  },
];

const region = () => screen.getByRole("region", { name: "Promotional banners" });

/**
 * Install a matchMedia double. A plain function rather than vi.fn() so
 * vi.restoreAllMocks() in another test cannot empty its implementation.
 */
const installMatchMedia = (reducedMotion: boolean) => {
  window.matchMedia = ((query: string) => ({
    matches: reducedMotion && /prefers-reduced-motion/.test(query),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
};

beforeEach(() => {
  vi.useRealTimers();
  installMatchMedia(false);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("BannerCarousel rendering", () => {
  it("renders nothing when there are no banners", () => {
    const { container } = render(<BannerCarousel banners={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when every banner has an empty slide list", () => {
    const { container } = render(
      <BannerCarousel banners={[{ id: 9, name: "Draft", slides: [] }]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("skips banners without slides instead of crashing on them", () => {
    render(
      <BannerCarousel
        banners={[{ id: 9, name: "Draft", slides: [] }, ...banners]}
      />,
    );
    expect(screen.getByText("Half price on spinach")).toBeTruthy();
  });

  it("labels itself as a promotional region", () => {
    render(<BannerCarousel banners={banners} />);
    expect(region()).toBeTruthy();
  });

  it("shows the first slide's eyebrow, headline and CTA link", () => {
    render(<BannerCarousel banners={banners} />);

    expect(screen.getByText("This week only")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Half price on spinach" })).toBeTruthy();
    const cta = screen.getByRole("link", { name: "Shop the special" });
    expect(cta.getAttribute("href")).toBe("/specials/winter");
  });

  it("renders no link when a slide has no destination (no dead CTA)", () => {
    render(<BannerCarousel banners={banners} />);
    fireEvent.click(screen.getByLabelText("Next slide"));

    expect(screen.getByText("Free delivery over R 300")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("paints the slide background the editor chose", () => {
    render(<BannerCarousel banners={banners} />);
    expect(region().getAttribute("style")).toContain(
      "linear-gradient(135deg, #EB6522, #262D3A)",
    );

    fireEvent.click(screen.getByLabelText("Next slide"));
    expect(region().getAttribute("style")).toContain("rgb(38, 45, 58)");
  });

  it("paints a radial background when the editor picked radial", () => {
    render(<BannerCarousel banners={[banners[1]]} />);
    expect(region().getAttribute("style")).toContain("radial-gradient(circle");
  });

  it("keeps a slide on screen when the banner list shrinks under the visitor", () => {
    // An operator unpublishes a banner while someone is parked on its slide.
    // The carousel used to keep the stale index and render NOTHING — the whole
    // homepage hero disappeared until the next click.
    const { rerender } = render(<BannerCarousel banners={banners} />);
    fireEvent.click(screen.getAllByRole("tab")[2]);
    expect(screen.getByText("Fresh bread daily")).toBeTruthy();

    rerender(<BannerCarousel banners={[banners[0]]} />);

    expect(region()).toBeTruthy();
    expect(screen.getByText("Half price on spinach")).toBeTruthy();
  });

  it("marks the decorative pattern layer as hidden from assistive tech", () => {
    const { container } = render(<BannerCarousel banners={banners} />);
    const pattern = container.querySelector('[aria-hidden="true"]');
    expect(pattern).toBeTruthy();
  });
});

describe("BannerCarousel manual navigation", () => {
  it("steps through slides, then wraps to the next banner", () => {
    render(<BannerCarousel banners={banners} />);

    fireEvent.click(screen.getByLabelText("Next slide"));
    expect(screen.getByText("Free delivery over R 300")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Next slide"));
    expect(screen.getByText("Fresh bread daily")).toBeTruthy();

    // Last banner, last slide → back to the very first.
    fireEvent.click(screen.getByLabelText("Next slide"));
    expect(screen.getByText("Half price on spinach")).toBeTruthy();
  });

  it("steps backwards and wraps to the last banner's last slide", () => {
    render(<BannerCarousel banners={banners} />);

    fireEvent.click(screen.getByLabelText("Previous slide"));
    expect(screen.getByText("Fresh bread daily")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Previous slide"));
    expect(screen.getByText("Free delivery over R 300")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Previous slide"));
    expect(screen.getByText("Half price on spinach")).toBeTruthy();
  });

  it("exposes one dot per slide and jumps to whichever is clicked", () => {
    render(<BannerCarousel banners={banners} />);

    const dots = screen.getAllByRole("tab");
    expect(dots).toHaveLength(3);
    expect(dots[0].getAttribute("aria-selected")).toBe("true");
    expect(dots[1].getAttribute("aria-selected")).toBe("false");
    expect(dots[2].getAttribute("aria-label")).toBe("Slide 1 of banner 2");

    fireEvent.click(dots[2]);
    expect(screen.getByText("Fresh bread daily")).toBeTruthy();
    expect(screen.getAllByRole("tab")[2].getAttribute("aria-selected")).toBe("true");
  });
});

describe("BannerCarousel autoplay", () => {
  it("advances on its own after five seconds", () => {
    vi.useFakeTimers();
    render(<BannerCarousel banners={banners} />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText("Free delivery over R 300")).toBeTruthy();
  });

  it("pauses for a pointer over the banner", () => {
    vi.useFakeTimers();
    render(<BannerCarousel banners={banners} />);

    fireEvent.mouseEnter(region());
    act(() => {
      vi.advanceTimersByTime(15000);
    });

    expect(screen.getByText("Half price on spinach")).toBeTruthy();

    // Leaving hands control back to the carousel.
    fireEvent.mouseLeave(region());
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText("Free delivery over R 300")).toBeTruthy();
  });

  it("pauses while a control has keyboard focus", () => {
    vi.useFakeTimers();
    render(<BannerCarousel banners={banners} />);

    fireEvent.focus(region());
    act(() => {
      vi.advanceTimersByTime(20000);
    });

    expect(screen.getByText("Half price on spinach")).toBeTruthy();
  });

  it("does not autoplay for visitors who asked for reduced motion", () => {
    vi.useFakeTimers();
    installMatchMedia(true);

    render(<BannerCarousel banners={banners} />);
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(screen.getByText("Half price on spinach")).toBeTruthy();
    // Arrows still work: reduced motion removes the timer, not the content.
    fireEvent.click(screen.getByLabelText("Next slide"));
    expect(screen.getByText("Free delivery over R 300")).toBeTruthy();
  });

  it("offers an explicit pause/resume control and honours it", () => {
    vi.useFakeTimers();
    render(<BannerCarousel banners={banners} />);

    const pauseButton = screen.getByLabelText("Pause autoplay");
    fireEvent.click(pauseButton);

    expect(screen.getByLabelText("Resume autoplay")).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(screen.getByText("Half price on spinach")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Resume autoplay"));
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText("Free delivery over R 300")).toBeTruthy();
  });
});

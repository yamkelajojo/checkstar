import { describe, it, expect } from "vitest";
import { isNavLinkActive, navLinks } from "@/lib/navigation";

describe("navLinks", () => {
  it("keeps the public header tabs in the requested order", () => {
    expect(navLinks.map((link) => link.label)).toEqual([
      "Home",
      "Products",
      "Specials",
      "Stores",
      "Recipes",
      "About",
      "Contact",
    ]);
  });
});

describe("isNavLinkActive", () => {
  it("marks the home link active only on the exact home path", () => {
    expect(isNavLinkActive("/", "/")).toBe(true);
    expect(isNavLinkActive("/products", "/")).toBe(false);
    expect(isNavLinkActive("/products/banting-revolution", "/")).toBe(false);
  });

  it("marks a section link active on its exact path", () => {
    expect(isNavLinkActive("/products", "/products")).toBe(true);
    expect(isNavLinkActive("/about", "/about")).toBe(true);
  });

  it("marks a section link active on nested paths beneath it", () => {
    expect(
      isNavLinkActive("/products/banting-revolution-lime", "/products"),
    ).toBe(true);
    expect(isNavLinkActive("/recipes/braai-bredie", "/recipes")).toBe(true);
    expect(isNavLinkActive("/stores/durban-central", "/stores")).toBe(true);
  });

  it("does not mark a link active for a sibling or unrelated path", () => {
    expect(isNavLinkActive("/specialss", "/specials")).toBe(false);
    expect(isNavLinkActive("/recipes", "/products")).toBe(false);
    expect(isNavLinkActive("/", "/contact")).toBe(false);
  });
});

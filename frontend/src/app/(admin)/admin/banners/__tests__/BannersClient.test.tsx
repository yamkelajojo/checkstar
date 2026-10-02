import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import BannersClient from "../BannersClient";

/**
 * Banner manager (gate G7).
 *
 * The banner editor drives the home-page rotation, so the contract that
 * matters is: nothing is sent to the API until the form is actually valid,
 * the payload is trimmed/normalised, edits go to the right banner id, and a
 * failed save is reported *in the form* (the modal must stay open so the
 * editor does not lose what they typed).
 */

const { authState, setAuth, apiMocks } = vi.hoisted(() => {
  const authStateRef = {
    user: null as Record<string, unknown> | null,
    isAuthenticated: true,
    isLoading: false,
  };
  return {
    authState: authStateRef,
    setAuth: (user: Record<string, unknown> | null) => {
      authStateRef.user = user;
      authStateRef.isAuthenticated = !!user;
    },
    apiMocks: {
      getAdminBanners: vi.fn(),
      createBanner: vi.fn(),
      updateBanner: vi.fn(),
      deleteBanner: vi.fn(),
      // not used by this component — keep the mocked api surface complete
      getMessages: vi.fn(),
      getAdminHealth: vi.fn(),
    },
  };
});

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: (selector?: (s: unknown) => unknown) =>
    selector ? selector(authState as never) : authState,
}));

vi.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public readonly status: number,
      public readonly payload?: unknown,
    ) {
      super(message);
    }
  },
  api: apiMocks,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

const SLIDE = {
  title: "Half price citrus",
  subtitle: "This weekend only",
  ctaLabel: "Shop now",
  url: "/products?category=fruits-vegetables",
  bgType: "gradient",
  colors: ["#EB6522", "#CC4400"],
  pattern: "",
};

const BANNER = {
  id: 7,
  name: "Spring Freshness",
  status: "published",
  slides: [SLIDE],
  store: null,
  special: null,
  start_date: "2026-09-01T00:00:00Z",
  end_date: "2026-09-30T00:00:00Z",
};

const OWNER = {
  id: 2,
  name: "Thandi Owner",
  email: "owner@x.co.za",
  role: "store_owner",
};

function renderClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BannersClient />
    </QueryClientProvider>,
  );
}

/** Opens the create form from the list header. */
async function openCreateForm() {
  fireEvent.click(screen.getByRole("button", { name: /New Banner/i }));
  return await screen.findByPlaceholderText("Banner name *");
}

beforeEach(() => {
  vi.clearAllMocks();
  setAuth(OWNER);
  apiMocks.getAdminBanners.mockResolvedValue({ data: [BANNER] });
  apiMocks.createBanner.mockResolvedValue({ data: { ...BANNER, id: 8 } });
  apiMocks.updateBanner.mockResolvedValue({ data: BANNER });
  apiMocks.deleteBanner.mockResolvedValue({ data: { success: true } });
});

describe("BannersClient — access", () => {
  it("gates the manager to banner-capable roles without calling the API", async () => {
    setAuth({ id: 5, name: "Logi", email: "logi@x.co.za", role: "logistics_officer" });

    renderClient();

    expect(await screen.findByText("Banner access only")).toBeInTheDocument();
    expect(apiMocks.getAdminBanners).not.toHaveBeenCalled();
  });

  it("loads banners for a store owner", async () => {
    renderClient();

    expect(await screen.findByText("Spring Freshness")).toBeInTheDocument();
    expect(apiMocks.getAdminBanners).toHaveBeenCalledTimes(1);
    // Slide count + schedule are summarised on the card.
    expect(screen.getByText(/1 slide/)).toBeInTheDocument();
  });

  it("offers a create action from the empty state", async () => {
    apiMocks.getAdminBanners.mockResolvedValue({ data: [] });

    renderClient();

    expect(await screen.findByText("No banners yet")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Create Banner/i }));
    expect(await screen.findByPlaceholderText("Banner name *")).toBeInTheDocument();
  });
});

describe("BannersClient — create validation", () => {
  it("keeps Save disabled until a name is typed", async () => {
    renderClient();
    await openCreateForm();

    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("Banner name *"), {
      target: { value: "Weekend Specials" },
    });

    expect(screen.getByRole("button", { name: "Create" })).not.toBeDisabled();
  });

  it("rejects a whitespace-only name and does not call the API", async () => {
    renderClient();
    await openCreateForm();

    fireEvent.change(screen.getByPlaceholderText("Banner name *"), {
      target: { value: "   " },
    });
    fireEvent.change(screen.getByPlaceholderText("Title *"), {
      target: { value: "Citrus" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Banner name is required",
    );
    expect(apiMocks.createBanner).not.toHaveBeenCalled();
  });

  it("requires every slide to have a title", async () => {
    renderClient();
    await openCreateForm();

    fireEvent.change(screen.getByPlaceholderText("Banner name *"), {
      target: { value: "Weekend Specials" },
    });
    // Slide title left blank (EMPTY_SLIDE default).
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Slide 1 needs a title",
    );
    expect(apiMocks.createBanner).not.toHaveBeenCalled();
  });

  it("rejects an end date before the start date", async () => {
    renderClient();
    await openCreateForm();

    fireEvent.change(screen.getByPlaceholderText("Banner name *"), {
      target: { value: "Weekend Specials" },
    });
    fireEvent.change(screen.getByPlaceholderText("Title *"), {
      target: { value: "Citrus" },
    });
    // Status is now the styled Select (not a native <select>): open it and pick.
    fireEvent.click(screen.getByLabelText("Status"));
    fireEvent.click(screen.getByRole("option", { name: "Published" }));
    fireEvent.change(screen.getByPlaceholderText("Start date"), {
      target: { value: "2026-09-30" },
    });
    fireEvent.change(screen.getByPlaceholderText("End date"), {
      target: { value: "2026-09-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "End date cannot be before the start date",
    );
    expect(apiMocks.createBanner).not.toHaveBeenCalled();
  });
});

describe("BannersClient — saving", () => {
  it("creates a banner with a trimmed name and normalised payload", async () => {
    renderClient();
    await openCreateForm();

    fireEvent.change(screen.getByPlaceholderText("Banner name *"), {
      target: { value: "  Weekend Specials  " },
    });
    fireEvent.change(screen.getByPlaceholderText("Title *"), {
      target: { value: "Citrus" },
    });
    fireEvent.click(screen.getByLabelText("Status"));
    fireEvent.click(screen.getByRole("option", { name: "Published" }));
    fireEvent.change(screen.getByPlaceholderText("Start date"), {
      target: { value: "2026-09-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() =>
      expect(apiMocks.createBanner).toHaveBeenCalledWith({
        name: "Weekend Specials",
        slides: [expect.objectContaining({ title: "Citrus" })],
        status: "published",
        start_date: "2026-09-01",
        end_date: undefined,
      }),
    );
    expect(toast.success).toHaveBeenCalledWith("Banner created");
    // The modal closes on success.
    await waitFor(() =>
      expect(screen.queryByPlaceholderText("Banner name *")).not.toBeInTheDocument(),
    );
  });

  it("reports a failed save inside the form and keeps the modal open", async () => {
    apiMocks.createBanner.mockRejectedValue(
      new Error("The name has already been taken."),
    );

    renderClient();
    await openCreateForm();

    fireEvent.change(screen.getByPlaceholderText("Banner name *"), {
      target: { value: "Weekend Specials" },
    });
    fireEvent.change(screen.getByPlaceholderText("Title *"), {
      target: { value: "Citrus" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The name has already been taken.",
    );
    // Editor keeps their work; no success toast was shown.
    expect(screen.getByPlaceholderText("Banner name *")).toHaveValue(
      "Weekend Specials",
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("prefills an existing banner and updates it by id", async () => {
    renderClient();
    await screen.findByText("Spring Freshness");

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    const nameInput = await screen.findByDisplayValue("Spring Freshness");
    expect(screen.getByDisplayValue("2026-09-01")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-09-30")).toBeInTheDocument();
    // Status now lives inside the styled Select trigger.
    expect(within(screen.getByLabelText("Status")).getByText("Published")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();

    fireEvent.change(nameInput, { target: { value: "Spring Refresh" } });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() =>
      expect(apiMocks.updateBanner).toHaveBeenCalledWith(
        7,
        expect.objectContaining({
          name: "Spring Refresh",
          status: "published",
          slides: [expect.objectContaining({ title: "Half price citrus" })],
        }),
      ),
    );
    expect(toast.success).toHaveBeenCalledWith("Banner updated");
    expect(apiMocks.createBanner).not.toHaveBeenCalled();
  });

  it("deletes a banner after confirmation", async () => {
    renderClient();
    await screen.findByText("Spring Freshness");

    fireEvent.click(
      screen.getByRole("button", { name: "Delete Spring Freshness" }),
    );

    fireEvent.click(await screen.findByRole("button", { name: /Delete banner/i }));

    await waitFor(() => expect(apiMocks.deleteBanner).toHaveBeenCalledWith(7));
    expect(toast.success).toHaveBeenCalledWith("Banner deleted");
  });

  it("surfaces a delete failure as a toast without closing the dialog", async () => {
    apiMocks.deleteBanner.mockRejectedValue(new Error("Banner fronts an active sale."));

    renderClient();
    await screen.findByText("Spring Freshness");

    fireEvent.click(
      screen.getByRole("button", { name: "Delete Spring Freshness" }),
    );
    fireEvent.click(await screen.findByRole("button", { name: /Delete banner/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Banner fronts an active sale."),
    );
    expect(screen.getByRole("button", { name: /Delete banner/i })).toBeInTheDocument();
  });
});

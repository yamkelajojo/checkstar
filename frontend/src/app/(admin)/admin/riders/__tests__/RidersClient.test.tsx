import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import RidersClient from "../RidersClient";

/**
 * Rider manager (developer-only).
 *
 * The rider payload is the clearest example of the backend's numeric contract:
 * Laravel casts Rider.average_rating and Rider.max_radius_km with `decimal:N`,
 * which serialises to JSON as STRINGS ("4.70", "10.00") while the TypeScript
 * types claim `number`. `r.average_rating?.toFixed(1)` therefore threw a
 * TypeError and blanked this page for every real rider. The values below are
 * copied from a live GET /api/admin/riders response.
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
      getAdminRiders: vi.fn(),
      updateAdminRider: vi.fn(),
      getStores: vi.fn(),
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

const RIDER = {
  id: 5,
  user_id: 3,
  store_id: 1,
  is_available: true,
  vehicle_type: "motorbike",
  // decimal:2 cast — arrives as a string
  max_radius_km: "10.00",
  total_deliveries: 45,
  // decimal:2 cast — arrives as a string
  average_rating: "4.70",
  xp: 340,
  level: 17,
  user: { id: 3, name: "Sipho Rider", email: "sipho@checkstar.co.za", role: "rider" },
};

const UNRATED_RIDER = {
  ...RIDER,
  id: 6,
  total_deliveries: 0,
  average_rating: null,
  user: { id: 9, name: "New Rider", email: "new@checkstar.co.za", role: "rider" },
};

const STORE = {
  id: 1,
  name: "Checkstar Durban Central",
  slug: "durban-central",
  latitude: "-29.8587000",
  longitude: "31.0218000",
  delivery_radius_km: "10.00",
};

const DEVELOPER = { id: 1, name: "Dev User", email: "dev@x.co.za", role: "developer" };

function renderClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RidersClient />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  setAuth(DEVELOPER);
  apiMocks.getAdminRiders.mockResolvedValue({ data: [RIDER, UNRATED_RIDER] });
  apiMocks.getStores.mockResolvedValue({ data: [STORE] });
  apiMocks.updateAdminRider.mockResolvedValue({ data: RIDER });
});

describe("RidersClient — decimal-string ratings from the API", () => {
  it("formats a decimal-string average rating instead of crashing", async () => {
    renderClient();

    expect(await screen.findByText("Sipho Rider")).toBeInTheDocument();
    // "4.70".toFixed(1) used to throw; the coerced value renders as 4.7.
    expect(screen.getByText("4.7")).toBeInTheDocument();
    expect(screen.getByText("45 deliveries")).toBeInTheDocument();
  });

  it("shows a dash for a rider who has not been rated yet", async () => {
    renderClient();

    const row = (await screen.findByText("New Rider")).closest("div.p-4") as HTMLElement;
    expect(within(row).getByText("—")).toBeInTheDocument();
  });

  it("keeps the page usable when the rating is a plain number", async () => {
    apiMocks.getAdminRiders.mockResolvedValue({
      data: [{ ...RIDER, average_rating: 4.5 }],
    });

    renderClient();

    expect(await screen.findByText("Sipho Rider")).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
  });
});

describe("RidersClient — access and editing", () => {
  it("restricts the manager to developers", async () => {
    setAuth({ id: 2, name: "Owner", email: "o@x.co.za", role: "store_owner" });

    renderClient();

    expect(await screen.findByText("Developer only")).toBeInTheDocument();
    expect(apiMocks.getAdminRiders).not.toHaveBeenCalled();
  });

  it("prefills the editor from decimal strings and submits numbers", async () => {
    renderClient();
    await screen.findByText("Sipho Rider");

    fireEvent.click(screen.getByRole("button", { name: "Edit Sipho Rider" }));

    expect(await screen.findByText("Edit Rider — Sipho Rider")).toBeInTheDocument();
    // max_radius_km arrives as "10.00" and is shown as-is in the number input.
    expect(screen.getByDisplayValue("10.00")).toBeInTheDocument();
    expect(screen.getByDisplayValue("motorbike")).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue("10.00"), { target: { value: "15" } });
    fireEvent.change(screen.getByDisplayValue("motorbike"), {
      target: { value: "scooter" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Update/i }));

    await waitFor(() =>
      expect(apiMocks.updateAdminRider).toHaveBeenCalledWith(5, {
        store_id: 1,
        vehicle_type: "scooter",
        // Coerced to a number — the API must not receive "15" from a text field.
        max_radius_km: 15,
      }),
    );
    expect(toast.success).toHaveBeenCalledWith("Rider updated");
  });

  it("reports a failed update without closing the editor", async () => {
    apiMocks.updateAdminRider.mockRejectedValue(new Error("Store not linked"));

    renderClient();
    await screen.findByText("Sipho Rider");

    fireEvent.click(screen.getByRole("button", { name: "Edit Sipho Rider" }));
    fireEvent.click(await screen.findByRole("button", { name: /Update/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Store not linked"));
    expect(screen.getByText("Edit Rider — Sipho Rider")).toBeInTheDocument();
  });
});

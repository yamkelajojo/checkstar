import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Manager/admin surfaces — unit coverage for the Phase-4 remediation:
 *  - AdminDashboardClient: developer gate, real links, health rendering
 *  - StaffClient: roster RBAC, owner protection, hire validation, 409 handling
 *  - MessagesClient: mark-read on open, reply validation
 *  - DispatchConsoleClient: role gate, rider validation, dispatch/reassign
 */

// ---------- shared mutable mocks (hoisted for vi.mock factories) ----------
const { authState, setAuth, apiMocks, scratch } = vi.hoisted(() => {
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
      getUser: vi.fn(),
      getMessages: vi.fn(),
      markMessageRead: vi.fn(),
      replyToMessage: vi.fn(),
      getAdminHealth: vi.fn(),
      listStaff: vi.fn(),
      hireStaff: vi.fn(),
      fireStaff: vi.fn(),
      getStoreOrders: vi.fn(),
      getPendingDispatch: vi.fn(),
      getDispatchRiders: vi.fn(),
      dispatchOrder: vi.fn(),
      reassignOrder: vi.fn(),
    },
    scratch: {
      pendingDispatch: [] as Array<Record<string, unknown>>,
      riders: [] as Array<Record<string, unknown>>,
      storeOrders: [] as Array<Record<string, unknown>>,
      inventory: [] as Array<Record<string, unknown>>,
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

// ---------- lib/query mock (page-level data hooks) ----------
vi.mock("@/lib/query", () => ({
  useAllProducts: () => ({
    data: [{ id: 1 }, { id: 2 }],
    isLoading: false,
    error: null,
  }),
  useCategories: () => ({ data: [{ id: 1 }], isLoading: false, error: null }),
  useOrders: () => ({
    data: [
      {
        id: 9,
        order_number: "CS-9",
        status: "preparing",
        total: "50",
        created_at: "2026-09-01T00:00:00Z",
      },
    ],
    isLoading: false,
    error: null,
  }),
  useStores: () => ({
    data: [{ id: 1, name: "Durban Central" }],
    isLoading: false,
    error: null,
  }),
  useStoreOrders: (
    _storeId?: number,
    _params?: Record<string, string>,
    options?: { enabled?: boolean },
  ) => ({
    data: options?.enabled === false ? [] : scratch.storeOrders,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  }),
  useStoreInventory: (_storeId?: number, options?: { enabled?: boolean }) => ({
    data: options?.enabled === false ? [] : scratch.inventory,
    isLoading: false,
    error: null,
  }),
  useSpecials: () => ({ data: [], isLoading: false, error: null }),
  useRecipes: () => ({ data: [], isLoading: false, error: null }),
  usePendingDispatch: (_storeId?: number, options?: { enabled?: boolean }) => ({
    data: options?.enabled === false ? [] : scratch.pendingDispatch,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  }),
  useDispatchRiders: (_storeId?: number, options?: { enabled?: boolean }) => ({
    data: options?.enabled === false ? [] : scratch.riders,
    isLoading: false,
    error: null,
  }),
  useOperationsAuditLogs: (
    _params?: Record<string, string>,
    _storeId?: number,
  ) => ({
    data: { audit_logs: [] },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  }),
  useAnalyticsSales: () => ({ data: null, isLoading: false }),
  useAnalyticsProducts: () => ({ data: null, isLoading: false }),
  useAnalyticsRiders: () => ({ data: null, isLoading: false }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

vi.mock("@/lib/motion/variants", async () => {
  const actual = await vi.importActual<typeof import("@/lib/motion/variants")>(
    "@/lib/motion/variants",
  );
  return actual;
});

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  setAuth(null);
  setRows(scratch, []);
  setRows(scratch, [], "riders");
  setRows(scratch, [], "storeOrders");
  setRows(scratch, [], "inventory");
});

type Scratch = {
  pendingDispatch: Array<Record<string, unknown>>;
  riders: Array<Record<string, unknown>>;
  storeOrders: Array<Record<string, unknown>>;
  inventory: Array<Record<string, unknown>>;
};

function setRows(
  target: Scratch,
  rows: Array<Record<string, unknown>>,
  key: keyof Scratch = "pendingDispatch",
) {
  target[key] = rows;
}

// ================= AdminDashboardClient =================
import AdminDashboardClient from "@/app/(admin)/admin/dashboard/AdminDashboardClient";

describe("AdminDashboardClient", () => {
  const healthPayload = {
    status: "ok",
    uptime_s: 1200,
    services: { api: "ok", database: "ok", queue: "warn", storage: "ok" },
  };

  it("shows a graceful state when a staff account has no resolvable store", () => {
    // Owner without a `store` on /auth/me — must not render a blank dashboard
    setAuth({
      id: 2,
      name: "Thandi Owner",
      email: "owner@x.co.za",
      role: "store_owner",
    });
    apiMocks.getAdminHealth.mockResolvedValue(healthPayload);
    apiMocks.getMessages.mockResolvedValue({ data: [] });
    renderWithProviders(<AdminDashboardClient />);
    expect(screen.getByText("Staff Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Store owner")).toBeInTheDocument();
    expect(
      screen.getByText("No store linked to your account"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Needs Attention")).not.toBeInTheDocument();
  });

  it("shows a needs-attention cockpit with the owner store’s orders", async () => {
    setAuth({
      id: 2,
      name: "Thandi Owner",
      email: "owner@x.co.za",
      role: "store_owner",
      store: { id: 1, name: "Durban Central", slug: "durban-central" },
    });
    setRows(
      scratch,
      [
        {
          id: 7,
          order_number: "CS-7",
          status: "confirmed",
          total: "84.50",
          created_at: "2026-09-24T07:00:00Z",
        },
      ],
      "storeOrders",
    );
    setRows(
      scratch,
      [{ stock_quantity: 3 }, { stock_quantity: 0 }, { stock_quantity: 25 }],
      "inventory",
    );
    setRows(scratch, [
      { id: 500, order_number: "CS-1500", status: "confirmed" },
    ]);

    renderWithProviders(<AdminDashboardClient />);

    expect(await screen.findByText("Needs Attention")).toBeInTheDocument();
    // 1 awaiting dispatch, 1 low, 1 out of stock
    expect(screen.getByText("orders awaiting dispatch")).toBeInTheDocument();
    expect(screen.getByText("low on stock")).toBeInTheDocument();
    expect(screen.getByText("out of stock")).toBeInTheDocument();

    // Recent orders come from the store orders endpoint, linking to the staff view
    expect(await screen.findByText("CS-7")).toBeInTheDocument();
    const orderLink = screen.getByText("CS-7").closest("a")!;
    expect(orderLink).toHaveAttribute("href", "/admin/orders");
  });

  it("shows the all-clear when nothing needs attention", async () => {
    setAuth({
      id: 2,
      name: "Thandi Owner",
      email: "owner@x.co.za",
      role: "store_owner",
      store: { id: 1, name: "Durban Central", slug: "durban-central" },
    });
    renderWithProviders(<AdminDashboardClient />);
    expect(
      await screen.findByText("Nothing needs attention right now."),
    ).toBeInTheDocument();
  });

  it("gives developers a store focus that drives the order widgets", async () => {
    setAuth({
      id: 1,
      name: "Dev User",
      email: "dev@x.co.za",
      role: "developer",
    });
    apiMocks.getMessages.mockResolvedValue({ data: [] });
    setRows(
      scratch,
      [
        {
          id: 7,
          order_number: "CS-7",
          status: "preparing",
          total: "50",
          created_at: "2026-09-20T00:00:00Z",
        },
      ],
      "storeOrders",
    );

    renderWithProviders(<AdminDashboardClient />);

    // Store focus defaults to the first store; the pulse section names it
    expect(
      await screen.findByText("Durban Central — right now"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Store focus")).toBeInTheDocument();
    // The store's orders render in Recent Orders (not the dev's customer orders)
    expect(await screen.findByText("CS-7")).toBeInTheDocument();
    const orderLink = screen.getByText("CS-7").closest("a")!;
    expect(orderLink).toHaveAttribute("href", "/admin/orders");
  });

  it("renders overview stats for developers (tool nav lives in the sidebar)", async () => {
    setAuth({
      id: 1,
      name: "Dev User",
      email: "dev@x.co.za",
      role: "developer",
    });
    apiMocks.getAdminHealth.mockResolvedValue(healthPayload);
    apiMocks.getMessages.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] });

    renderWithProviders(<AdminDashboardClient />);

    // Stats from the (mocked) queries
    await waitFor(() => expect(screen.getByText("2")).toBeInTheDocument()); // products
    // The "right now" pulse and recent orders are the dev's operational view
    expect(
      await screen.findByText("Durban Central — right now"),
    ).toBeInTheDocument();
    // The dashboard no longer duplicates the sidebar as an icon-card grid
    expect(screen.queryByText("Store Management")).not.toBeInTheDocument();
    expect(screen.queryByText("Catalog & Platform")).not.toBeInTheDocument();
    // No placeholder # links anywhere on the page
    const hrefs = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(hrefs.some((h) => h === "#")).toBe(false);
  });

  it("surfaces degraded health when a service is not ok", async () => {
    setAuth({
      id: 1,
      name: "Dev User",
      email: "dev@x.co.za",
      role: "developer",
    });
    apiMocks.getAdminHealth.mockResolvedValue(healthPayload); // queue: warn
    apiMocks.getMessages.mockResolvedValue({ data: [] });

    renderWithProviders(<AdminDashboardClient />);
    await waitFor(() =>
      expect(
        screen.getByText("Degraded — investigate below"),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("Queue")).toBeInTheDocument();
    expect(screen.getByText("warn")).toBeInTheDocument();
  });

  it("shows the all-clear state when every service is ok", async () => {
    setAuth({
      id: 1,
      name: "Dev User",
      email: "dev@x.co.za",
      role: "developer",
    });
    apiMocks.getAdminHealth.mockResolvedValue({
      status: "ok",
      services: { api: "ok", database: "ok", queue: "ok", storage: "ok" },
    });
    apiMocks.getMessages.mockResolvedValue({ data: [] });

    renderWithProviders(<AdminDashboardClient />);
    await waitFor(() =>
      expect(screen.getByText("All Systems Normal")).toBeInTheDocument(),
    );
  });

  it("handles a failing health endpoint without crashing", async () => {
    setAuth({
      id: 1,
      name: "Dev User",
      email: "dev@x.co.za",
      role: "developer",
    });
    apiMocks.getAdminHealth.mockRejectedValue(new Error("boom"));
    apiMocks.getMessages.mockResolvedValue({ data: [] });

    renderWithProviders(<AdminDashboardClient />);
    await waitFor(() =>
      expect(screen.getByText("Health check unavailable")).toBeInTheDocument(),
    );
    expect(screen.getByText("boom")).toBeInTheDocument();
  });
});

// ================= StaffClient =================
import StaffClient from "@/app/(admin)/admin/staff/StaffClient";

const staffRoster = {
  data: [
    {
      id: 10,
      user: { id: 2, name: "Thandi Owner", email: "owner@x.co.za" },
      role: "store_owner",
      store_id: 1,
      created_at: "2026-07-15T08:00:00Z",
    },
    {
      id: 11,
      user: { id: 3, name: "Sipho Manager", email: "manager@x.co.za" },
      role: "store_manager",
      store_id: 1,
      created_at: "2026-08-01T08:00:00Z",
    },
  ],
};

describe("StaffClient", () => {
  it("blocks users without staff-management roles", () => {
    setAuth({
      id: 5,
      name: "Rider Rita",
      email: "rider@x.co.za",
      role: "rider",
    });
    renderWithProviders(<StaffClient />);
    expect(screen.getByText("Staff access only")).toBeInTheDocument();
  });

  it("blocks store managers — the backend staff routes are owner/developer only", () => {
    setAuth({
      id: 3,
      name: "Sipho Manager",
      email: "manager@x.co.za",
      role: "store_manager",
    });
    renderWithProviders(<StaffClient />);
    expect(screen.getByText("Staff access only")).toBeInTheDocument();
    expect(apiMocks.listStaff).not.toHaveBeenCalled();
  });

  it("renders the roster with nested user data and shields owners from revocation", async () => {
    setAuth({
      id: 2,
      name: "Thandi Owner",
      email: "owner@x.co.za",
      role: "store_owner",
    });
    apiMocks.listStaff.mockResolvedValue(staffRoster);

    renderWithProviders(<StaffClient />);

    await waitFor(() =>
      expect(screen.getByText("Thandi Owner")).toBeInTheDocument(),
    );
    expect(screen.getByText("Sipho Manager")).toBeInTheDocument();

    const ownerRow = screen.getByText("Thandi Owner").closest("li")!;
    expect(
      within(ownerRow).queryByRole("button", { name: "Revoke" }),
    ).toBeNull();

    const managerRow = screen.getByText("Sipho Manager").closest("li")!;
    expect(
      within(managerRow).getByRole("button", { name: "Revoke" }),
    ).toBeInTheDocument();
  });

  it("validates the hire form before calling the API", async () => {
    setAuth({
      id: 2,
      name: "Thandi Owner",
      email: "owner@x.co.za",
      role: "store_owner",
    });
    apiMocks.listStaff.mockResolvedValue({ data: [] });

    renderWithProviders(<StaffClient />);
    fireEvent.submit(
      screen.getByRole("button", { name: /Add member/ }).closest("form")!,
    );

    await waitFor(() =>
      expect(
        screen.getByText("Name and email are both required"),
      ).toBeInTheDocument(),
    );
    expect(apiMocks.hireStaff).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText("Full name"), {
      target: { value: "New Person" },
    });
    fireEvent.change(screen.getByPlaceholderText("name@company.co.za"), {
      target: { value: "not-an-email" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: /Add member/ }).closest("form")!,
    );
    await waitFor(() =>
      expect(
        screen.getByText("Enter a valid email address"),
      ).toBeInTheDocument(),
    );
    expect(apiMocks.hireStaff).not.toHaveBeenCalled();
  });

  it("surfaces a 409 duplicate-hire rejection inline", async () => {
    setAuth({
      id: 2,
      name: "Thandi Owner",
      email: "owner@x.co.za",
      role: "store_owner",
    });
    apiMocks.listStaff.mockResolvedValue({ data: [] });
    const { ApiError } = await import("@/lib/api");
    apiMocks.hireStaff.mockRejectedValue(
      new ApiError("User already has a store assignment", 409, {
        message: "User already has a store assignment",
      }),
    );

    renderWithProviders(<StaffClient />);
    fireEvent.change(screen.getByPlaceholderText("Full name"), {
      target: { value: "Sipho Manager" },
    });
    fireEvent.change(screen.getByPlaceholderText("name@company.co.za"), {
      target: { value: "manager@x.co.za" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: /Add member/ }).closest("form")!,
    );

    await waitFor(() =>
      expect(
        screen.getByText("User already has a store assignment"),
      ).toBeInTheDocument(),
    );
  });
});

// ================= MessagesClient =================
import MessagesClient from "@/app/(admin)/admin/messages/MessagesClient";
import AuditLogsClient from "@/app/(dashboard)/operations/audit-logs/AuditLogsClient";

const inbox = {
  data: [
    {
      id: 1,
      name: "Nomsa Dlamini",
      email: "nomsa@x.co.za",
      subject: "Delivery",
      message: "Where is my order?",
      is_read: false,
      created_at: "2026-09-05T09:00:00Z",
    },
    {
      id: 2,
      name: "Pieter van Wyk",
      email: "pieter@x.co.za",
      subject: "Bulk",
      message: "Bulk pricing?",
      is_read: true,
      created_at: "2026-09-03T14:30:00Z",
    },
  ],
};

describe("MessagesClient", () => {
  it("blocks non-admin roles", () => {
    setAuth({
      id: 6,
      name: "Rider Rita",
      email: "rider@x.co.za",
      role: "rider",
    });
    renderWithProviders(<MessagesClient />);
    expect(screen.getByText("Admin access only")).toBeInTheDocument();
  });

  it("blocks store owners — the admin message routes are developer-only", () => {
    setAuth({
      id: 2,
      name: "Thandi Owner",
      email: "owner@x.co.za",
      role: "store_owner",
    });
    renderWithProviders(<MessagesClient />);
    expect(screen.getByText("Admin access only")).toBeInTheDocument();
    expect(apiMocks.getMessages).not.toHaveBeenCalled();
  });

  it("marks an unread message read when opened and allows replying", async () => {
    setAuth({
      id: 1,
      name: "Dev User",
      email: "dev@x.co.za",
      role: "developer",
    });
    apiMocks.getMessages.mockResolvedValue(inbox);
    apiMocks.markMessageRead.mockResolvedValue({ data: {} });
    apiMocks.replyToMessage.mockResolvedValue({ data: {} });

    renderWithProviders(<MessagesClient />);
    await waitFor(() =>
      expect(screen.getByText("Nomsa Dlamini")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /Nomsa Dlamini/ }));

    // mark-read fired with explicit read:true
    await waitFor(() =>
      expect(apiMocks.markMessageRead).toHaveBeenCalledWith(1, true),
    );

    // Composer appears; empty reply is blocked
    const composer = await screen.findByPlaceholderText("Write your reply…");
    fireEvent.click(screen.getByRole("button", { name: /Send reply/ }));
    expect(
      await screen.findByText("Write a reply before sending"),
    ).toBeInTheDocument();
    expect(apiMocks.replyToMessage).not.toHaveBeenCalled();

    // A real reply goes through and clears the composer
    fireEvent.change(composer, { target: { value: "On its way!" } });
    fireEvent.click(screen.getByRole("button", { name: /Send reply/ }));
    await waitFor(() =>
      expect(apiMocks.replyToMessage).toHaveBeenCalledWith(1, "On its way!"),
    );
  });
});

describe("AuditLogsClient", () => {
  it("offers a clear return route back to the admin dashboard", () => {
    setAuth({
      id: 1,
      name: "Dev User",
      email: "dev@x.co.za",
      role: "developer",
    });
    renderWithProviders(<AuditLogsClient />);

    expect(
      screen.getByRole("link", { name: /Back to dashboard/i }),
    ).toHaveAttribute("href", "/admin/dashboard");
  });
});

// ================= DispatchConsoleClient =================
import DispatchConsoleClient from "@/app/(account)/account/dispatch/DispatchConsoleClient";

/**
 * `/store/dispatch/riders` returns whole Rider models — rating and delivery
 * count included — even though the frontend type used to declare only a subset.
 */
const riderRow = (over: Record<string, unknown> = {}) => ({
  id: 1,
  user_id: 7,
  store_id: 1,
  is_available: true,
  vehicle_type: "Motorbike",
  max_radius_km: 12,
  average_rating: 4.8,
  total_deliveries: 212,
  xp: 2120,
  level: 5,
  user: { id: 7, name: "Rider Rita", email: "rita@x.co.za" },
  ...over,
});

const pendingRow = (over: Record<string, unknown> = {}) => ({
  id: 501,
  order_number: "CS-1501",
  status: "confirmed",
  total: "84.97",
  delivery_address: "12 Problem Mkhize Rd",
  created_at: "2026-09-06T07:41:00Z",
  rider_id: null,
  items: [],
  ...over,
});

describe("DispatchConsoleClient", () => {
  it("blocks unauthorized roles", async () => {
    setAuth({
      id: 6,
      name: "Rider Rita",
      email: "rider@x.co.za",
      role: "rider",
    });
    renderWithProviders(<DispatchConsoleClient />);
    expect(await screen.findByText("Not authorized")).toBeInTheDocument();
  });

  /**
   * The queue this screen renders comes from `/store/dispatch/pending`, which
   * selects `status IN (confirmed, retrying) AND rider_id IS NULL`
   * (ManualDispatch::pendingForStore). So an order in this list never has a
   * rider: the old "Current rider: #8" line and its Reassign control were
   * unreachable, and the test that covered them asserted a state the API cannot
   * produce. Reassignment lives on the store Orders screen, where orders that
   * do have riders are listed (see "StoreOrdersClient rider reassignment").
   */
  it("offers dispatch only, because the pending endpoint never returns an assigned order", async () => {
    setAuth({
      id: 3,
      name: "Sipho Manager",
      email: "manager@x.co.za",
      role: "store_manager",
    });
    setRows(scratch, [
      pendingRow({ id: 503, order_number: "CS-1503", status: "retrying" }),
    ]);

    renderWithProviders(<DispatchConsoleClient />);

    expect(await screen.findByText("#CS-1503")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dispatch" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reassign" })).toBeNull();
    expect(screen.queryByText(/Current rider/i)).toBeNull();
  });

  it("shows who each rider is in the picker instead of a database id", async () => {
    setAuth({
      id: 3,
      name: "Sipho Manager",
      email: "manager@x.co.za",
      role: "store_manager",
    });
    setRows(scratch, [pendingRow()]);
    setRows(scratch, [riderRow()], "riders");

    renderWithProviders(<DispatchConsoleClient />);

    // The picker is now the styled Select: open the combobox, inspect the menu.
    const picker = await screen.findByRole("combobox", { name: /choose a rider/i });
    fireEvent.click(picker);
    const option = screen.getByRole("option", { name: /Rider Rita/ });
    // A dispatcher choosing between riders needs the vehicle, the rating and the
    // experience — all of which the endpoint already returns.
    expect(option).toHaveTextContent("Motorbike");
    expect(option).toHaveTextContent("4.8");
    expect(option).toHaveTextContent("212 deliveries");
  });

  it("falls back to a plain name when a rider profile carries no rating yet", async () => {
    setAuth({
      id: 3,
      name: "Sipho Manager",
      email: "manager@x.co.za",
      role: "store_manager",
    });
    setRows(scratch, [pendingRow()]);
    setRows(
      scratch,
      [riderRow({ id: 2, average_rating: 0, total_deliveries: 0, user: { id: 9, name: "New Rider", email: "new@x.co.za" } })],
      "riders",
    );

    renderWithProviders(<DispatchConsoleClient />);

    const picker = await screen.findByRole("combobox", { name: /choose a rider/i });
    fireEvent.click(picker);
    const option = screen.getByRole("option", { name: /New Rider/ });
    expect(option).toHaveTextContent("Motorbike");
    expect(option).not.toHaveTextContent("0.0");
    expect(option).toHaveTextContent("New");
  });

  it("dispatches to a selected rider and confirms", async () => {
    setAuth({
      id: 3,
      name: "Sipho Manager",
      email: "manager@x.co.za",
      role: "store_manager",
    });
    setRows(scratch, [pendingRow()]);
    setRows(scratch, [riderRow()], "riders");
    apiMocks.dispatchOrder.mockResolvedValue({
      data: pendingRow({ rider_id: 7, status: "preparing" }),
    });

    renderWithProviders(<DispatchConsoleClient />);
    const picker = await screen.findByRole("combobox", { name: /choose a rider/i });
    fireEvent.click(picker);
    fireEvent.click(screen.getByRole("option", { name: /Rider Rita/ }));
    fireEvent.click(screen.getByRole("button", { name: "Dispatch" }));

    await waitFor(() =>
      expect(apiMocks.dispatchOrder).toHaveBeenCalledWith(501, 1, undefined),
    );
    expect(
      await screen.findByText(/dispatched to Rider Rita/),
    ).toBeInTheDocument();
  });

  it("shows API error reasons from failed dispatches", async () => {
    setAuth({
      id: 3,
      name: "Sipho Manager",
      email: "manager@x.co.za",
      role: "store_manager",
    });
    setRows(scratch, [pendingRow()]);
    setRows(scratch, [riderRow()], "riders");
    apiMocks.dispatchOrder.mockRejectedValue(
      new (await import("@/lib/api")).ApiError("Invalid rider", 422, {
        reason: "invalid_rider",
      }),
    );

    renderWithProviders(<DispatchConsoleClient />);
    const picker = await screen.findByRole("combobox", { name: /choose a rider/i });
    fireEvent.click(picker);
    fireEvent.click(screen.getByRole("option", { name: /Rider Rita/ }));
    fireEvent.click(screen.getByRole("button", { name: "Dispatch" }));

    expect(await screen.findByText(/invalid_rider/)).toBeInTheDocument();
  });
});

// ================= StoreOrdersClient =================

import StoreOrdersClient from "@/app/(admin)/admin/orders/StoreOrdersClient";

const assignedRider = {
  id: 4,
  user_id: 7,
  store_id: 1,
  is_available: false,
  vehicle_type: "Motorbike",
  max_radius_km: 12,
  average_rating: 4.8,
  total_deliveries: 212,
  user: { id: 7, name: "Rider Rita", email: "rita@x.co.za" },
};

const storeOrderRow = (over: Record<string, unknown> = {}) => ({
  id: 601,
  order_number: "CS-2001",
  status: "preparing",
  total: "184.50",
  subtotal: "164.50",
  delivery_fee: "20.00",
  payment_status: "pending",
  delivery_address: "45 Helen Joseph Rd",
  created_at: "2026-09-06T08:12:00Z",
  items: [],
  rider: null as Record<string, unknown> | null,
  ...over,
});

/**
 * Reassignment used to live only on the dispatch console, inside a branch keyed
 * on `order.rider_id` — but that screen's endpoint selects
 * `rider_id IS NULL`, so the branch could never render and the backend's
 * `/store/orders/{id}/reassign` flow had no reachable UI at all. This is where
 * assigned orders are listed, so this is where the control belongs.
 */
describe("StoreOrdersClient rider reassignment", () => {
  function renderOrders(
    rows: Array<Record<string, unknown>>,
    riders: Array<Record<string, unknown>> = [],
  ) {
    setAuth({
      id: 3,
      name: "Sipho Manager",
      email: "manager@x.co.za",
      role: "store_manager",
    });
    apiMocks.getStoreOrders.mockResolvedValue({ data: rows });
    setRows(scratch, riders, "riders");
    return renderWithProviders(<StoreOrdersClient />);
  }

  const vusi = riderRow({
    id: 5,
    user_id: 8,
    user: { id: 8, name: "Vusi Dlamini", email: "vusi@x.co.za" },
  });

  it("offers reassignment on an order that already has a rider", async () => {
    renderOrders([storeOrderRow({ rider: assignedRider })], [vusi]);

    const picker = await screen.findByLabelText(
      /Reassign rider for order CS-2001/i,
    );
    fireEvent.click(picker);
    expect(
      screen.getByRole("option", { name: /Vusi Dlamini/ }),
    ).toBeInTheDocument();
    // The rider already carrying the order is not a reassignment target.
    expect(
      screen.queryByRole("option", { name: /Rider Rita/ }),
    ).toBeNull();
    // Nothing chosen yet: the button must not fire an empty reassignment.
    expect(screen.getByRole("button", { name: "Reassign" })).toBeDisabled();
  });

  it("reassigns and says who is carrying the order now", async () => {
    apiMocks.reassignOrder.mockResolvedValue({ data: storeOrderRow() });
    renderOrders([storeOrderRow({ rider: assignedRider })], [vusi]);

    const picker = await screen.findByLabelText(
      /Reassign rider for order CS-2001/i,
    );
    fireEvent.click(picker);
    fireEvent.click(screen.getByRole("option", { name: /Vusi Dlamini/ }));
    fireEvent.click(screen.getByRole("button", { name: "Reassign" }));

    await waitFor(() =>
      expect(apiMocks.reassignOrder).toHaveBeenCalledWith(601, 5, undefined),
    );
    const { toast } = await import("sonner");
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringMatching(/Vusi Dlamini/),
      ),
    );
  });

  it("does not offer reassignment on an order with no rider", async () => {
    renderOrders([storeOrderRow()], [vusi]);

    expect(await screen.findByText("#CS-2001")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Reassign rider/i)).toBeNull();
    expect(screen.queryByRole("button", { name: "Reassign" })).toBeNull();
  });

  it("surfaces the API reason when a reassignment is refused", async () => {
    apiMocks.reassignOrder.mockRejectedValue(
      new (await import("@/lib/api")).ApiError("Rider unavailable", 422, {
        reason: "rider_busy",
      }),
    );
    renderOrders([storeOrderRow({ rider: assignedRider })], [vusi]);

    const picker = await screen.findByLabelText(
      /Reassign rider for order CS-2001/i,
    );
    fireEvent.click(picker);
    fireEvent.click(screen.getByRole("option", { name: /Vusi Dlamini/ }));
    fireEvent.click(screen.getByRole("button", { name: "Reassign" }));

    const { toast } = await import("sonner");
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/rider_busy/),
      ),
    );
  });

  it("speaks the house status vocabulary, not raw enums", async () => {
    renderOrders([storeOrderRow()], []);

    // Wait for the row itself: the status filter and the lifecycle help copy
    // render before the orders query resolves.
    const card = (await screen.findByText("#CS-2001")).closest(".rounded-xl");
    expect(card).not.toBeNull();

    // `status.replace(/_/g, " ")` used to print "preparing" and
    // "out for delivery" — lowercase enums on a staff surface.
    expect(within(card as HTMLElement).getByText("Preparing")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Out for delivery" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ready for pickup" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("out for delivery")).toBeNull();
  });
});

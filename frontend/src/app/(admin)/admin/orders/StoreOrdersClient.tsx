"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useDispatchRiders, useStores } from "@/lib/query";
import { orderStatusLabel, riderLabel, riderName } from "@/lib/labels";
import { toast } from "sonner";
import {
  ShoppingCart,
  Search,
  Loader2,
  RefreshCw,
  Lock,
  Store as StoreIcon,
  AlertCircle,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Bike,
  MapPin,
  User,
  Calendar,
} from "lucide-react";
import {
  fadeUpTight as fadeUp,
  staggerTight as stagger,
} from "@/lib/motion/variants";
import Select from "@/components/ui/select";
import Link from "next/link";
import type { Order } from "@/types";
import { formatZar } from '@/lib/money'
import { formatDateTime } from '@/lib/dates'

type StatusFilter = "" | Order["status"];

const STATUS_OPTIONS: Array<{
  value: StatusFilter;
  label: string;
  color: string;
}> = [
  { value: "", label: "All statuses", color: "bg-gray-100 text-gray-600" },
  {
    value: "confirmed",
    label: "Confirmed",
    color: "bg-blue-100 text-blue-700",
  },
  {
    value: "preparing",
    label: "Preparing",
    color: "bg-amber-100 text-amber-700",
  },
  {
    value: "ready",
    label: "Ready for Pickup",
    color: "bg-purple-100 text-purple-700",
  },
  {
    value: "out_for_delivery",
    label: "Out for Delivery",
    color: "bg-indigo-100 text-indigo-700",
  },
  {
    value: "delivered",
    label: "Delivered",
    color: "bg-green-100 text-green-700",
  },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-700" },
  {
    value: "retrying",
    label: "Retrying",
    color: "bg-orange-100 text-orange-700",
  },
];

const NEXT_STATUSES: Record<string, string[]> = {
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "out_for_delivery", "cancelled"],
  ready: ["delivered", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  retrying: ["confirmed", "cancelled"],
};

function statusStyle(status: string) {
  return (
    STATUS_OPTIONS.find((s) => s.value === status)?.color ??
    "bg-gray-100 text-gray-600"
  );
}

export default function StoreOrdersClient() {
  const { user, isLoading: authLoading } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  /** orderId -> chosen rider id, for the reassignment picker on that row. */
  const [reassignTarget, setReassignTarget] = useState<Record<number, string>>(
    {},
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [storeIdInput, setStoreIdInput] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const allowedRoles = [
    "store_manager",
    "logistics_officer",
    "store_owner",
    "developer",
  ];
  const authResolved = !authLoading && !!user;
  const authorized = authResolved && allowedRoles.includes(user!.role);

  const { data: stores = [] } = useStores();
  const activeStoreId =
    user?.role === "developer" && storeIdInput
      ? Number(storeIdInput)
      : undefined;
  const shouldFetch =
    authorized && (user?.role !== "developer" || !!activeStoreId);

  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["store-orders", activeStoreId, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.getStoreOrders(
        activeStoreId,
        Object.keys(params).length ? params : undefined,
      );
      const data = res.data;
      if (Array.isArray(data)) return data as unknown as Order[];
      if (
        data &&
        typeof data === "object" &&
        "data" in data &&
        Array.isArray((data as { data: unknown }).data)
      ) {
        return (data as { data: Order[] }).data;
      }
      return [] as Order[];
    },
    enabled: shouldFetch,
  });

  const statusMutation = useMutation({
    meta: { silent: true },
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      api.updateStoreOrderStatus(orderId, status, activeStoreId),
    onMutate: ({ orderId }) => setUpdatingId(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-orders"] });
      toast.success("Order status updated");
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError ? err.message : "Could not update order";
      const reason =
        err instanceof ApiError
          ? (err.payload as { reason?: string })?.reason
          : undefined;
      toast.error(reason ? `${msg} (${reason})` : msg);
    },
    onSettled: () => setUpdatingId(null),
  });

  /**
   * Reassignment lives here because this is the screen that lists orders which
   * already have a rider. The dispatch console's queue is `rider_id IS NULL` by
   * construction (ManualDispatch::pendingForStore), so the control it used to
   * render could never appear and the backend's `/store/orders/{id}/reassign`
   * flow had no reachable UI. Riders are only fetched when something on screen
   * could actually be reassigned.
   */
  const hasAssignedOrder = orders.some((o) => !!o.rider);
  const { data: riders = [] } = useDispatchRiders(activeStoreId, {
    enabled: shouldFetch && hasAssignedOrder,
  });

  const reassignMutation = useMutation({
    meta: { silent: true },
    mutationFn: ({ orderId, riderId }: { orderId: number; riderId: number }) =>
      api.reassignOrder(orderId, riderId, activeStoreId),
    onMutate: ({ orderId }) => setUpdatingId(orderId),
    onSuccess: (_data, { orderId, riderId }) => {
      queryClient.invalidateQueries({ queryKey: ["store-orders"] });
      // Name the rider and the order: "reassigned to rider 5" would send the
      // manager off to another screen to find out who is now carrying it.
      const rider = riders.find((r) => r.id === riderId);
      const order = orders.find((o) => o.id === orderId);
      toast.success(
        `Order #${order?.order_number ?? orderId} reassigned to ${
          rider ? riderName(rider) : `rider ${riderId}`
        }`,
      );
      setReassignTarget((s) => ({ ...s, [orderId]: "" }));
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError ? err.message : "Could not reassign rider";
      const reason =
        err instanceof ApiError
          ? (err.payload as { reason?: string })?.reason
          : undefined;
      toast.error(reason ? `${msg} (${reason})` : msg);
    },
    onSettled: () => setUpdatingId(null),
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.order_number.toLowerCase().includes(q) ||
        String(o.id).includes(q) ||
        o.delivery_address?.toLowerCase().includes(q),
    );
  }, [orders, search]);

  if (authLoading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-20 text-center">
        <Loader2 size={32} className="animate-spin mx-auto text-primary" />
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
          <Lock size={20} className="text-rose-500" />
        </div>
        <h1 className="text-xl font-semibold">Not authorized</h1>
        <p className="text-sm text-gray-500 mt-2">
          Store orders require Store Manager, Logistics Officer, Store Owner or
          Developer access.
        </p>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mt-4"
        >
          Back to Dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <motion.div initial="hidden" animate="show" variants={stagger}>
        <motion.div
          variants={fadeUp}
          className="mb-6 flex items-start justify-between gap-4"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">
              Store Orders
            </h1>
            <p className="text-gray-500 text-sm">
              {filtered.length} order{filtered.length !== 1 ? "s" : ""}{" "}
              {statusFilter ? `· ${orderStatusLabel(statusFilter)}` : ""}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-400 hover:text-primary transition-colors"
            aria-label="Refresh orders"
          >
            <RefreshCw
              size={16}
              className={isFetching ? "animate-spin text-primary" : ""}
            />
          </button>
        </motion.div>

        {user?.role === "developer" && (
          <motion.div
            variants={fadeUp}
            className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4"
          >
            <label
              htmlFor="orders-store-select"
              className="block text-xs font-medium text-amber-800 mb-1 flex items-center gap-1.5"
            >
              <StoreIcon size={12} /> Developer: pick a store
            </label>
            <Select
              id="orders-store-select"
              value={storeIdInput}
              onChange={setStoreIdInput}
              options={[
                { value: "", label: "Select store…" },
                ...stores.map((s) => ({
                  value: String((s as { id: number }).id),
                  label: (s as { name: string }).name,
                })),
              ]}
              placeholder="Select store…"
              className="min-w-56"
            />
            {!activeStoreId && (
              <p className="text-xs text-amber-700 mt-2">
                Select a store to load its orders.
              </p>
            )}
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          variants={fadeUp}
          className="mb-6 bg-white border border-gray-100 rounded-xl p-4"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order number or address…"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <Select
              ariaLabel="Filter by status"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as StatusFilter)}
              options={STATUS_OPTIONS.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
              className="w-48"
            />
          </div>
        </motion.div>

        {error && (
          <motion.div
            variants={fadeUp}
            className="mb-6 bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-center gap-3"
          >
            <AlertCircle size={18} className="text-accent shrink-0" />
            <p className="text-sm text-gray-600">{(error as Error).message}</p>
            <button
              onClick={() => refetch()}
              className="ml-auto text-primary text-sm font-medium hover:underline flex items-center gap-1"
            >
              <RefreshCw size={13} /> Retry
            </button>
          </motion.div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-xl p-5"
              >
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-32 bg-gray-100 rounded" />
                  <div className="h-3 w-48 bg-gray-100 rounded" />
                  <div className="h-10 w-full bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : user?.role === "developer" && !activeStoreId ? (
          <motion.div
            variants={fadeUp}
            className="bg-white border border-gray-100 rounded-xl p-12 text-center"
          >
            <StoreIcon size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">
              Select a store to view orders
            </p>
            <p className="text-sm text-gray-400">
              Developers must specify a store ID.
            </p>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            variants={fadeUp}
            className="bg-white border border-gray-100 rounded-xl p-12 text-center"
          >
            <ShoppingCart size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">No orders found</p>
            <p className="text-sm text-gray-400">
              {statusFilter
                ? `No orders are ${orderStatusLabel(statusFilter).toLowerCase()} right now.`
                : "This store has no orders yet."}
            </p>
          </motion.div>
        ) : (
          <motion.div variants={fadeUp} className="space-y-3">
            {filtered.map((order) => {
              const next = NEXT_STATUSES[order.status] ?? [];
              const isUpdating = updatingId === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-gray-900">
                          #{order.order_number}
                        </span>
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusStyle(order.status)}`}
                        >
                          {orderStatusLabel(order.status)}
                        </span>
                        {order.fulfilment_method && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
                            {order.fulfilment_method}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDateTime(order.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package size={11} />
                          {order.items?.length ?? 0} items
                        </span>
                        <span className="font-medium text-gray-700 tabular-nums">
                          {formatZar(order.total)}
                        </span>
                        {order.rider ? (
                          <span
                            className="flex items-center gap-1"
                            title={`Rider #${order.rider.id}`}
                          >
                            <Bike size={11} />
                            {riderName(order.rider)}
                            {Number(order.rider.average_rating) > 0 ? (
                              <span className="text-gray-400">
                                · ★ {Number(order.rider.average_rating).toFixed(1)}
                              </span>
                            ) : null}
                          </span>
                        ) : null}
                      </div>
                      {order.delivery_address && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 truncate">
                          <MapPin size={11} className="shrink-0" />
                          {order.delivery_address}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {next.length > 0 && (
                        <div className="flex gap-1.5">
                          {next.map((ns) => (
                            <button
                              key={ns}
                              onClick={() =>
                                statusMutation.mutate({
                                  orderId: order.id,
                                  status: ns,
                                })
                              }
                              disabled={isUpdating}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                            >
                              {isUpdating ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                orderStatusLabel(ns)
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      {order.rider ? (
                        <div className="flex items-center gap-1.5">
                          <label
                            className="sr-only"
                            htmlFor={`reassign-${order.id}`}
                          >
                            Reassign rider for order {order.order_number}
                          </label>
                          <Select
                            id={`reassign-${order.id}`}
                            value={reassignTarget[order.id] ?? ""}
                            onChange={(v) =>
                              setReassignTarget((s) => ({
                                ...s,
                                [order.id]: v,
                              }))
                            }
                            disabled={isUpdating}
                            options={[
                              { value: "", label: "Reassign…" },
                              ...riders
                                .filter((r) => r.id !== order.rider?.id)
                                .map((r) => ({
                                  value: String(r.id),
                                  label: riderLabel(r),
                                })),
                            ]}
                            placeholder="Reassign…"
                            size="sm"
                            className="w-44"
                          />
                          <button
                            onClick={() => {
                              const riderId = Number(reassignTarget[order.id]);
                              if (!riderId) return;
                              reassignMutation.mutate({
                                orderId: order.id,
                                riderId,
                              });
                            }}
                            disabled={!reassignTarget[order.id] || isUpdating}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50 transition-colors"
                          >
                            {isUpdating ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              "Reassign"
                            )}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-50">
                      <div className="flex flex-wrap gap-1.5">
                        {order.items.map((item) => (
                          <span
                            key={item.id}
                            className="text-[11px] px-2 py-1 bg-gray-50 border border-gray-100 rounded-full text-gray-600"
                          >
                            {item.product_snapshot?.name ??
                              `Product ${item.product_id}`}{" "}
                            ×{item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        <motion.div
          variants={fadeUp}
          className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500"
        >
          <p className="font-medium text-gray-700 mb-1 flex items-center gap-1.5">
            <Clock size={12} /> Order lifecycle
          </p>
          <p>
            Orders flow: Pending → Confirmed → Preparing → Out for delivery →
            Delivered. Pickup orders use Ready for pickup instead of Out for
            delivery. Payment status is tracked separately and never blocks the
            flow.
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
}

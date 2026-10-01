"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Search,
  AlertCircle,
  FileClock,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useOperationsAuditLogs, useStores } from "@/lib/query";
import { useAuthStore } from "@/stores/auth-store";
import {
  fadeUpTight as fadeUp,
  staggerTight as stagger,
} from "@/lib/motion/variants";
import { formatDateTime } from '@/lib/dates';
import Select from '@/components/ui/select';

export default function AuditLogsClient() {
  const { user } = useAuthStore();
  const { data: stores = [] } = useStores();
  const [storeIdInput, setStoreIdInput] = useState("");
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("");

  if (user?.role === "developer" && !storeIdInput && stores.length > 0) {
    const firstId = (stores[0] as { id?: number })?.id;
    if (firstId != null) setStoreIdInput(String(firstId));
  }

  const activeStoreId =
    user?.role === "developer" && storeIdInput
      ? Number(storeIdInput)
      : undefined;
  const params: Record<string, string> = {};
  if (search.trim()) params.search = search.trim();
  if (entityType) params.entity_type = entityType;

  const { data, isLoading, error, refetch, isFetching } =
    useOperationsAuditLogs(
      Object.keys(params).length ? params : undefined,
      activeStoreId,
    );

  const logs: any[] = (data as any)?.audit_logs ?? [];

  const filtered = logs.filter((log: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return JSON.stringify(log).toLowerCase().includes(q);
  });

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <motion.div initial="hidden" animate="show" variants={stagger}>
        <motion.div
          variants={fadeUp}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary mb-3"
            >
              <span aria-hidden="true">←</span>
              Back to dashboard
            </Link>
            <h1 className="font-display text-3xl font-bold flex items-center gap-2">
              <FileClock size={24} /> Audit Logs
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {filtered.length} entries · searchable and filterable
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-400 hover:text-primary"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          </button>
        </motion.div>

        {user?.role === "developer" && (
          <motion.div
            variants={fadeUp}
            className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3"
          >
            <label className="text-xs font-medium text-amber-800">
              Store ID:
            </label>
            <input
              value={storeIdInput}
              onChange={(e) => setStoreIdInput(e.target.value)}
              placeholder="e.g. 1"
              className="w-24 px-2 py-1 border border-amber-300 rounded-lg text-xs bg-white"
            />
            {stores.length > 0 && (
              <Select
                ariaLabel="Pick a store"
                value={storeIdInput}
                onChange={setStoreIdInput}
                options={[
                  { value: "", label: "Select…" },
                  ...stores.map((s: any) => ({ value: String(s.id), label: s.name })),
                ]}
                placeholder="Select…"
                size="xs"
                className="w-40"
              />
            )}
          </motion.div>
        )}

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
                placeholder="Search logs (user, action, entity)…"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 outline-none"
              />
            </div>
            <Select
              ariaLabel="Filter by entity"
              value={entityType}
              onChange={setEntityType}
              options={[
                { value: "", label: "All entities" },
                { value: "order", label: "Order" },
                { value: "product", label: "Product" },
                { value: "store", label: "Store" },
                { value: "rider", label: "Rider" },
                { value: "user", label: "User" },
              ]}
              placeholder="All entities"
              icon={<Filter size={14} />}
              className="w-44"
            />
          </div>
        </motion.div>

        {error && (
          <motion.div
            variants={fadeUp}
            className="mb-6 bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-center gap-2"
          >
            <AlertCircle size={16} className="text-accent" />
            <span className="text-sm">{(error as Error).message}</span>
            <button
              onClick={() => refetch()}
              className="ml-auto text-primary text-sm"
            >
              Retry
            </button>
          </motion.div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white border rounded-xl p-4 animate-pulse h-16"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border rounded-xl p-12 text-center text-sm text-gray-500">
            No audit logs found
          </div>
        ) : (
          <motion.div
            variants={fadeUp}
            className="bg-white border border-gray-100 rounded-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="text-left px-4 py-3">Time</th>
                    <th className="text-left px-4 py-3">User</th>
                    <th className="text-left px-4 py-3">Action</th>
                    <th className="text-left px-4 py-3">Entity</th>
                    <th className="text-left px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((log: any, idx: number) => (
                    <tr key={log.id ?? idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {log.user?.name ?? log.user_id ?? "System"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {log.event_type ?? log.action ?? log.type ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {log.entity_type ?? ""}{" "}
                        {log.entity_id ? `#${log.entity_id}` : ""}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[300px] truncate">
                        {log.old_status || log.new_status
                          ? `${log.old_status ?? ""} → ${log.new_status ?? ""}`
                          : (log.message ??
                            JSON.stringify(log.metadata ?? "").slice(0, 120))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        <motion.div
          variants={fadeUp}
          className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500"
        >
          <p className="font-medium text-gray-700 mb-1">How audit logs work</p>
          <p>
            Every status change, inventory update, dispatch assignment, and
            staff change is recorded. Filter by entity type or search across all
            fields. Developer must provide store_id for store-scoped logs.
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
}

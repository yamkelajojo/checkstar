"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Plus,
  Edit3,
  Trash2,
  Sparkles,
  Loader2,
  ExternalLink,
  Tag,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import {
  useAdminSpecials,
  useAdminSpecialDetail,
  useCreateAdminSpecial,
  useUpdateAdminSpecial,
  useDeleteAdminSpecial,
  useSyncSaleProducts,
  useCreateBanner,
  useAllProducts,
  useStores,
} from "@/lib/query";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  fadeUpTight as fadeUp,
  staggerTight as stagger,
} from "@/lib/motion/variants";
import PageHeader from "@/components/admin/PageHeader";
import SearchInput from "@/components/admin/SearchInput";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import EmptyState from "@/components/admin/EmptyState";
import ErrorState from "@/components/admin/ErrorState";
import { SaleStatusBadge } from "@/components/admin/StatusBadge";
import {
  resolveUserStore,
  type Product,
  type Special,
  type Store,
} from "@/types";
import { formatZar } from '@/lib/money';
import { formatDate } from '@/lib/dates'

const SALE_ROLES = ["developer", "store_owner", "store_manager"];

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function fmtDate(d: string | null | undefined) {
  // An unset date in an admin form stays empty; a set one uses the house format.
  if (!d) return "";
  return formatDate(d);
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

interface SaleEditorProps {
  initial: Special | null;
  isDeveloper: boolean;
  myStore: Store | null;
  stores: Store[];
  products: Product[];
  onClose: () => void;
}

function SaleEditor({
  initial,
  isDeveloper,
  myStore,
  stores,
  products,
  onClose,
}: SaleEditorProps) {
  const createMut = useCreateAdminSpecial();
  const updateMut = useUpdateAdminSpecial();
  const syncMut = useSyncSaleProducts();
  const createBannerMut = useCreateBanner();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [startDate, setStartDate] = useState(
    initial?.start_date?.slice(0, 10) ?? "",
  );
  const [endDate, setEndDate] = useState(initial?.end_date?.slice(0, 10) ?? "");
  const [active, setActive] = useState(initial?.is_active ?? true);
  const [storeId, setStoreId] = useState<string>(
    isDeveloper && initial?.store_id ? String(initial.store_id) : "",
  );
  // productId -> special price as typed ('' = keep the product's own price)
  const [selected, setSelected] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    for (const p of initial?.products ?? []) {
      map[p.id] =
        p.special_price != null ? Number(p.special_price).toFixed(2) : "";
    }
    return map;
  });
  const [withBanner, setWithBanner] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const visibleProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    const list = q
      ? products.filter((p) => p.name.toLowerCase().includes(q))
      : products;
    // Selected products first, then the rest — the picker stays predictable.
    return [...list].sort(
      (a, b) => Number(!!selected[b.id]) - Number(!!selected[a.id]),
    );
  }, [products, productSearch, selected]);

  const toggleProduct = (id: number) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id] !== undefined) delete next[id];
      else next[id] = "";
      return next;
    });
  };

  const selectedCount = Object.keys(selected).length;
  const linkedBanner = initial?.banner ?? null;

  const formatMoney = (value: number | string | null | undefined) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "0.00";
    return numeric.toFixed(2);
  };

  const validate = (): string | null => {
    if (!title.trim()) return "Title is required";
    if (!slug.trim()) return "Slug is required";
    if (!startDate) return "Start date is required";
    if (!endDate) return "End date is required";
    if (endDate <= startDate) return "End date must be after the start date";
    if (selectedCount === 0)
      return "A sale needs at least one product — pick the products below";
    for (const [pid, price] of Object.entries(selected)) {
      if (price !== "" && (isNaN(Number(price)) || Number(price) < 0)) {
        return `The special price for ${products.find((p) => p.id === Number(pid))?.name ?? "a product"} must be a number`;
      }
    }
    return null;
  };

  const save = async () => {
    const problem = validate();
    if (problem) {
      setFormError(problem);
      return;
    }
    setFormError(null);
    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        start_date: startDate,
        end_date: endDate,
        is_active: active,
      };
      if (isDeveloper) payload.store_id = storeId ? Number(storeId) : null;

      const saved = initial
        ? (await updateMut.mutateAsync({ id: initial.id, ...payload } as never))
            .data
        : (await createMut.mutateAsync(payload)).data;

      // Full product sync — the selection IS the sale's product list.
      const hadProducts = (initial?.products?.length ?? 0) > 0;
      if (selectedCount > 0 || hadProducts) {
        const entries = Object.entries(selected).map(([pid, price]) => {
          const entry: { product_id: number; special_price?: number } = {
            product_id: Number(pid),
          };
          if (price !== "") entry.special_price = Number(price);
          return entry;
        });
        await syncMut.mutateAsync({ id: saved.id, products: entries });
      }

      // Optional banner — the sale is already saved if this fails.
      if (withBanner && !linkedBanner) {
        try {
          await createBannerMut.mutateAsync({
            name: `${title.trim()} banner`,
            status: "published",
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            special_id: saved.id,
            slides: [
              {
                title: title.trim(),
                subtitle: `${selectedCount} product${selectedCount === 1 ? "" : "s"} at special prices`,
                ctaLabel: "View sale",
                url: `/specials/${saved.slug}`,
                bgType: "gradient",
                colors: ["#EB6522", "#CC4400"],
              },
            ],
          });
        } catch (e) {
          toast.warning(
            `Sale saved — banner not created: ${(e as Error).message}`,
          );
        }
      }

      toast.success(initial ? "Sale updated" : "Sale created");
      onClose();
    } catch (e) {
      setFormError((e as Error).message || "Could not save the sale");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="text-sm font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1.5 disabled:opacity-50"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          Back to sales
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900">
            {initial ? `Edit sale — ${initial.title}` : "New sale"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Products, prices, and an optional banner in one flow
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60 flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {initial ? "Save changes" : "Create sale"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Sale details */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Sale</h3>
          <div className="space-y-3">
            <div>
              <label
                htmlFor="sale-title"
                className="text-xs font-medium text-gray-500 block mb-1"
              >
                Title *
              </label>
              <input
                id="sale-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                placeholder="Spring Freshness Sale"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="sale-slug"
                  className="text-xs font-medium text-gray-500 block mb-1"
                >
                  Slug
                </label>
                <input
                  id="sale-slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(slugify(e.target.value));
                  }}
                  placeholder="spring-freshness-sale"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              {isDeveloper ? (
                <div>
                  <label
                    htmlFor="sale-store"
                    className="text-xs font-medium text-gray-500 block mb-1"
                  >
                    Store
                  </label>
                  <select
                    id="sale-store"
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Chain-wide (all stores)</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <span className="text-xs font-medium text-gray-500 block mb-1">
                    Store
                  </span>
                  <p className="border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600">
                    {myStore ? myStore.name : "Your store"}
                  </p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="sale-start"
                  className="text-xs font-medium text-gray-500 block mb-1"
                >
                  Start date *
                </label>
                <input
                  id="sale-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label
                  htmlFor="sale-end"
                  className="text-xs font-medium text-gray-500 block mb-1"
                >
                  End date *
                </label>
                <input
                  id="sale-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="sale-description"
                className="text-xs font-medium text-gray-500 block mb-1"
              >
                Description
              </label>
              <textarea
                id="sale-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Shown on the sale page"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30"
              />
              Sale is active (unpause to show it on the site)
            </label>
          </div>
        </section>

        {/* Products */}
        <section>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-900">
              Products *
              <span className="ml-2 text-xs font-normal text-gray-400">
                {selectedCount} selected
              </span>
            </h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Every product in a sale gets the special price you set — leave the
            price empty to keep the product&rsquo;s own price.
          </p>
          <div className="relative mb-2">
            <input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products to add to the sale"
              className="w-full pl-3 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div className="max-h-[28rem] overflow-y-auto border border-gray-200 rounded-lg divide-y">
            {visibleProducts.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-gray-400">
                No products match &ldquo;{productSearch}&rdquo;
              </p>
            )}
            {visibleProducts.map((p) => {
              const isSel = selected[p.id] !== undefined;
              const priceStr = selected[p.id] ?? "";
              const base =
                p.sale_price != null && Number(p.sale_price) < p.price
                  ? p.sale_price
                  : p.price;
              return (
                <div
                  key={p.id}
                  className={`px-3 py-2 flex items-center gap-3 ${isSel ? "bg-primary/5" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isSel}
                    onChange={() => toggleProduct(p.id)}
                    aria-label={`Include ${p.name} in the sale`}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {p.unit} · {formatZar(base)}
                    </p>
                  </div>
                  {isSel && (
                    <label className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] text-gray-500">R</span>
                      <input
                        value={priceStr}
                        onChange={(e) =>
                          setSelected((prev) => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                        inputMode="decimal"
                        placeholder={formatMoney(base)}
                        aria-label={`Special price for ${p.name} (empty keeps ${formatZar(base)})`}
                        className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Banner */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Banner</h3>
          {linkedBanner ? (
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <ImageIcon size={14} className="text-gray-400" />
              Fronted by
              <Link
                href="/admin/banners"
                className="text-primary hover:underline font-medium"
              >
                {linkedBanner.name}
              </Link>
            </p>
          ) : (
            <>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={withBanner}
                  onChange={(e) => setWithBanner(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                />
                Also create a home-page banner for this sale
              </label>
              {withBanner && (
                <div
                  className="mt-3 h-20 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #EB6522, #CC4400)",
                  }}
                >
                  {title || "Sale title"} — View sale → /specials/{slug || "…"}
                </div>
              )}
              <p className="text-[11px] text-gray-400 mt-2">
                The banner links shoppers straight to this sale&rsquo;s page.
                You can edit it later under Banners.
              </p>
            </>
          )}
        </section>

        {formError && (
          <p
            className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
            role="alert"
          >
            {formError}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SpecialsAdminClient() {
  const { user } = useAuthStore();
  const canManage = !!user && SALE_ROLES.includes(user.role);
  const isDeveloper = user?.role === "developer";
  const myStore = resolveUserStore(user);

  const {
    data: specials = [],
    isLoading,
    error,
    refetch,
  } = useAdminSpecials({ enabled: canManage });
  // useStores/useAllProducts hit public read endpoints (the catalogue and
  // /stores page use them) — no admin data is exposed by fetching them.
  const { data: stores = [] } = useStores();
  const { data: products = [] } = useAllProducts();
  const deleteMut = useDeleteAdminSpecial();

  const [search, setSearch] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<Special | null>(null);

  const { data: editingDetail } = useAdminSpecialDetail(
    showEditor && editingId != null ? editingId : null,
    canManage,
  );
  const editing =
    (showEditor && editingId != null ? editingDetail : null) ?? null;

  const filtered = useMemo(
    () =>
      specials.filter(
        (s) =>
          !search.trim() ||
          s.title.toLowerCase().includes(search.toLowerCase()),
      ),
    [specials, search],
  );

  if (!canManage) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon={Tag}
          title="Sales access only"
          hint="Sales are managed by store owners, managers, and developers. Ask an owner for access."
          action={
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 text-sm font-medium text-primary hover:underline"
            >
              Back to Dashboard
            </Link>
          }
        />
      </main>
    );
  }

  // Editor is a full page view — a 20+ row product picker deserves the
  // whole canvas (real scroll, no dialog), not a centered modal.
  if (showEditor) {
    if (editingId != null && editingDetail == null) {
      return (
        <main className="max-w-5xl mx-auto px-4 py-8" aria-busy="true">
          <div className="space-y-4">
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
            <div className="h-10 w-72 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </main>
      );
    }
    return (
      <SaleEditor
        key={editingId ?? "new"}
        initial={editing}
        isDeveloper={isDeveloper}
        myStore={myStore}
        stores={stores}
        products={products}
        onClose={() => {
          setShowEditor(false);
          setEditingId(null);
        }}
      />
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <motion.div initial="hidden" animate="show" variants={stagger}>
        <motion.div variants={fadeUp}>
          <PageHeader
            title="Sales"
            subtitle={`${specials.length} sale${specials.length === 1 ? "" : "s"}${myStore && !isDeveloper ? ` · ${myStore.name}` : ""}`}
            actions={
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setShowEditor(true);
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark flex items-center gap-2"
              >
                <Plus size={16} /> New sale
              </button>
            }
          />
        </motion.div>

        <motion.div variants={fadeUp} className="mb-6">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search sales by title…"
          />
        </motion.div>

        {error && (
          <motion.div variants={fadeUp} className="mb-6">
            <ErrorState
              message={(error as Error).message}
              onRetry={() => refetch()}
            />
          </motion.div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse h-16"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title={search ? `No sales match “${search}”` : "No sales yet"}
            hint={
              search
                ? "Try a different search."
                : "Create your first sale — products, prices, and an optional banner in one flow."
            }
            action={
              !search && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setShowEditor(true);
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark flex items-center gap-2"
                >
                  <Plus size={16} /> New sale
                </button>
              )
            }
          />
        ) : (
          <motion.div
            variants={fadeUp}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y"
          >
            {filtered.map((s) => (
              <div
                key={s.id}
                className="p-4 flex flex-wrap items-center gap-x-4 gap-y-2 hover:bg-gray-50"
              >
                <SaleStatusBadge special={s} />
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-sm truncate">
                      {s.title}
                    </span>
                    <span className="text-xs text-gray-400 truncate shrink-0">
                      /{s.slug}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap items-center gap-x-2">
                    <span>
                      {fmtDate(s.start_date)} → {fmtDate(s.end_date)}
                    </span>
                    <span>· {s.products?.length ?? 0} products</span>
                    {isDeveloper && (
                      <span>· {s.store?.name ?? "Chain-wide"}</span>
                    )}
                    {s.banner && (
                      <Link
                        href="/admin/banners"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <ImageIcon size={11} /> {s.banner.name}
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/specials/${s.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`View ${s.title} page`}
                    className="p-2 text-gray-400 hover:text-primary rounded-lg"
                  >
                    <ExternalLink size={14} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(s.id);
                      setShowEditor(true);
                    }}
                    aria-label={`Edit ${s.title}`}
                    className="p-2 text-gray-400 hover:text-primary rounded-lg"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(s)}
                    aria-label={`Delete ${s.title}`}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>

      <ConfirmDialog
        open={deleting != null}
        title="Delete this sale?"
        body={
          deleting
            ? `“${deleting.title}” and its product list will be removed. A linked banner keeps working but loses its sale link.`
            : ""
        }
        confirmLabel="Delete sale"
        loading={deleteMut.isPending}
        onConfirm={() => {
          if (deleting) {
            deleteMut.mutate(deleting.id, {
              onSuccess: () => {
                toast.success("Sale deleted");
                setDeleting(null);
              },
              onError: (e) => toast.error((e as Error).message),
            });
          }
        }}
        onClose={() => setDeleting(null)}
      />
    </main>
  );
}

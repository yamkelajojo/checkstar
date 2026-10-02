"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit3,
  X,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  useAdminBanners,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
} from "@/lib/query";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  fadeUpTight as fadeUp,
  staggerTight as stagger,
} from "@/lib/motion/variants";
import PageHeader from "@/components/admin/PageHeader";
import Modal from "@/components/admin/Modal";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import EmptyState from "@/components/admin/EmptyState";
import ErrorState from "@/components/admin/ErrorState";
import { BannerStatusBadge } from "@/components/admin/StatusBadge";
import Select from "@/components/ui/select";
import DatePicker from "@/components/ui/date-picker";
import ColorPicker from "@/components/ui/color-picker";
import Tooltip from "@/components/ui/tooltip";
import type { Banner, BannerSlide } from "@/types";
import { formatDate } from '@/lib/dates'

const EMPTY_SLIDE: BannerSlide = {
  title: "",
  subtitle: "",
  ctaLabel: "",
  url: "",
  bgType: "gradient",
  colors: ["#EB6522", "#CC4400"],
  pattern: "",
};

function SlideEditor({
  slide,
  index,
  onChange,
  onRemove,
}: {
  slide: BannerSlide;
  index: number;
  onChange: (index: number, slide: BannerSlide) => void;
  onRemove: (index: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-sm font-medium text-gray-700">
          Slide {index + 1}: {slide.title || "Untitled"}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
            className="text-red-400 hover:text-red-600"
          >
            <Trash2 size={14} />
          </button>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>
      {expanded && (
        <div className="p-4 space-y-4">
          <div className="space-y-3">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
              Slide content
            </label>
            <input
              placeholder="Title *"
              value={slide.title}
              onChange={(e) =>
                onChange(index, { ...slide, title: e.target.value })
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                placeholder="Subtitle"
                value={slide.subtitle ?? ""}
                onChange={(e) =>
                  onChange(index, {
                    ...slide,
                    subtitle: e.target.value || undefined,
                  })
                }
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <input
                placeholder="CTA Label"
                value={slide.ctaLabel ?? ""}
                onChange={(e) =>
                  onChange(index, {
                    ...slide,
                    ctaLabel: e.target.value || undefined,
                  })
                }
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <input
              placeholder="CTA URL"
              value={slide.url ?? ""}
              onChange={(e) =>
                onChange(index, { ...slide, url: e.target.value || undefined })
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                  Theme
                </label>
                <Select
                  value={slide.bgType}
                  onChange={(v) =>
                    onChange(index, {
                      ...slide,
                      bgType: v as BannerSlide["bgType"],
                    })
                  }
                  options={[
                    { value: "solid", label: "Solid" },
                    { value: "gradient", label: "Gradient" },
                    { value: "radial", label: "Radial" },
                  ]}
                  ariaLabel="Theme"
                />
              </div>
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Colors</label>
            <div className="flex gap-2 flex-wrap items-center">
              {slide.colors.map((color, ci) => (
                <div key={ci} className="flex items-center gap-1">
                  <ColorPicker
                    value={color}
                    ariaLabel={`Slide ${index + 1} colour ${ci + 1}`}
                    onChange={(nextHex) => {
                      const colors = [...slide.colors];
                      colors[ci] = nextHex;
                      onChange(index, { ...slide, colors });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const colors = slide.colors.filter((_, i) => i !== ci);
                      if (colors.length > 0)
                        onChange(index, { ...slide, colors });
                    }}
                    aria-label="Remove colour"
                    className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  onChange(index, {
                    ...slide,
                    colors: [...slide.colors, "#1E293B"],
                  })
                }
                aria-label="Add a colour"
                className="h-8 px-2.5 rounded-xl border border-dashed border-gray-300 flex items-center justify-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {/* Pattern */}
          <Select
            value={slide.pattern ?? ""}
            onChange={(v) =>
              onChange(index, {
                ...slide,
                pattern: v || undefined,
              })
            }
            options={[
              { value: "", label: "No pattern" },
              { value: "dots", label: "Dots" },
              { value: "lines", label: "Lines" },
              { value: "circles", label: "Circles" },
            ]}
            placeholder="No pattern"
            ariaLabel="Pattern"
            className="w-40"
          />

          {/* Preview */}
          <div
            className="h-20 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
            style={{
              background:
                slide.bgType === "gradient"
                  ? `linear-gradient(135deg, ${slide.colors.join(", ")})`
                  : slide.bgType === "radial"
                    ? `radial-gradient(circle, ${slide.colors.join(", ")})`
                    : slide.colors[0],
            }}
          >
            {slide.title || "Slide Preview"}
          </div>
        </div>
      )}
    </div>
  );
}

function BannerForm({
  banner,
  onClose,
}: {
  banner?: Banner | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(banner?.name ?? "");
  const [slides, setSlides] = useState<BannerSlide[]>(
    banner?.slides?.length ? banner.slides : [{ ...EMPTY_SLIDE }],
  );
  const [status, setStatus] = useState<string>(banner?.status ?? "draft");
  const [startDate, setStartDate] = useState(
    banner?.start_date?.slice(0, 10) ?? "",
  );
  const [endDate, setEndDate] = useState(banner?.end_date?.slice(0, 10) ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();

  const isEditing = !!banner;
  const isLoading = createBanner.isPending || updateBanner.isPending;

  const handleSave = () => {
    setFormError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Banner name is required");
      return;
    }
    const untitled = slides.findIndex((s) => !s.title?.trim());
    if (untitled !== -1) {
      setFormError(`Slide ${untitled + 1} needs a title`);
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      setFormError("End date cannot be before the start date");
      return;
    }

    const data = {
      name: trimmedName,
      slides,
      status,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    };

    const onError = (err: unknown) => {
      setFormError(
        err instanceof Error
          ? err.message
          : "Could not save the banner — please try again",
      );
    };

    if (isEditing) {
      updateBanner.mutate(
        { id: banner.id, ...data },
        {
          onSuccess: () => {
            toast.success("Banner updated");
            onClose();
          },
          onError,
        },
      );
    } else {
      createBanner.mutate(data, {
        onSuccess: () => {
          toast.success("Banner created");
          onClose();
        },
        onError,
      });
    }
  };

  const updateSlide = (index: number, slide: BannerSlide) => {
    setSlides((prev) => prev.map((s, i) => (i === index ? slide : s)));
  };

  const removeSlide = (index: number) => {
    setSlides((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Modal
      open
      onClose={isLoading ? () => {} : onClose}
      title={isEditing ? "Edit Banner" : "New Banner"}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg disabled:opacity-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name || slides.length === 0 || isLoading}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            <Save size={14} />
            {isEditing ? "Update" : "Create"}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
            Banner name
          </label>
          <input
            placeholder="Banner name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-2">
            <label htmlFor="banner-status" className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
              Status
            </label>
            <Select
              id="banner-status"
              value={status}
              onChange={setStatus}
              options={[
                { value: "draft", label: "Draft" },
                { value: "published", label: "Published" },
              ]}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="banner-start-date"
              className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500"
            >
              Start date
            </label>
            <DatePicker
              id="banner-start-date"
              placeholder="Start date"
              value={startDate}
              onChange={setStartDate}
              rangeStart={startDate}
              rangeEnd={endDate}
              maxDate={endDate || undefined}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="banner-end-date"
              className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500"
            >
              End date
            </label>
            <DatePicker
              id="banner-end-date"
              placeholder="End date"
              value={endDate}
              onChange={setEndDate}
              rangeStart={startDate}
              rangeEnd={endDate}
              minDate={startDate || undefined}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Slides</h3>
            <button
              onClick={() => setSlides((prev) => [...prev, { ...EMPTY_SLIDE }])}
              className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
            >
              <Plus size={14} /> Add Slide
            </button>
          </div>
          <div className="space-y-3">
            {slides.map((slide, i) => (
              <SlideEditor
                key={i}
                slide={slide}
                index={i}
                onChange={updateSlide}
                onRemove={removeSlide}
              />
            ))}
          </div>
        </div>
      </div>

      {formError && (
        <p
          className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
          role="alert"
        >
          {formError}
        </p>
      )}
    </Modal>
  );
}

const BANNER_ROLES = ["developer", "store_owner", "store_manager"];

export default function BannersClient() {
  const { user } = useAuthStore();
  // Banner routes are role:developer,store_owner,store_manager — the (admin)
  // layout also admits logistics officers to /admin/*, so gate here rather
  // than rendering a page whose every API call 403s.
  const canManage = !!user && BANNER_ROLES.includes(user.role);

  const {
    data: banners = [],
    isLoading,
    error,
    refetch,
  } = useAdminBanners({ enabled: canManage });
  const deleteBanner = useDeleteBanner();

  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState<Banner | null>(null);

  if (!canManage) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon={ImageIcon}
          title="Banner access only"
          hint="Banners are managed by store owners and managers. Ask an owner for access."
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

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <motion.div initial="hidden" animate="show" variants={stagger}>
        {/* Header */}
        <motion.div variants={fadeUp} className="mb-6">
          <PageHeader
            title="Banners"
            subtitle={`Create and manage promotional banners displayed on the home page · ${banners.length} banner${banners.length !== 1 ? "s" : ""}`}
            actions={
              <button
                onClick={() => {
                  setEditingBanner(null);
                  setShowForm(true);
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
              >
                <Plus size={16} /> New Banner
              </button>
            }
          />
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div variants={fadeUp} className="mb-6">
            <ErrorState message={error.message} onRetry={() => refetch()} />
          </motion.div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-xl p-5"
              >
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-48 bg-gray-100 rounded" />
                  <div className="h-3 w-32 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : banners.length === 0 ? (
          <motion.div variants={fadeUp}>
            <EmptyState
              icon={ImageIcon}
              title="No banners yet"
              hint="Create your first promotional banner to display on the home page — or create one from a sale."
              action={
                <button
                  onClick={() => {
                    setEditingBanner(null);
                    setShowForm(true);
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
                >
                  Create Banner
                </button>
              }
            />
          </motion.div>
        ) : (
          <motion.div variants={fadeUp} className="space-y-4">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">
                        {banner.name}
                      </h3>
                      <BannerStatusBadge status={banner.status} />
                      {banner.special && (
                        <Link
                          href={`/specials/${banner.special.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <Sparkles size={11} /> Fronts sale:{" "}
                          {banner.special.title}
                        </Link>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      {banner.slides.length} slide
                      {banner.slides.length !== 1 ? "s" : ""}
                      {banner.store && ` · ${banner.store.name}`}
                      {banner.start_date &&
                        ` · From ${formatDate(banner.start_date)}`}
                      {banner.end_date &&
                        ` · Until ${formatDate(banner.end_date)}`}
                    </p>

                    {/* Slide preview thumbnails */}
                    <div className="flex gap-2 mt-2">
                      {banner.slides.slice(0, 4).map((slide, i) => (
                        <Tooltip key={i} content={slide.title}>
                          <div
                            className="h-10 w-20 rounded-md flex items-center justify-center text-white text-xs font-medium truncate px-2"
                            style={{
                              background:
                                slide.bgType === "gradient"
                                  ? `linear-gradient(135deg, ${slide.colors.join(", ")})`
                                  : slide.bgType === "radial"
                                    ? `radial-gradient(circle, ${slide.colors.join(", ")})`
                                    : slide.colors[0],
                            }}
                          >
                            {slide.title}
                          </div>
                        </Tooltip>
                      ))}
                      {banner.slides.length > 4 && (
                        <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                          +{banner.slides.length - 4}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Tooltip content="Edit">
                      <button
                        onClick={() => {
                          setEditingBanner(banner);
                          setShowForm(true);
                        }}
                        aria-label="Edit"
                        className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip content="Delete">
                      <button
                        onClick={() => setDeleting(banner)}
                        className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        aria-label={`Delete ${banner.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Create/Edit form modal */}
      {showForm && (
        <BannerForm
          banner={editingBanner}
          onClose={() => {
            setShowForm(false);
            setEditingBanner(null);
          }}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleting != null}
        title="Delete this banner?"
        body={
          deleting
            ? `“${deleting.name}” will be removed from the home page rotation. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete banner"
        loading={deleteBanner.isPending}
        onConfirm={() => {
          if (deleting) {
            deleteBanner.mutate(deleting.id, {
              onSuccess: () => {
                toast.success("Banner deleted");
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

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Image as ImageIcon, Plus, Trash2, Edit3, Eye, EyeOff,
  ChevronDown, ChevronUp, Save, X, Loader2, AlertCircle,
} from 'lucide-react'
import { useAdminBanners, useCreateBanner, useUpdateBanner, useDeleteBanner } from '@/lib/query'
import { fadeUpTight as fadeUp, staggerTight as stagger } from '@/lib/motion/variants'
import type { Banner, BannerSlide } from '@/types'

const EMPTY_SLIDE: BannerSlide = {
  title: '',
  subtitle: '',
  ctaLabel: '',
  url: '',
  bgType: 'gradient',
  colors: ['#EB6522', '#CC4400'],
  pattern: '',
}

function SlideEditor({ slide, index, onChange, onRemove }: {
  slide: BannerSlide
  index: number
  onChange: (index: number, slide: BannerSlide) => void
  onRemove: (index: number) => void
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-sm font-medium text-gray-700">Slide {index + 1}: {slide.title || 'Untitled'}</span>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onRemove(index) }} className="text-red-400 hover:text-red-600">
            <Trash2 size={14} />
          </button>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>
      {expanded && (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Title *"
              value={slide.title}
              onChange={(e) => onChange(index, { ...slide, title: e.target.value })}
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <input
              placeholder="Subtitle"
              value={slide.subtitle ?? ''}
              onChange={(e) => onChange(index, { ...slide, subtitle: e.target.value || undefined })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <input
              placeholder="CTA Label"
              value={slide.ctaLabel ?? ''}
              onChange={(e) => onChange(index, { ...slide, ctaLabel: e.target.value || undefined })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <input
              placeholder="CTA URL"
              value={slide.url ?? ''}
              onChange={(e) => onChange(index, { ...slide, url: e.target.value || undefined })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <select
              value={slide.bgType}
              onChange={(e) => onChange(index, { ...slide, bgType: e.target.value as BannerSlide['bgType'] })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="solid">Solid</option>
              <option value="gradient">Gradient</option>
              <option value="radial">Radial</option>
            </select>
          </div>

          {/* Colors */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Colors</label>
            <div className="flex gap-2 flex-wrap">
              {slide.colors.map((color, ci) => (
                <div key={ci} className="flex items-center gap-1">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => {
                      const colors = [...slide.colors]
                      colors[ci] = e.target.value
                      onChange(index, { ...slide, colors })
                    }}
                    className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                  />
                  <button
                    onClick={() => {
                      const colors = slide.colors.filter((_, i) => i !== ci)
                      if (colors.length > 0) onChange(index, { ...slide, colors })
                    }}
                    className="text-gray-400 hover:text-red-500 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => onChange(index, { ...slide, colors: [...slide.colors, '#000000'] })}
                className="w-8 h-8 rounded border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400"
              >
                +
              </button>
            </div>
          </div>

          {/* Pattern */}
          <select
            value={slide.pattern ?? ''}
            onChange={(e) => onChange(index, { ...slide, pattern: e.target.value || undefined })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">No pattern</option>
            <option value="dots">Dots</option>
            <option value="lines">Lines</option>
            <option value="circles">Circles</option>
          </select>

          {/* Preview */}
          <div
            className="h-20 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
            style={{
              background: slide.bgType === 'gradient'
                ? `linear-gradient(135deg, ${slide.colors.join(', ')})`
                : slide.bgType === 'radial'
                ? `radial-gradient(circle, ${slide.colors.join(', ')})`
                : slide.colors[0],
            }}
          >
            {slide.title || 'Slide Preview'}
          </div>
        </div>
      )}
    </div>
  )
}

function BannerForm({ banner, onClose }: { banner?: Banner | null; onClose: () => void }) {
  const [name, setName] = useState(banner?.name ?? '')
  const [slides, setSlides] = useState<BannerSlide[]>(banner?.slides?.length ? banner.slides : [{ ...EMPTY_SLIDE }])
  const [status, setStatus] = useState<string>(banner?.status ?? 'draft')
  const [startDate, setStartDate] = useState(banner?.start_date?.slice(0, 10) ?? '')
  const [endDate, setEndDate] = useState(banner?.end_date?.slice(0, 10) ?? '')

  const createBanner = useCreateBanner()
  const updateBanner = useUpdateBanner()

  const isEditing = !!banner
  const isLoading = createBanner.isPending || updateBanner.isPending

  const handleSave = () => {
    const data = {
      name,
      slides,
      status,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    }

    if (isEditing) {
      updateBanner.mutate({ id: banner.id, ...data }, { onSuccess: onClose })
    } else {
      createBanner.mutate(data, { onSuccess: onClose })
    }
  }

  const updateSlide = (index: number, slide: BannerSlide) => {
    setSlides((prev) => prev.map((s, i) => (i === index ? slide : s)))
  }

  const removeSlide = (index: number) => {
    setSlides((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-display text-lg font-semibold">{isEditing ? 'Edit Banner' : 'New Banner'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Name */}
          <input
            placeholder="Banner name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />

          {/* Status + dates */}
          <div className="grid grid-cols-3 gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <input
              type="date"
              placeholder="Start date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <input
              type="date"
              placeholder="End date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* Slides */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Slides</h3>
              <button
                onClick={() => setSlides((prev) => [...prev, { ...EMPTY_SLIDE }])}
                className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Add Slide
              </button>
            </div>
            <div className="space-y-3">
              {slides.map((slide, i) => (
                <SlideEditor key={i} slide={slide} index={i} onChange={updateSlide} onRemove={removeSlide} />
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name || slides.length === 0 || isLoading}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            <Save size={14} />
            {isEditing ? 'Update' : 'Create'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function BannersClient() {
  const { data: banners = [], isLoading, error } = useAdminBanners()
  const deleteBanner = useDeleteBanner()

  const [showForm, setShowForm] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleDelete = (id: number) => {
    setDeletingId(id)
  }

  const confirmDelete = () => {
    if (deletingId != null) {
      deleteBanner.mutate(deletingId, { onSuccess: () => setDeletingId(null) })
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <motion.div initial="hidden" animate="show" variants={stagger}>
        {/* Header */}
        <motion.div variants={fadeUp} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-3xl font-bold text-gray-900">Banners</h1>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  <ImageIcon size={12} />
                  {banners.length} banner{banners.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                Create and manage promotional banners displayed on the home page.
              </p>
            </div>
            <button
              onClick={() => { setEditingBanner(null); setShowForm(true) }}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
            >
              <Plus size={16} /> New Banner
            </button>
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div variants={fadeUp} className="mb-6 bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle size={18} className="text-accent shrink-0" />
            <p className="text-sm text-gray-600">{error.message}</p>
          </motion.div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-48 bg-gray-100 rounded" />
                  <div className="h-3 w-32 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : banners.length === 0 ? (
          <motion.div variants={fadeUp} className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <ImageIcon size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">No banners yet</p>
            <p className="text-sm text-gray-400 mb-4">Create your first promotional banner to display on the home page.</p>
            <button
              onClick={() => { setEditingBanner(null); setShowForm(true) }}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
            >
              Create Banner
            </button>
          </motion.div>
        ) : (
          <motion.div variants={fadeUp} className="space-y-4">
            {banners.map((banner) => (
              <div key={banner.id} className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{banner.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        banner.status === 'published'
                          ? 'bg-success/10 text-success'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {banner.status === 'published' ? <Eye size={10} /> : <EyeOff size={10} />}
                        {banner.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      {banner.slides.length} slide{banner.slides.length !== 1 ? 's' : ''}
                      {banner.store && ` · ${banner.store.name}`}
                      {banner.start_date && ` · From ${new Date(banner.start_date).toLocaleDateString()}`}
                      {banner.end_date && ` · Until ${new Date(banner.end_date).toLocaleDateString()}`}
                    </p>

                    {/* Slide preview thumbnails */}
                    <div className="flex gap-2 mt-2">
                      {banner.slides.slice(0, 4).map((slide, i) => (
                        <div
                          key={i}
                          className="h-10 w-20 rounded-md flex items-center justify-center text-white text-xs font-medium truncate px-2"
                          style={{
                            background: slide.bgType === 'gradient'
                              ? `linear-gradient(135deg, ${slide.colors.join(', ')})`
                              : slide.bgType === 'radial'
                              ? `radial-gradient(circle, ${slide.colors.join(', ')})`
                              : slide.colors[0],
                          }}
                          title={slide.title}
                        >
                          {slide.title}
                        </div>
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
                    <button
                      onClick={() => { setEditingBanner(banner); setShowForm(true) }}
                      className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                      title="Edit"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Create/Edit form modal */}
      <AnimatePresence>
        {showForm && (
          <BannerForm
            banner={editingBanner}
            onClose={() => { setShowForm(false); setEditingBanner(null) }}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deletingId != null && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            >
              <h3 className="font-display text-lg font-semibold mb-2">Delete Banner</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this banner? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  disabled={deleteBanner.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteBanner.isPending}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {deleteBanner.isPending && <Loader2 size={14} className="animate-spin" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}

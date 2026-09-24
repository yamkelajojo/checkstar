'use client'

import { Loader2, AlertCircle } from 'lucide-react'
import Modal from './Modal'

/**
 * The one way destructive/confirming actions are confirmed in the admin area.
 * Replaces hand-rolled delete dialogs and native `window.confirm()` calls.
 */
interface ConfirmDialogProps {
  open: boolean
  title: string
  /** What will happen if confirmed. One or two short sentences. */
  body: string
  confirmLabel?: string
  /** True while the destructive mutation is in flight. */
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Delete',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-60 flex items-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
          <AlertCircle size={17} className="text-red-500" />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
      </div>
    </Modal>
  )
}

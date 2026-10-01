'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { MapPin, Plus, Pencil, Trash2, Star, Loader2, LocateFixed, X } from 'lucide-react'
import { api, ApiError } from '@/lib/api'
import { getDeliveryCoords } from '@/lib/delivery-coords'
import { searchAddressSuggestions, resolveAddressCoordinates, reverseResolveAddress } from '@/lib/address-suggestions'
import type { UserAddress } from '@/types'

interface FormState {
  id: number | null
  label: string
  address: string
  latitude: string
  longitude: string
  is_default: boolean
}

const emptyForm: FormState = { id: null, label: '', address: '', latitude: '', longitude: '', is_default: false }

export default function AddressBookSection() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['addresses'], queryFn: api.getAddresses })
  const addresses: UserAddress[] = data?.data ?? []

  const [form, setForm] = useState<FormState | null>(null)
  const [formError, setFormError] = useState('')
  const [listError, setListError] = useState('')
  const [locating, setLocating] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const addressSuggestions = form ? searchAddressSuggestions(form.address, 5) : []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['addresses'] })

  const saveMutation = useMutation({
    mutationFn: (f: FormState) => {
      const payload = {
        label: f.label.trim() || 'Home',
        address: f.address.trim(),
        latitude: Number(f.latitude),
        longitude: Number(f.longitude),
        is_default: f.is_default,
      }
      return f.id === null ? api.createAddress(payload) : api.updateAddress(f.id, payload)
    },
    onSuccess: () => {
      setForm(null)
      invalidate()
    },
    onError: (err: Error) => {
      setFormError(err instanceof ApiError && err.status === 422 ? 'Please check the address and coordinates.' : err.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteAddress(id),
    onSuccess: invalidate,
    onError: (err: Error) => setListError(err.message),
  })

  const defaultMutation = useMutation({
    mutationFn: (id: number) => api.updateAddress(id, { is_default: true }),
    onSuccess: invalidate,
    onError: (err: Error) => setListError(err.message),
  })

  const openAdd = () => {
    setFormError('')
    setForm({ ...emptyForm })
  }

  const openEdit = (a: UserAddress) => {
    setFormError('')
    setForm({
      id: a.id,
      label: a.label,
      address: a.address,
      latitude: String(a.latitude),
      longitude: String(a.longitude),
      is_default: a.is_default,
    })
  }

  const useCurrentLocation = async () => {
    setLocating(true)
    setFormError('')
    try {
      const coords = await getDeliveryCoords()
      const resolved = reverseResolveAddress(coords.latitude, coords.longitude)
      setForm(f =>
        f
          ? {
              ...f,
              label: f.label.trim() ? f.label : resolved.label,
              address: resolved.address,
              latitude: String(resolved.latitude),
              longitude: String(resolved.longitude),
            }
          : f,
      )
      setShowSuggestions(false)
    } catch {
      setFormError('Could not get your location — enter coordinates manually.')
    } finally {
      setLocating(false)
    }
  }

  const handleDelete = (a: UserAddress) => {
    if (!confirm(`Delete the "${a.label}" address?`)) return
    setListError('')
    deleteMutation.mutate(a.id)
  }

  return (
    <section aria-labelledby="addresses-heading" className="bg-white border border-gray-100 rounded-xl p-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 id="addresses-heading" className="font-display text-lg font-semibold flex items-center gap-2">
          <MapPin size={18} className="text-primary" /> Saved Addresses
        </h2>
        {form === null && (
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors px-3 py-1.5 rounded-lg hover:bg-primary-light/40 min-h-[36px]"
          >
            <Plus size={15} /> Add Address
          </button>
        )}
      </div>

      {listError && (
        <div className="bg-accent/10 border border-accent/30 text-accent text-sm rounded-lg px-4 py-3 mb-4">{listError}</div>
      )}

      {isLoading ? (
        <div className="space-y-2" aria-hidden="true">
          <div className="h-14 rounded-lg bg-gray-100 animate-pulse" />
          <div className="h-14 rounded-lg bg-gray-100 animate-pulse" />
        </div>
      ) : (
        <>
          {addresses.length === 0 && form === null && (
            <p className="text-sm text-gray-500">
              No saved addresses yet. Add one so checkout can offer it — delivery orders resolve their store from its pin.
            </p>
          )}

          <ul className="divide-y divide-gray-100">
            <AnimatePresence initial={false}>
              {addresses.map(a => (
                <motion.li
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="py-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium flex items-center gap-2">
                      {a.label}
                      {a.is_default && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary-light/50 rounded-full px-2 py-0.5">
                          <Star size={10} className="fill-primary" /> Default
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{a.address}</p>
                    <p className="text-xs text-gray-400 tabular-nums">
                      {Number(a.latitude).toFixed(5)}, {Number(a.longitude).toFixed(5)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!a.is_default && (
                      <button
                        type="button"
                        onClick={() => defaultMutation.mutate(a.id)}
                        disabled={defaultMutation.isPending}
                        aria-label={`Make ${a.label} the default address`}
                        className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-light/30 transition-colors min-h-[36px] min-w-[36px]"
                      >
                        <Star size={15} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(a)}
                      aria-label={`Edit ${a.label}`}
                      className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-light/30 transition-colors min-h-[36px] min-w-[36px]"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(a)}
                      disabled={deleteMutation.isPending}
                      aria-label={`Delete ${a.label}`}
                      className="p-2 rounded-lg text-gray-400 hover:text-accent hover:bg-accent/10 transition-colors min-h-[36px] min-w-[36px]"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <AnimatePresence>
            {form !== null && (
              <motion.form
                key="address-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={e => {
                  e.preventDefault()
                  setFormError('')
                  if (!form.address.trim()) {
                    setFormError('Please enter the street address.')
                    return
                  }
                  let lat = form.latitude.trim()
                  let lng = form.longitude.trim()
                  if (!lat || !lng || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
                    const resolved = resolveAddressCoordinates(form.address)
                    lat = String(resolved.latitude)
                    lng = String(resolved.longitude)
                  }
                  saveMutation.mutate({ ...form, latitude: lat, longitude: lng })
                }}
                className="mt-4 space-y-3 overflow-hidden"
              >
                {formError && <div className="bg-accent/10 border border-accent/30 text-accent text-sm rounded-lg px-4 py-3">{formError}</div>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="address-label" className="block text-xs font-medium text-gray-600 mb-1">Label</label>
                    <input
                      id="address-label"
                      type="text"
                      maxLength={50}
                      value={form.label}
                      onChange={e => setForm({ ...form, label: e.target.value })}
                      placeholder="Home, Work…"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-600 mb-1">Pin</span>
                    <button
                      type="button"
                      onClick={useCurrentLocation}
                      disabled={locating}
                      className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60 min-h-[38px]"
                    >
                      {locating ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
                      Use my current location
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <label htmlFor="address-street" className="block text-xs font-medium text-gray-600 mb-1">Street Address</label>
                  <textarea
                    id="address-street"
                    rows={2}
                    maxLength={500}
                    value={form.address}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                    onChange={e => {
                      const val = e.target.value
                      setForm({ ...form, address: val })
                      setShowSuggestions(true)
                    }}
                    placeholder="Start typing a street or suburb (e.g. 195 Florida Road, Morningside, Durban)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                  />
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-50">
                      {addressSuggestions.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onMouseDown={ev => {
                            ev.preventDefault()
                            setForm({
                              ...form,
                              address: s.address,
                              latitude: String(s.latitude),
                              longitude: String(s.longitude),
                            })
                            setShowSuggestions(false)
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-start gap-2"
                        >
                          <MapPin size={13} className="text-primary mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-gray-900 truncate">{s.address}</p>
                            <p className="text-[10px] text-gray-400">Checkstar {s.storeArea} ({s.latitude.toFixed(4)}, {s.longitude.toFixed(4)})</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="address-lat" className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                    <input
                      id="address-lat"
                      type="text"
                      inputMode="decimal"
                      value={form.latitude}
                      onChange={e => setForm({ ...form, latitude: e.target.value })}
                      placeholder="-29.8587"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm tabular-nums focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="address-lng" className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                    <input
                      id="address-lng"
                      type="text"
                      inputMode="decimal"
                      value={form.longitude}
                      onChange={e => setForm({ ...form, longitude: e.target.value })}
                      placeholder="31.0218"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm tabular-nums focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_default}
                    onChange={e => setForm({ ...form, is_default: e.target.checked })}
                    className="h-4 w-4 accent-primary"
                  />
                  Make this my default address
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm(null)}
                    className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
                  >
                    <X size={14} /> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60 inline-flex items-center gap-1.5"
                  >
                    {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckGlyph />}
                    {saveMutation.isPending ? 'Saving…' : form.id === null ? 'Save Address' : 'Update Address'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </>
      )}
    </section>
  )
}

function CheckGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

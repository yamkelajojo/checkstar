'use client'

import { Search } from 'lucide-react'

/** The one admin search field (icon + placeholder + focus ring). */
interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label?: string
}

export default function SearchInput({ value, onChange, placeholder, label }: SearchInputProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
      <label className="sr-only" htmlFor={`admin-search-${placeholder.replace(/\s/g, '-')}`}>
        {label ?? placeholder}
      </label>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          id={`admin-search-${placeholder.replace(/\s/g, '-')}`}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
        />
      </div>
    </div>
  )
}

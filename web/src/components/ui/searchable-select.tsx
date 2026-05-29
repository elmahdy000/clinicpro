"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckIcon, ChevronDownIcon, SearchIcon, XIcon } from "lucide-react"
import { createPortal } from "react-dom"

function normalizeArabic(text: string): string {
  return text
    .trim()
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[ًٌٍَُِّْ]/g, '')
    .toLowerCase()
}

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

type SearchableSelectProps = {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  placeholder: string
  searchPlaceholder?: string
  disabled?: boolean
  loading?: boolean
  noResultsText?: string
  className?: string
  rtl?: boolean
}

export function SearchableSelect({
  value,
  options,
  onChange,
  placeholder,
  searchPlaceholder,
  disabled,
  loading,
  noResultsText = "No results",
  className,
  rtl,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({})

  const filteredOptions = search
    ? options.filter((opt) => {
        const normalizedSearch = normalizeArabic(search)
        const normalizedLabel = normalizeArabic(opt.label)
        return normalizedLabel.includes(normalizedSearch)
      })
    : options

  const selectedLabel = options.find((opt) => opt.value === value)?.label

  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus({ preventScroll: true })
    }
  }, [open])

  const updatePosition = React.useCallback(() => {
    if (!containerRef.current || !open) return
    const rect = containerRef.current.getBoundingClientRect()
    setDropdownStyle({
      position: 'fixed',
      width: `${rect.width}px`,
      top: `${rect.bottom + 6}px`,
      left: rtl ? 'auto' : `${rect.left}px`,
      right: rtl ? `${window.innerWidth - rect.right}px` : 'auto',
    })
  }, [open, rtl])

  React.useEffect(() => {
    if (!open) return
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        !(e.target as Element)?.closest?.('[data-dropdown-portal]')
      ) {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) { setOpen(!open); setSearch(""); } }}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 text-sm text-slate-800 shadow-sm transition-all",
          "border-slate-200 hover:border-cyan-300",
          "focus-visible:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-100 focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
          open && "border-cyan-500 ring-2 ring-cyan-100",
        )}
      >
        <span className={cn("truncate", !selectedLabel && !loading && "text-slate-400")}>
          {loading && !selectedLabel
            ? "جارٍ التحميل..."
            : selectedLabel || placeholder}
        </span>
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-slate-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && createPortal(
        <div
          data-dropdown-portal
          style={dropdownStyle}
          className="fixed z-[110] rounded-2xl bg-white border border-slate-200 shadow-xl max-h-[260px] flex flex-col overflow-hidden p-1"
          dir={rtl ? "rtl" : "ltr"}
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
            <SearchIcon className="size-4 shrink-0 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder || "ابحث..."}
              className="h-9 flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 border-none outline-none focus:ring-0 focus:border-transparent p-0 m-0 shadow-none"
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault()
                  const first = filteredOptions[0]
                  if (first) {
                    onChange(first.value)
                    const el = document.querySelector(`[data-option-id="${first.value}"]`)
                    el?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
                  }
                }
                if (e.key === "Enter") {
                  const first = filteredOptions[0]
                  if (first) {
                    onChange(first.value)
                    setOpen(false)
                    setSearch("")
                  }
                }
                if (e.key === "Escape") {
                  setOpen(false)
                  setSearch("")
                }
              }}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-1 space-y-0.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
            {loading ? (
              <div className="flex h-20 items-center justify-center text-sm text-slate-400">
                جارٍ التحميل...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="flex h-20 items-center justify-center text-sm text-slate-400">
                {noResultsText}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  data-option-id={option.value}
                  disabled={option.disabled}
                  onClick={() => {
                    if (option.disabled) return
                    onChange(option.value)
                    setSearch("")
                    setOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 h-10 text-sm transition-colors rounded-xl outline-none",
                    rtl ? "text-right" : "text-left",
                    option.disabled && "cursor-not-allowed text-slate-300",
                    !option.disabled && option.value === value
                      ? "bg-cyan-50 text-cyan-700 font-semibold"
                      : "text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 focus:bg-cyan-50 focus:text-cyan-700"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center",
                      option.value === value ? "text-cyan-600" : "text-transparent"
                    )}
                  >
                    {option.value === value && <CheckIcon className="size-3.5" strokeWidth={3} />}
                  </span>
                  <span className="truncate flex-1">{option.label}</span>
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

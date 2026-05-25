import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-right text-sm leading-normal text-slate-900 placeholder:text-slate-400 shadow-sm transition",
        "focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-100",
        "focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:ring-cyan-900/30 dark:focus-visible:ring-cyan-900/30",
        className
      )}
      {...props}
    />
  )
}

export { Input }

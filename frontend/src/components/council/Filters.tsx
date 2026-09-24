import type { ReactNode, SelectHTMLAttributes } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * The filter row above a Council list: one line of compact controls, the way
 * the dataviz and queue screens both want filters — together, above what they
 * filter, never scattered through it.
 */
export function FilterBar({ children, onClear, active }: { children: ReactNode; onClear?: () => void; active?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {children}
      {active && onClear ? (
        <button type="button" onClick={onClear} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[0.8125rem] font-medium text-ui-tint hover:bg-ui-fill">
          <X aria-hidden="true" className="h-3.5 w-3.5" />
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

export function FilterSelect({ label, className, children, value, ...select }: { label: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  const set = value !== undefined && value !== "";

  return (
    <label className={cn("relative inline-flex", className)}>
      <span className="sr-only">{label}</span>
      <select
        {...select}
        value={value}
        className={cn(
          "h-9 max-w-[14rem] cursor-pointer appearance-none truncate rounded-full py-0 pl-3.5 pr-8 text-[0.8125rem] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-tint",
          set ? "bg-ui-tint/15 text-ui-tint" : "bg-ui-card text-ui-label shadow-[0_0_0_1px_var(--ui-separator)]",
        )}
      >
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ui-label-3" />
    </label>
  );
}

export function SearchBox({ value, onChange, placeholder, label }: { value: string; onChange: (value: string) => void; placeholder: string; label: string }) {
  return (
    <label className="relative block min-w-[12rem] flex-1">
      <span className="sr-only">{label}</span>
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-label-3" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-full bg-ui-card pl-9 pr-3 text-[0.875rem] text-ui-label shadow-[0_0_0_1px_var(--ui-separator)] placeholder:text-ui-label-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-tint"
      />
    </label>
  );
}

/** Previous / next, with where you are. */
export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const button = "rounded-full px-4 py-1.5 text-[0.875rem] font-medium text-ui-tint hover:bg-ui-fill disabled:pointer-events-none disabled:text-ui-label-3";

  return (
    <nav aria-label="Pages" className="flex items-center justify-between px-1">
      <button type="button" className={button} disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span className="text-[0.8125rem] tabular-nums text-ui-label-2">
        {(page - 1) * pageSize + 1}–{Math.min(total, page * pageSize)} of {total}
      </span>
      <button type="button" className={button} disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </nav>
  );
}

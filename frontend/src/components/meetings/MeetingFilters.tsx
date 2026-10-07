"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Participant } from "@/lib/types";

export interface Filters {
  q: string;
  participantId: string;
  dateFrom: string;
  dateTo: string;
  sort: "newest" | "oldest";
}

interface Props {
  filters: Filters;
  participants: Participant[];
  hasActiveFilters: boolean;
  onChange: (patch: Partial<Filters>) => void;
  onClear: () => void;
}

const control =
  "h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25";

export function MeetingFilters({ filters, participants, hasActiveFilters, onChange, onClear }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          aria-label="Search meetings"
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="Search by title or participant"
          className={`${control} w-full pr-9 pl-9 placeholder:text-muted [&::-webkit-search-cancel-button]:hidden`}
        />
        {filters.q && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onChange({ q: "" })}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted hover:text-ink"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <select
        aria-label="Filter by participant"
        value={filters.participantId}
        onChange={(e) => onChange({ participantId: e.target.value })}
        className={`${control} max-w-[200px]`}
      >
        <option value="">All participants</option>
        {participants.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2 text-sm text-muted">
        <input
          type="date"
          aria-label="From date"
          value={filters.dateFrom}
          max={filters.dateTo || undefined}
          onChange={(e) => onChange({ dateFrom: e.target.value })}
          className={control}
        />
        <span aria-hidden>to</span>
        <input
          type="date"
          aria-label="To date"
          value={filters.dateTo}
          min={filters.dateFrom || undefined}
          onChange={(e) => onChange({ dateTo: e.target.value })}
          className={control}
        />
      </div>

      <select
        aria-label="Sort meetings"
        value={filters.sort}
        onChange={(e) => onChange({ sort: e.target.value as Filters["sort"] })}
        className={control}
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
      </select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  );
}

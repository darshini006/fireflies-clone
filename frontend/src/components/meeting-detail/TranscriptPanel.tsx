"use client";

import { ChevronDown, ChevronUp, LocateFixed, MessageSquareText, Search, X } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { formatClock } from "@/lib/format";
import { countMatches, splitMatches } from "@/lib/search";
import type { Segment } from "@/lib/types";

interface LineProps {
  index: number;
  segment: Segment;
  active: boolean;
  needle: string;
  /** Which occurrence in this line is the "current" search match (-1 if none). */
  activeLocal: number;
  onSeek: (ms: number) => void;
}

const TranscriptLine = memo(function TranscriptLine({ index, segment, active, needle, activeLocal, onSeek }: LineProps) {
  const name = segment.speaker?.name ?? "Unknown speaker";

  // Highlight every match; the current one gets a stronger colour.
  let occurrence = 0;
  const pieces = splitMatches(segment.text, needle).map((piece, i) => {
    if (!piece.match) return <span key={i}>{piece.text}</span>;
    const isCurrent = occurrence === activeLocal;
    occurrence += 1;
    return (
      <mark key={i} className={cn("rounded px-0.5 text-ink", isCurrent ? "bg-amber-300" : "bg-amber-100")}>
        {piece.text}
      </mark>
    );
  });

  return (
    <div
      data-seg={index}
      className={cn(
        "flex gap-3 rounded-xl px-3 py-2.5 transition-colors",
        active ? "bg-brand-50 ring-1 ring-brand-200" : "hover:bg-canvas",
      )}
    >
      <Avatar name={name} id={segment.speaker?.id} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-ink">{name}</span>
          <button
            type="button"
            onClick={() => onSeek(segment.start_ms)}
            aria-label={`Play from ${formatClock(segment.start_ms)}`}
            className="text-xs tabular-nums text-accent hover:underline"
          >
            {formatClock(segment.start_ms)}
          </button>
        </div>
        <p
          onClick={() => {
            // Don't jump around when the person is just selecting text to copy.
            if (window.getSelection()?.toString()) return;
            onSeek(segment.start_ms);
          }}
          className={cn("mt-0.5 cursor-pointer text-[15px] leading-relaxed", active ? "text-ink" : "text-ink-soft")}
        >
          {pieces}
        </p>
      </div>
    </div>
  );
});

interface Props {
  segments: Segment[];
  activeIndex: number;
  onSeek: (ms: number) => void;
  className?: string;
}

function TranscriptPanelImpl({ segments, activeIndex, onSeek, className }: Props) {
  const [query, setQuery] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);
  const [follow, setFollow] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const needle = query.trim();
  const counts = useMemo(
    () => (needle ? segments.map((s) => countMatches(s.text, needle)) : []),
    [segments, needle],
  );
  const totalMatches = useMemo(() => counts.reduce((a, b) => a + b, 0), [counts]);

  // Turn the global match number into "which line, which occurrence in that line".
  const current = useMemo(() => {
    let remaining = matchIndex;
    for (let i = 0; i < counts.length; i++) {
      if (remaining < counts[i]) return { segment: i, local: remaining };
      remaining -= counts[i];
    }
    return { segment: -1, local: -1 };
  }, [counts, matchIndex]);

  const ensureVisible = useCallback((index: number, center = false) => {
    const box = scrollRef.current;
    if (!box || index < 0) return;
    const el = box.querySelector<HTMLElement>(`[data-seg="${index}"]`);
    if (!el) return;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    const fullyVisible = top >= box.scrollTop && bottom <= box.scrollTop + box.clientHeight;
    if (fullyVisible && !center) return;
    box.scrollTo({ top: top - box.clientHeight / 2 + el.offsetHeight / 2, behavior: "smooth" });
  }, []);

  // Keep the line that's being spoken in view.
  useEffect(() => {
    if (follow && activeIndex >= 0) ensureVisible(activeIndex);
  }, [activeIndex, follow, ensureVisible]);

  // Jump to the current search match.
  useEffect(() => {
    if (current.segment >= 0) ensureVisible(current.segment, true);
  }, [current.segment, current.local, needle, ensureVisible]);

  const step = (delta: number) => {
    if (totalMatches === 0) return;
    setMatchIndex((i) => (i + delta + totalMatches) % totalMatches);
  };

  return (
    <section className={cn("flex min-h-0 flex-col rounded-2xl border border-line bg-surface", className)}>
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <h2 className="mr-auto text-base font-semibold text-ink">Transcript</h2>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            aria-label="Search the transcript"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setMatchIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                step(e.shiftKey ? -1 : 1);
              }
            }}
            placeholder="Search transcript"
            className="h-9 w-52 rounded-lg border border-line bg-surface pr-8 pl-8 text-sm text-ink placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear transcript search"
              onClick={() => {
                setQuery("");
                setMatchIndex(0);
              }}
              className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1 text-muted hover:text-ink"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {needle && (
          <div className="flex items-center gap-1 text-sm text-ink-soft">
            <span className="min-w-[64px] text-center tabular-nums" aria-live="polite">
              {totalMatches === 0 ? "No matches" : `${matchIndex + 1} of ${totalMatches}`}
            </span>
            <button
              type="button"
              aria-label="Previous match"
              disabled={totalMatches === 0}
              onClick={() => step(-1)}
              className="rounded p-1 hover:bg-canvas disabled:opacity-40"
            >
              <ChevronUp className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Next match"
              disabled={totalMatches === 0}
              onClick={() => step(1)}
              className="rounded p-1 hover:bg-canvas disabled:opacity-40"
            >
              <ChevronDown className="size-4" />
            </button>
          </div>
        )}

        <button
          type="button"
          aria-pressed={follow}
          onClick={() => setFollow((f) => !f)}
          title="Scroll the transcript along with playback"
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition-colors",
            follow
              ? "border-brand-200 bg-brand-50 text-accent-strong"
              : "border-line text-ink-soft hover:bg-canvas",
          )}
        >
          <LocateFixed className="size-4" aria-hidden />
          Follow
        </button>
      </div>

      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto p-2">
        {segments.length === 0 ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center px-6 text-center">
            <MessageSquareText className="mb-3 size-8 text-brand-300" aria-hidden />
            <p className="text-sm font-medium text-ink">No transcript for this meeting</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              Meetings created without a pasted transcript have nothing to show here.
            </p>
          </div>
        ) : (
          segments.map((segment, i) => (
            <TranscriptLine
              key={segment.id}
              index={i}
              segment={segment}
              active={i === activeIndex}
              needle={needle}
              activeLocal={i === current.segment ? current.local : -1}
              onSeek={onSeek}
            />
          ))
        )}
      </div>
    </section>
  );
}

export const TranscriptPanel = memo(TranscriptPanelImpl);

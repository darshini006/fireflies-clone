"use client";

import { Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { formatClock } from "@/lib/format";
import { speakerColor } from "@/lib/speakers";
import type { Segment } from "@/lib/types";

interface Props {
  currentMs: number;
  durationMs: number;
  playing: boolean;
  rate: number;
  segments: Segment[];
  onToggle: () => void;
  onSeek: (ms: number) => void;
  onSkip: (deltaMs: number) => void;
  onCycleRate: () => void;
}

const roundButton =
  "relative inline-flex size-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-brand-50 hover:text-accent-strong disabled:cursor-not-allowed disabled:opacity-50";

export function MediaPlayer({
  currentMs,
  durationMs,
  playing,
  rate,
  segments,
  onToggle,
  onSeek,
  onSkip,
  onCycleRate,
}: Props) {
  const disabled = durationMs <= 0;
  const progress = disabled ? 0 : Math.min(100, (currentMs / durationMs) * 100);

  // Coloured blocks showing who was talking when (a simplified version of Fireflies' talk-time bar).
  const talkStrip = useMemo(
    () =>
      disabled
        ? null
        : segments.map((seg) => (
            <span
              key={seg.id}
              className={cn("absolute inset-y-0 opacity-80", speakerColor(seg.speaker?.id).bar)}
              style={{
                left: `${(seg.start_ms / durationMs) * 100}%`,
                width: `${Math.max(0.3, ((seg.end_ms - seg.start_ms) / durationMs) * 100)}%`,
              }}
            />
          )),
    [segments, durationMs, disabled],
  );

  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label="Back 10 seconds"
            disabled={disabled}
            onClick={() => onSkip(-10_000)}
            className={roundButton}
          >
            <RotateCcw className="size-[18px]" aria-hidden />
            <span className="absolute text-[8px] font-bold">10</span>
          </button>
          <button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
            disabled={disabled}
            onClick={onToggle}
            className="inline-flex size-11 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {playing ? <Pause className="size-5" aria-hidden /> : <Play className="size-5 translate-x-px" aria-hidden />}
          </button>
          <button
            type="button"
            aria-label="Forward 10 seconds"
            disabled={disabled}
            onClick={() => onSkip(10_000)}
            className={roundButton}
          >
            <RotateCw className="size-[18px]" aria-hidden />
            <span className="absolute text-[8px] font-bold">10</span>
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <input
            type="range"
            className="seek"
            aria-label="Seek"
            min={0}
            max={Math.max(1, durationMs)}
            step={100}
            value={Math.round(currentMs)}
            disabled={disabled}
            onChange={(e) => onSeek(Number(e.target.value))}
            style={{ "--progress": `${progress}%` } as React.CSSProperties}
          />
          <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-canvas" aria-hidden>
            {talkStrip}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm tabular-nums text-ink-soft">
            {formatClock(currentMs)} <span className="text-muted">/ {formatClock(durationMs)}</span>
          </span>
          <button
            type="button"
            onClick={onCycleRate}
            disabled={disabled}
            aria-label={`Playback speed ${rate}x. Click to change.`}
            className="h-8 min-w-[44px] rounded-lg border border-line px-2 text-sm font-medium tabular-nums text-ink-soft hover:bg-canvas disabled:opacity-50"
          >
            {rate}x
          </button>
        </div>
      </div>
      {disabled && (
        <p className="mt-2 text-sm text-muted">
          This meeting has no duration or transcript yet, so there&apos;s nothing to play.
        </p>
      )}
    </div>
  );
}
